const pool = require('../config/db');
const redis = require('../config/redis');
const { generateTokenQRString, generateQRImage, generateEntranceQR } = require('../utils/qrGenerator');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

const QUEUE_KEY = (queueId) => `queue:${queueId}`;
const QUEUE_SERVING = (queueId) => `queue:${queueId}:serving`;

/**
 * Sync queue state from DB to Redis on startup
 */
const syncQueueToRedis = async (queueId) => {
  const result = await pool.query(`SELECT * FROM queues WHERE id = $1`, [queueId]);
  if (!result.rows[0]) return;
  const queue = result.rows[0];
  await redis.hmset(QUEUE_KEY(queueId), {
    status: queue.status,
    current_serving: queue.current_serving.toString(),
    total_issued: queue.total_issued.toString(),
    slot_size: queue.slot_size.toString(),
    avg_wait_minutes: queue.avg_wait_minutes.toString(),
  });
};

/**
 * Get live queue state (Redis first, fallback to DB)
 */
const getQueueState = async (queueId) => {
  const cached = await redis.hgetall(QUEUE_KEY(queueId));
  if (cached && Object.keys(cached).length > 0) {
    return {
      currentServing: parseInt(cached.current_serving),
      totalIssued: parseInt(cached.total_issued),
      slotSize: parseInt(cached.slot_size),
      avgWaitMinutes: parseInt(cached.avg_wait_minutes),
      status: cached.status,
    };
  }
  // Fallback to DB
  const result = await pool.query(`SELECT * FROM queues WHERE id = $1`, [queueId]);
  if (!result.rows[0]) throw new Error('Queue not found');
  const q = result.rows[0];
  await syncQueueToRedis(queueId);
  return {
    currentServing: q.current_serving,
    totalIssued: q.total_issued,
    slotSize: q.slot_size,
    avgWaitMinutes: q.avg_wait_minutes,
    status: q.status,
  };
};

/**
 * Issue a new token to a user
 */
const issueToken = async (queueId, userId, io) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check queue status
    const queueResult = await client.query(
      `SELECT q.*, t.name as temple_name FROM queues q 
       JOIN temples t ON q.temple_id = t.id
       WHERE q.id = $1 FOR UPDATE`,
      [queueId]
    );
    const queue = queueResult.rows[0];
    if (!queue) throw new Error('Queue not found');
    if (queue.status !== 'active') throw new Error(`Queue is currently ${queue.status}`);
    if (queue.total_issued >= queue.max_capacity) throw new Error('Queue is full');

    // Check if user already has an active token
    const existing = await client.query(
      `SELECT * FROM tokens WHERE queue_id = $1 AND user_id = $2 AND status IN ('waiting', 'called')`,
      [queueId, userId]
    );
    if (existing.rows.length > 0) {
      throw new Error('You already have an active token for this queue');
    }

    // Increment token number
    const tokenNumber = queue.total_issued + 1;
    const qrString = generateTokenQRString(`${userId}-${tokenNumber}`, queueId);
    const qrImage = await generateQRImage(qrString);

    // Calculate estimated wait
    const position = tokenNumber - queue.current_serving;
    const waitMinutes = Math.max(0, position * queue.avg_wait_minutes);
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    // Insert token
    const tokenResult = await client.query(
      `INSERT INTO tokens (queue_id, user_id, token_number, qr_code, qr_image_base64, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [queueId, userId, tokenNumber, qrString, qrImage, expiresAt]
    );

    // Update queue total_issued
    await client.query(
      `UPDATE queues SET total_issued = total_issued + 1, updated_at = NOW() WHERE id = $1`,
      [queueId]
    );

    await client.query('COMMIT');

    // Update Redis
    await redis.hincrby(QUEUE_KEY(queueId), 'total_issued', 1);

    // Emit real-time update
    if (io) {
      io.to(`queue:${queueId}`).emit('queue:update', {
        queueId,
        totalIssued: tokenNumber,
        currentServing: queue.current_serving,
      });
    }

    // Send notification
    const userResult = await pool.query(`SELECT phone FROM users WHERE id = $1`, [userId]);
    if (userResult.rows[0]) {
      await notificationService.notifyTokenIssued(
        userResult.rows[0].phone,
        tokenNumber,
        queue.name,
        waitMinutes
      );
    }

    return {
      token: tokenResult.rows[0],
      position,
      waitMinutes,
      templeName: queue.temple_name,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Advance queue (admin action) - mark next batch as "called"
 */
const advanceQueue = async (queueId, io) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const queueResult = await client.query(
      `SELECT * FROM queues WHERE id = $1 FOR UPDATE`,
      [queueId]
    );
    const queue = queueResult.rows[0];
    if (!queue) throw new Error('Queue not found');

    const newServing = queue.current_serving + 1;

    // Update queue
    await client.query(
      `UPDATE queues SET current_serving = $1, updated_at = NOW() WHERE id = $2`,
      [newServing, queueId]
    );

    // Mark token as "called"
    const tokenResult = await client.query(
      `UPDATE tokens SET status = 'called', called_at = NOW(), notified_called = true
       WHERE queue_id = $1 AND token_number = $2 AND status = 'waiting'
       RETURNING *`,
      [queueId, newServing]
    );

    // Notify tokens that are getting close (10 ahead)
    const nearTokens = await client.query(
      `SELECT t.*, u.phone FROM tokens t
       JOIN users u ON t.user_id = u.id
       WHERE t.queue_id = $1 
       AND t.token_number = $2 
       AND t.status = 'waiting'
       AND t.notified_near = false`,
      [queueId, newServing + 10]
    );

    await client.query('COMMIT');

    // Update Redis
    await redis.hincrby(QUEUE_KEY(queueId), 'current_serving', 1);

    // Emit realtime events
    if (io) {
      io.to(`queue:${queueId}`).emit('queue:update', {
        queueId,
        currentServing: newServing,
        totalIssued: queue.total_issued,
      });

      if (tokenResult.rows[0]) {
        io.to(`token:${tokenResult.rows[0].id}`).emit('token:called', {
          tokenId: tokenResult.rows[0].id,
          tokenNumber: newServing,
        });
      }
    }

    // Send notifications
    if (tokenResult.rows.length > 0) {
      const calledToken = tokenResult.rows[0];
      const userResult = await pool.query(`SELECT phone FROM users WHERE id = $1`, [calledToken.user_id]);
      if (userResult.rows[0]) {
        const queueNameResult = await pool.query(`SELECT name FROM queues WHERE id = $1`, [queueId]);
        await notificationService.notifyCalledToGate(
          userResult.rows[0].phone,
          newServing,
          queueNameResult.rows[0]?.name
        );
      }
    }

    // Notify near tokens
    for (const nearToken of nearTokens.rows) {
      await notificationService.notifyNearTurn(nearToken.phone, nearToken.token_number, queue.name, 10);
      await pool.query(`UPDATE tokens SET notified_near = true WHERE id = $1`, [nearToken.id]);
    }

    return { newServing, calledToken: tokenResult.rows[0] || null };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get position of a token in the queue
 */
const getTokenPosition = async (tokenId) => {
  const result = await pool.query(
    `SELECT t.*, q.current_serving, q.avg_wait_minutes, q.name as queue_name,
            te.name as temple_name
     FROM tokens t
     JOIN queues q ON t.queue_id = q.id
     JOIN temples te ON q.temple_id = te.id
     WHERE t.id = $1`,
    [tokenId]
  );
  if (!result.rows[0]) throw new Error('Token not found');
  const token = result.rows[0];
  const position = Math.max(0, token.token_number - token.current_serving);
  const waitMinutes = position * token.avg_wait_minutes;
  return { ...token, position, waitMinutes };
};

module.exports = {
  issueToken,
  advanceQueue,
  getQueueState,
  getTokenPosition,
  syncQueueToRedis,
};
