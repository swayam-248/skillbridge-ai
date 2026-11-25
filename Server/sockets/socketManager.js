const { Server } = require('socket.io');

let io = null;
const latestBookingLocations = new Map(); // bookingId -> coords

function initSocket(httpServer, clientUrl) {
  io = new Server(httpServer, {
    cors: {
      origin: [clientUrl || 'http://localhost:5173', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // User joins their personal room based on their userId
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${String(userId)}`);
        console.log(`Socket ${socket.id} joined user:${String(userId)}`);
      }
    });

    // Join active booking room
    socket.on('chat:join', (bookingId) => {
      if (bookingId) {
        socket.join(`booking:chat:${bookingId}`);
        console.log(`Socket ${socket.id} joined booking:chat:${bookingId}`);
      }
    });

    // Leave active booking room
    socket.on('chat:leave', (bookingId) => {
      if (bookingId) {
        socket.leave(`booking:chat:${bookingId}`);
      }
    });

    // Real-Time Uber GPS streaming: Worker broadcasts live moving coordinates to customer
    socket.on('worker:stream_location', (data) => {
      const { bookingId, recipientId, coords } = data || {};
      if (bookingId && coords) {
        latestBookingLocations.set(String(bookingId), coords);
      }
      if (recipientId && coords) {
        notifyUser(String(recipientId), 'worker:live_location', {
          bookingId,
          coords,
          timestamp: Date.now()
        });
      }
      if (bookingId && coords) {
        socket.to(`booking:chat:${bookingId}`).emit('worker:live_location', {
          bookingId,
          coords,
          timestamp: Date.now()
        });
      }
    });

    // Customer requests latest worker coordinates upon opening live map
    socket.on('worker:request_location', (data) => {
      const { bookingId, workerId } = data || {};
      if (bookingId && latestBookingLocations.has(String(bookingId))) {
        socket.emit('worker:live_location', {
          bookingId,
          coords: latestBookingLocations.get(String(bookingId)),
          timestamp: Date.now()
        });
      }
      // Also prompt the worker's device to stream fresh GPS coordinates
      if (workerId) {
        notifyUser(String(workerId), 'worker:request_location_broadcast', { bookingId });
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

function getIO() {
  return io;
}

function notifyUser(userId, event, payload) {
  if (io && userId) {
    io.to(`user:${String(userId)}`).emit(event, payload);
  }
}

function broadcastAll(event, payload) {
  if (io) {
    io.emit(event, payload);
  }
}

module.exports = {
  initSocket,
  getIO,
  notifyUser,
  broadcastAll,
  latestBookingLocations
};
