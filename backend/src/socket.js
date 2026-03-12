const logger = require('./utils/logger');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // ─── Join Rooms ──────────────────────────────────────────────────────────

    // Devotee joins queue room to get live position updates
    socket.on('join:queue', ({ queueId }) => {
      socket.join(`queue:${queueId}`);
      logger.info(`Socket ${socket.id} joined queue:${queueId}`);
    });

    // Devotee joins their personal token room
    socket.on('join:token', ({ tokenId }) => {
      socket.join(`token:${tokenId}`);
      logger.info(`Socket ${socket.id} joined token:${tokenId}`);
    });

    // Admin joins temple room
    socket.on('join:temple', ({ templeId }) => {
      socket.join(`temple:${templeId}`);
      logger.info(`Socket ${socket.id} joined temple:${templeId}`);
    });

    // ─── Leave Rooms ─────────────────────────────────────────────────────────

    socket.on('leave:queue', ({ queueId }) => {
      socket.leave(`queue:${queueId}`);
    });

    socket.on('leave:token', ({ tokenId }) => {
      socket.leave(`token:${tokenId}`);
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  // ─── Server-Side Events (called from controllers) ─────────────────────────
  // These are emitted via io.to(...).emit(...) directly in services/controllers
  // Available events:
  //   queue:update      → { queueId, currentServing, totalIssued }
  //   queue:status_change → { queueId, status }
  //   token:called      → { tokenId, tokenNumber }
  //   token:entered     → { tokenId, tokenNumber, userName, queueName }
};

module.exports = setupSocket;
