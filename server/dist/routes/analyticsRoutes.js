import { Router } from 'express';
import { getStudentPerformanceOverview, getStudentTopicPerformance, getStudentProgressTimeline, getTestPerformanceAnalytics, getTestDifficultyAnalysis, getQuestionDifficultyMetrics, getHardestQuestionsRanking, getGlobalLeaderboard, getTestLeaderboard, getMonthlyLeaderboard, getStudentEngagementMetrics, getTestCompletionRates, getQuestionPerformanceTrends, getAnalyticsDashboard } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
const router = Router();
router.use(authenticate);
// Dashboard Analytics
router.get('/dashboard', getAnalyticsDashboard);
// Student Performance Tracking
router.get('/students/overview', getStudentPerformanceOverview);
router.get('/students/topics', getStudentTopicPerformance);
router.get('/students/progress', getStudentProgressTimeline);
router.get('/students/engagement', getStudentEngagementMetrics);
// Test-wise Analytics
router.get('/tests/performance', getTestPerformanceAnalytics);
router.get('/tests/:testId/difficulty', getTestDifficultyAnalysis);
router.get('/tests/completion-rates', getTestCompletionRates);
// Hard Questions Detection
router.get('/questions/difficulty', getQuestionDifficultyMetrics);
router.get('/questions/hardest', getHardestQuestionsRanking);
router.get('/questions/:questionId/trends', getQuestionPerformanceTrends);
// Leaderboard System
router.get('/leaderboard/global', getGlobalLeaderboard);
router.get('/leaderboard/test/:testId', getTestLeaderboard);
router.get('/leaderboard/monthly', getMonthlyLeaderboard);
export default router;
