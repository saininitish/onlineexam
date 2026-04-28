import { Router } from 'express';
import { getTestById, submitTest, getAvailableTests, getAttempts } from '../controllers/studentController';
import { authenticate } from '../middleware/authMiddleware';
const router = Router();
router.use(authenticate);
router.get('/tests', getAvailableTests);
router.get('/test/:id', getTestById);
router.post('/submit', submitTest);
router.get('/attempts', getAttempts);
export default router;
//# sourceMappingURL=studentRoutes.js.map