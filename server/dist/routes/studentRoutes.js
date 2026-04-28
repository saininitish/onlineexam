import { Router } from 'express';
import { getTestById, submitTest, getAvailableTests, getAttempts, getAttemptDetails, getLeaderboard, getStudentDashboard, reportTestHeartbeat } from '../controllers/studentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
const router = Router();
router.use(authenticate);
router.post('/test-heartbeat', reportTestHeartbeat);
router.get('/dashboard', getStudentDashboard);
router.get('/tests', getAvailableTests);
router.get('/test/:id', getTestById);
router.post('/submit', submitTest);
router.get('/attempts', getAttempts);
router.get('/attempt/:id', getAttemptDetails);
router.get('/leaderboard/:testId', getLeaderboard);
// AI Features
import { handleExplainQuestion, handleGetAIStudyPlan } from '../controllers/aiController.js';
router.post('/ai/explain', handleExplainQuestion);
router.post('/ai/study-plan', handleGetAIStudyPlan);
export default router;
