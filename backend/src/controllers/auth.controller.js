const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { generateOTP, saveOTP, verifyOTP } = require('../services/otp.service');
const { notifyOTP } = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number
 */
const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });

    const otp = generateOTP();
    await saveOTP(phone, otp);
    await notifyOTP(phone, otp);

    logger.info(`OTP sent to ${phone}`);

    // In dev mode, return OTP in response
    const response = { success: true, message: 'OTP sent successfully' };
    if (process.env.NODE_ENV === 'development') {
      response.otp = otp; // Remove in production!
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return JWT
 */
const verifyOTPAndLogin = async (req, res, next) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const verification = await verifyOTP(phone, otp);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: verification.message });
    }

    // Upsert user
    const result = await pool.query(
      `INSERT INTO users (phone, name) VALUES ($1, $2)
       ON CONFLICT (phone) DO UPDATE SET name = COALESCE(EXCLUDED.name, users.name), updated_at = NOW()
       RETURNING *`,
      [phone, name || null]
    );
    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, phone, name, role, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendOTP, verifyOTPAndLogin, getMe };
