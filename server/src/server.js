import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import testRoutes from './routes/testRoutes';
import studentRoutes from './routes/studentRoutes';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', testRoutes);
app.use('/api/student', studentRoutes);
app.get('/', (req, res) => {
    res.send('Online Mock Test API is running...');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map