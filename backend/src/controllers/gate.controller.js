const gateService = require('../services/gate.service');

/**
 * POST /api/gate/scan
 * Gate operator scans a devotee QR
 */
const scanQR = async (req, res, next) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) return res.status(400).json({ success: false, message: 'QR code is required' });

    const io = req.app.get('io');
    const result = await gateService.validateGateEntry(qrCode, req.user.id, io);

    const statusCode = result.allowed ? 200 : 400;
    res.status(statusCode).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/gate/logs
 * Recent entry logs for gate operator's temple
 */
const getEntryLogs = async (req, res, next) => {
  try {
    const pool = require('../config/db');
    const { limit = 50 } = req.query;

    const result = await pool.query(
      `SELECT el.*, t.token_number, t.queue_id, u.name as user_name, u.phone,
              q.name as queue_name
       FROM entry_logs el
       JOIN tokens t ON el.token_id = t.id
       JOIN users u ON t.user_id = u.id
       JOIN queues q ON el.queue_id = q.id
       WHERE el.gate_operator_id = $1
       ORDER BY el.scanned_at DESC LIMIT $2`,
      [req.user.id, parseInt(limit)]
    );

    res.json({ success: true, logs: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { scanQR, getEntryLogs };
