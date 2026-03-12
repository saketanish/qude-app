const express = require('express');
const router = express.Router();

const { sendOTP, verifyOTPAndLogin, getMe } = require('../controllers/auth.controller');
const { getQueue, joinQueue, getMyToken, leaveQueue, getQueueStatus } = require('../controllers/queue.controller');
const { scanQR, getEntryLogs } = require('../controllers/gate.controller');
const {
  createTemple, getTemples, createQueue, getTempleQueues,
  updateQueueStatus, advanceQueue, getQueueAnalytics, addGateOperator
} = require('../controllers/admin.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

// Rate limiters
const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: 'Too many OTP requests' });
const scanLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

// ─── Auth Routes ──────────────────────────────────────────────────────────────
router.post('/auth/send-otp', otpLimiter, sendOTP);
router.post('/auth/verify-otp', verifyOTPAndLogin);
router.get('/auth/me', authMiddleware, getMe);

// ─── Queue Routes (Devotee) ───────────────────────────────────────────────────
router.get('/queues/:id/status', getQueueStatus);               // Public
router.get('/queues/:id', authMiddleware, getQueue);
router.post('/queues/:id/join', authMiddleware, joinQueue);
router.get('/queues/:id/my-token', authMiddleware, getMyToken);
router.delete('/queues/:id/leave', authMiddleware, leaveQueue);

// ─── Gate Routes ──────────────────────────────────────────────────────────────
router.post('/gate/scan', authMiddleware, requireRole('gate_operator', 'admin'), scanLimiter, scanQR);
router.get('/gate/logs', authMiddleware, requireRole('gate_operator', 'admin'), getEntryLogs);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.post('/admin/temples', authMiddleware, requireRole('admin'), createTemple);
router.get('/admin/temples', authMiddleware, requireRole('admin'), getTemples);
router.post('/admin/queues', authMiddleware, requireRole('admin'), createQueue);
router.get('/admin/queues/:templeId', authMiddleware, requireRole('admin'), getTempleQueues);
router.patch('/admin/queues/:id/status', authMiddleware, requireRole('admin'), updateQueueStatus);
router.post('/admin/queues/:id/advance', authMiddleware, requireRole('admin'), advanceQueue);
router.get('/admin/queues/:id/analytics', authMiddleware, requireRole('admin'), getQueueAnalytics);
router.post('/admin/gate-operators', authMiddleware, requireRole('admin'), addGateOperator);

module.exports = router;
