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

// 1. Socket.io Setup (Standard Pattern)
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Fully open for debugging
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket']
});

io.on('connection', (socket) => {
  console.log('✅ User connected to socket:', socket.id);

  socket.on('student-ready', (data) => {
    const { roomId } = data;
    socket.join(roomId);
    io.to(roomId).emit('student-joined', socket.id);
  });

  socket.on('admin-join', (roomId) => {
    socket.join(roomId);
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

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

// 2. Express Middleware
const allowedOrigins = [
  'https://onlineexam-puce.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Still allow for now to debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`[REQ] ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[RES] ${req.method} ${req.url} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
});

// 3. Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/v1', v1Router);
app.use('/api', v1Router);

app.get('/', (req, res) => {
  res.send('MockMaster Scalable API v1 is running...');
});

// 4. Error Handling (Moved after routes)
app.use((err: any, req: any, res: any, next: any) => {
  handleError(err, res);
});

// 5. Start Server
const PORT = Number(process.env.PORT) || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('✅ Socket.io initialized and bound to httpServer');
});


