const pool = require('../config/db');
const queueService = require('../services/queue.service');
const { generateEntranceQR } = require('../utils/qrGenerator');

/**
 * POST /api/admin/temples
 * Create a new temple
 */
const createTemple = async (req, res, next) => {
  try {
    const { name, location, city, state } = req.body;
    const result = await pool.query(
      `INSERT INTO temples (name, location, city, state, admin_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, location, city, state, req.user.id]
    );
    res.status(201).json({ success: true, temple: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/temples
 * Get temples managed by this admin
 */
const getTemples = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
              COUNT(DISTINCT q.id) as queue_count,
              SUM(q.total_issued) as total_tokens_today
       FROM temples t
       LEFT JOIN queues q ON q.temple_id = t.id
       WHERE t.admin_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, temples: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/queues
 * Create a new queue for a temple
 */
const createQueue = async (req, res, next) => {
  try {
    const { templeId, name, description, slotSize, avgWaitMinutes, maxCapacity } = req.body;

    // Verify admin owns this temple
    const templeCheck = await pool.query(
      `SELECT id FROM temples WHERE id = $1 AND admin_id = $2`,
      [templeId, req.user.id]
    );
    if (!templeCheck.rows[0]) {
      return res.status(403).json({ success: false, message: 'Temple not found or access denied' });
    }

    // Create queue
    const result = await pool.query(
      `INSERT INTO queues (temple_id, name, description, slot_size, avg_wait_minutes, max_capacity)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [templeId, name, description, slotSize || 10, avgWaitMinutes || 5, maxCapacity || 1000]
    );
    const queue = result.rows[0];

    // Generate entrance QR
    const { data: entranceQRData, qrBase64: entranceQRImage } = await generateEntranceQR(
      queue.id,
      name
    );
    await pool.query(
      `UPDATE queues SET entrance_qr = $1 WHERE id = $2`,
      [entranceQRData, queue.id]
    );

    // Sync to Redis
    await queueService.syncQueueToRedis(queue.id);

    res.status(201).json({
      success: true,
      queue: { ...queue, entrance_qr: entranceQRData },
      entranceQRImage,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/queues/:templeId
 * Get all queues for a temple with live stats
 */
const getTempleQueues = async (req, res, next) => {
  try {
    const { templeId } = req.params;
    const result = await pool.query(
      `SELECT q.*,
              COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting_count,
              COUNT(CASE WHEN t.status = 'called' THEN 1 END) as called_count,
              COUNT(CASE WHEN t.status = 'entered' THEN 1 END) as entered_count
       FROM queues q
       LEFT JOIN tokens t ON t.queue_id = q.id
       WHERE q.temple_id = $1
       GROUP BY q.id
       ORDER BY q.created_at`,
      [templeId]
    );
    res.json({ success: true, queues: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/queues/:id/status
 * Pause / Resume / Close queue
 */
const updateQueueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'paused', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await pool.query(
      `UPDATE queues SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    // Update Redis
    const redis = require('../config/redis');
    await redis.hset(`queue:${id}`, 'status', status);

    // Emit to clients
    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${id}`).emit('queue:status_change', { queueId: id, status });
    }

    res.json({ success: true, message: `Queue ${status}` });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/queues/:id/advance
 * Manually advance queue
 */
const advanceQueue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const io = req.app.get('io');
    const result = await queueService.advanceQueue(id, io);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/queues/:id/analytics
 * Queue analytics for admin dashboard
 */
const getQueueAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const stats = await pool.query(
      `SELECT 
         COUNT(*) as total_tokens,
         COUNT(CASE WHEN status = 'entered' THEN 1 END) as entered,
         COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
         COUNT(CASE WHEN status = 'called' THEN 1 END) as called,
         COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
         COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
         AVG(EXTRACT(EPOCH FROM (entered_at - issued_at))/60) as avg_wait_actual_mins
       FROM tokens
       WHERE queue_id = $1 AND DATE(issued_at) = $2`,
      [id, today]
    );

    // Hourly breakdown
    const hourly = await pool.query(
      `SELECT 
         EXTRACT(HOUR FROM issued_at) as hour,
         COUNT(*) as count
       FROM tokens
       WHERE queue_id = $1 AND DATE(issued_at) = $2
       GROUP BY hour ORDER BY hour`,
      [id, today]
    );

    res.json({
      success: true,
      analytics: {
        today: stats.rows[0],
        hourlyBreakdown: hourly.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/users/gate-operator
 * Add a gate operator to a temple
 */
const addGateOperator = async (req, res, next) => {
  try {
    const { phone, name } = req.body;
    const result = await pool.query(
      `INSERT INTO users (phone, name, role) VALUES ($1, $2, 'gate_operator')
       ON CONFLICT (phone) DO UPDATE SET role = 'gate_operator', name = COALESCE($2, users.name)
       RETURNING id, phone, name, role`,
      [phone, name]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTemple,
  getTemples,
  createQueue,
  getTempleQueues,
  updateQueueStatus,
  advanceQueue,
  getQueueAnalytics,
  addGateOperator,
};
