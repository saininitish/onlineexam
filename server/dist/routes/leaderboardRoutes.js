import { Router } from 'express';
import { getGlobalLeaderboard, getWeeklyLeaderboard } from '../controllers/leaderboardController.js';
const router = Router();
// Publicly accessible leaderboards or authenticated? 
// Usually leaderboards are public or at least for all students.
router.get('/global', getGlobalLeaderboard);
router.get('/weekly', getWeeklyLeaderboard);
export default router;
