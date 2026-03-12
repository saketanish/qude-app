const pool = require('../config/db');
const logger = require('../utils/logger');

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Save OTP to database
 */
const saveOTP = async (phone, otp) => {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Invalidate old OTPs for this phone
  await pool.query(`UPDATE otps SET is_used = true WHERE phone = $1 AND is_used = false`, [phone]);

  // Insert new OTP
  await pool.query(
    `INSERT INTO otps (phone, otp, expires_at) VALUES ($1, $2, $3)`,
    [phone, otp, expiresAt]
  );
};

/**
 * Verify OTP
 */
const verifyOTP = async (phone, otp) => {
  const result = await pool.query(
    `SELECT * FROM otps 
     WHERE phone = $1 AND otp = $2 AND is_used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [phone, otp]
  );

  if (result.rows.length === 0) {
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  // Mark as used
  await pool.query(`UPDATE otps SET is_used = true WHERE id = $1`, [result.rows[0].id]);
  return { valid: true };
};

module.exports = { generateOTP, saveOTP, verifyOTP };
