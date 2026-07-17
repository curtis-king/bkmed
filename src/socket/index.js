const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (httpServer) => {
  const { Server } = require('socket.io');

  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Token manquant.'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Token invalide ou expiré.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✓ Socket connecté: ${socket.user.first_name} ${socket.user.last_name} (${socket.user.id})`);

    socket.join(`user:${socket.user.id}`);

    if (socket.user.roles.includes('ADMIN')) socket.join('admins');
    if (socket.user.roles.includes('MEDECIN')) socket.join('medecins');
    if (socket.user.roles.includes('AGENT_PROXIMITE')) socket.join('agents');

    socket.on('join:request', (requestId) => {
      socket.join(`request:${requestId}`);
    });

    socket.on('leave:request', (requestId) => {
      socket.leave(`request:${requestId}`);
    });

    socket.on('disconnect', () => {
      console.log(`✗ Socket déconnecté: ${socket.user.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO non initialisé.');
  return io;
};

module.exports = { initSocket, getIO };
