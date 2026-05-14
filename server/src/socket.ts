import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    path: '/socket.io/', // Explicitly set path
    cors: {
      origin: "*", // Allow all for debugging, can be restricted later
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true, // Compatibility for older clients if any
    transports: ['polling', 'websocket']
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('student-ready', (data) => {
      const { roomId } = data;
      socket.join(roomId);
      console.log(`Student ${socket.id} is ready in room ${roomId}`);
      // Notify everyone in the room (including admins)
      io.to(roomId).emit('student-joined', socket.id);
    });

    socket.on('admin-join', (roomId) => {
      socket.join(roomId);
      console.log(`Admin ${socket.id} joined room ${roomId}`);
      // Request all students in the room to identify themselves
      socket.to(roomId).emit('discovery-request');
    });



    socket.on('signal', (data) => {
      io.to(data.to).emit('signal', {
        from: socket.id,
        signal: data.signal,
        type: data.type
      });
    });

    socket.on('request-stream', (data) => {
      io.to(data.studentId).emit('request-stream', {
        adminId: socket.id
      });
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        socket.to(room).emit('student-left', socket.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });

    // Battle specific events
    socket.on('join-battle', (data) => {
      const { battleId, userId, userName } = data;
      socket.join(battleId);
      console.log(`User ${userName} (${userId}) joined battle room ${battleId}`);
      socket.to(battleId).emit('opponent-joined', { userId, userName });
    });

    socket.on('battle-ready', (battleId) => {
      io.to(battleId).emit('start-battle');
    });

    socket.on('send-answer', (data) => {
      const { battleId, userId, score, questionIndex } = data;
      socket.to(battleId).emit('opponent-answer', { userId, score, questionIndex });
    });

    socket.on('end-battle', (data) => {
      const { battleId, winnerId } = data;
      io.to(battleId).emit('battle-over', { winnerId });
    });
  });


  return io;
};
