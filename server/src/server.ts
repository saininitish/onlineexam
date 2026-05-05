import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import v1Router from './routes/v1.js';
import { handleError, AppError } from './utils/errorHandler.js';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io Initialization directly in server.ts
console.log('Initializing Socket.io server...');
const io = new Server(httpServer, {
  path: '/socket.io/',
  cors: {
    origin: ["https://onlineexam-vhld.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

io.on('connection', (socket) => {
  console.log('✨ User connected to socket:', socket.id);

  socket.on('student-ready', (data) => {
    const { roomId } = data;
    socket.join(roomId);
    console.log(`Student ${socket.id} joined room ${roomId}`);
    io.to(roomId).emit('student-joined', socket.id);
  });

  socket.on('admin-join', (roomId) => {
    socket.join(roomId);
    console.log(`Admin ${socket.id} joined room ${roomId}`);
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
    console.log('User disconnected from socket:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: (origin, callback) => callback(null, true), // Allow all origins for debugging
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Increased for bulk uploads
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  res.set('Referrer-Policy', 'no-referrer-when-downgrade'); // Less strict for debugging
  if (req.method === 'GET') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }

  next();
});

// Routes
app.use('/api/v1', v1Router);

// Fallback for older API calls (Optional but good for migration)
app.use('/api', v1Router);

app.get('/', (req, res) => {
  res.send('MockMaster Scalable API v1 is running...');
});

// 404 Handler
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  handleError(err, res);
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server scaled and running on port ${PORT}`);
  console.log('✅ Socket.io initialized on httpServer');
});
