const logger = require('../utils/logger');

let twilioClient = null;

// Initialize Twilio only if credentials are present
const getTwilioClient = () => {
  if (!twilioClient) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      logger.warn('⚠️  Twilio credentials not set. Notifications will be logged only.');
      return null;
    }
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

/**
 * Send SMS
 */
const sendSMS = async (to, message) => {
  const client = getTwilioClient();
  if (!client) {
    logger.info(`[SMS Mock] To: ${to} | Message: ${message}`);
    return { success: true, mock: true };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to.startsWith('+') ? to : `+91${to}`, // Default India code
    });
    logger.info(`SMS sent to ${to}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (err) {
    logger.error(`SMS failed to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send WhatsApp message
 */
const sendWhatsApp = async (to, message) => {
  const client = getTwilioClient();
  const phone = to.startsWith('+') ? to : `+91${to}`;

  if (!client) {
    logger.info(`[WhatsApp Mock] To: ${phone} | Message: ${message}`);
    return { success: true, mock: true };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phone}`,
    });
    logger.info(`WhatsApp sent to ${phone}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (err) {
    logger.error(`WhatsApp failed to ${phone}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ─── Notification Templates ───────────────────────────────────────────────────

const notifyTokenIssued = async (phone, tokenNumber, queueName, waitMinutes) => {
  const msg = `🛕 Qude: Your token #${tokenNumber} is confirmed for ${queueName}. Estimated wait: ~${waitMinutes} mins. Keep this token safe - you'll need it to enter. Reply CANCEL to cancel.`;
  await sendSMS(phone, msg);
  await sendWhatsApp(phone, msg);
};

const notifyNearTurn = async (phone, tokenNumber, queueName, aheadCount) => {
  const msg = `🔔 Qude: You are #${aheadCount} away in ${queueName} queue! Token #${tokenNumber}. Please make your way to the entrance now. Have your QR code ready.`;
  await sendSMS(phone, msg);
  await sendWhatsApp(phone, msg);
};

const notifyCalledToGate = async (phone, tokenNumber, queueName) => {
  const msg = `✅ Qude: Token #${tokenNumber} - YOUR TURN NOW! Please present your QR code at the ${queueName} entrance immediately. Valid for 10 minutes only.`;
  await sendSMS(phone, msg);
  await sendWhatsApp(phone, msg);
};

const notifyTokenExpired = async (phone, tokenNumber) => {
  const msg = `⚠️ Qude: Token #${tokenNumber} has expired as you were not present when called. Please scan the entrance QR to rejoin the queue.`;
  await sendSMS(phone, msg);
};

const notifyOTP = async (phone, otp) => {
  const msg = `Your Qude OTP is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. Do not share this with anyone.`;
  await sendSMS(phone, msg);
};

module.exports = {
  sendSMS,
  sendWhatsApp,
  notifyTokenIssued,
  notifyNearTurn,
  notifyCalledToGate,
  notifyTokenExpired,
  notifyOTP,
};
