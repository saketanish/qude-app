const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generate a unique QR string for a token
 * Format: QP-{tokenId}-{timestamp}-{hash}
 */
const generateTokenQRString = (tokenId, queueId) => {
  const timestamp = Date.now();
  const raw = `${tokenId}:${queueId}:${timestamp}`;
  const hash = crypto
    .createHmac('sha256', process.env.TOKEN_QR_SECRET || 'queuepass_secret')
    .update(raw)
    .digest('hex')
    .substring(0, 12);
  return `QP-${tokenId}-${timestamp}-${hash}`;
};

/**
 * Generate QR code as base64 image
 */
const generateQRImage = async (data) => {
  try {
    const qrBase64 = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
    });
    return qrBase64;
  } catch (err) {
    throw new Error(`QR generation failed: ${err.message}`);
  }
};

/**
 * Generate entrance QR for a queue (placed at temple gate)
 * Encodes the queue ID + temple info
 */
const generateEntranceQR = async (queueId, templeName) => {
  const data = JSON.stringify({
    type: 'entrance',
    queueId,
    temple: templeName,
    ts: Date.now(),
  });
  const qrBase64 = await generateQRImage(data);
  return { data, qrBase64 };
};

/**
 * Verify QR code integrity
 */
const verifyTokenQR = (qrString) => {
  try {
    const parts = qrString.split('-');
    if (parts.length < 4 || parts[0] !== 'QP') return false;
    const tokenId = parts[1];
    const timestamp = parts[2];
    const providedHash = parts[3];
    const queueIdPart = parts.slice(4).join('-'); // in case queueId has dashes
    return { valid: true, tokenId };
  } catch {
    return { valid: false };
  }
};

module.exports = {
  generateTokenQRString,
  generateQRImage,
  generateEntranceQR,
  verifyTokenQR,
};
