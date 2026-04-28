import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import v1Router from './routes/v1.js';
import { handleError, AppError } from './utils/errorHandler.js';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: [
    frontendUrl, 
    /\.vercel\.app$/, // Automatically allow all Vercel deployments
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Consolidated Rate Limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Safe limit for bulk uploads
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=30');
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

app.listen(PORT, () => {
  console.log(`🚀 Server scaled and running on port ${PORT}`);
});
