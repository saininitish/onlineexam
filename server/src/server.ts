import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import testRoutes from './routes/testRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login/register attempts per hour
  message: 'Too many auth attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '12kb' }));
app.use(globalLimiter);

app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=30');
  }
  next();
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', testRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('Online Mock Test API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
