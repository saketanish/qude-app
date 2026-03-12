const pool = require('../config/db');
const logger = require('../utils/logger');

/**
 * Validate a token QR code at the gate
 */
const validateGateEntry = async (qrCode, gateOperatorId, io) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find token by QR code
    const tokenResult = await client.query(
      `SELECT t.*, q.name as queue_name, q.temple_id, u.name as user_name, u.phone
       FROM tokens t
       JOIN queues q ON t.queue_id = q.id
       JOIN users u ON t.user_id = u.id
       WHERE t.qr_code = $1`,
      [qrCode]
    );

    let result, tokenId = null;

    if (tokenResult.rows.length === 0) {
      result = 'invalid';
    } else {
      const token = tokenResult.rows[0];
      tokenId = token.id;

      if (token.status === 'entered') {
        result = 'already_used';
      } else if (token.status === 'expired' || new Date(token.expires_at) < new Date()) {
        result = 'expired';
      } else if (token.status === 'waiting') {
        result = 'not_called';
      } else if (token.status === 'called') {
        // ✅ Valid entry!
        result = 'success';
        await client.query(
          `UPDATE tokens SET status = 'entered', entered_at = NOW() WHERE id = $1`,
          [token.id]
        );

        // Emit to admin dashboard
        if (io) {
          io.to(`temple:${token.temple_id}`).emit('token:entered', {
            tokenId: token.id,
            tokenNumber: token.token_number,
            userName: token.user_name,
            queueName: token.queue_name,
          });
        }
      } else {
        result = 'invalid';
      }

      // Log the entry attempt
      await client.query(
        `INSERT INTO entry_logs (token_id, queue_id, gate_operator_id, result)
         VALUES ($1, $2, $3, $4)`,
        [token.id, token.queue_id, gateOperatorId, result]
      );
    }

    await client.query('COMMIT');

    const token = tokenResult.rows[0];
    return {
      result,
      allowed: result === 'success',
      token: token
        ? {
            tokenNumber: token.token_number,
            userName: token.user_name,
            queueName: token.queue_name,
            status: token.status,
          }
        : null,
      message: getResultMessage(result),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getResultMessage = (result) => {
  const messages = {
    success: '✅ Entry Allowed',
    already_used: '⚠️ Token already used',
    expired: '❌ Token has expired',
    invalid: '❌ Invalid QR Code',
    not_called: '⏳ Not yet called — please wait',
  };
  return messages[result] || 'Unknown result';
};

module.exports = { validateGateEntry };
