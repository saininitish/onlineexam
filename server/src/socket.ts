import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
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
  });


  return io;
};
