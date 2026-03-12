const pool = require('../config/db');
const queueService = require('../services/queue.service');
const { generateEntranceQR } = require('../utils/qrGenerator');

/**
 * GET /api/queues/:id
 * Get queue details + live state
 */
const getQueue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT q.*, t.name as temple_name, t.location, t.city
       FROM queues q JOIN temples t ON q.temple_id = t.id
       WHERE q.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Queue not found' });

    const liveState = await queueService.getQueueState(id);
    res.json({ success: true, queue: { ...result.rows[0], ...liveState } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/queues/:id/join
 * Devotee joins a queue
 */
const joinQueue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const io = req.app.get('io');

    const result = await queueService.issueToken(id, userId, io);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    if (err.message.includes('already have an active token')) {
      return res.status(409).json({ success: false, message: err.message });
    }
    if (err.message.includes('Queue is currently') || err.message.includes('full')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * GET /api/queues/:id/my-token
 * Get current user's active token for a queue
 */
const getMyToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.*, q.current_serving, q.avg_wait_minutes, q.name as queue_name,
              te.name as temple_name
       FROM tokens t
       JOIN queues q ON t.queue_id = q.id
       JOIN temples te ON q.temple_id = te.id
       WHERE t.queue_id = $1 AND t.user_id = $2 AND t.status IN ('waiting','called')`,
      [id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'No active token' });
    }

    const token = result.rows[0];
    const position = Math.max(0, token.token_number - token.current_serving);
    const waitMinutes = position * token.avg_wait_minutes;

    res.json({ success: true, token, position, waitMinutes });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/queues/:id/leave
 * Cancel/leave the queue
 */
const leaveQueue = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE tokens SET status = 'cancelled'
       WHERE queue_id = $1 AND user_id = $2 AND status IN ('waiting','called')`,
      [id, req.user.id]
    );
    res.json({ success: true, message: 'Left queue successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/queues/:id/status
 * Public endpoint - queue status (no auth needed)
 */
const getQueueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const state = await queueService.getQueueState(id);
    res.json({ success: true, ...state });
  } catch (err) {
    next(err);
  }
};

module.exports = { getQueue, joinQueue, getMyToken, leaveQueue, getQueueStatus };
