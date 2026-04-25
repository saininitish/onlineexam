import { Router } from 'express';
import { createTest, getTests, addQuestion, getResults } from '../controllers/testController';
import { authenticate, isAdmin } from '../middleware/authMiddleware';
const router = Router();
router.use(authenticate, isAdmin);
router.post('/tests', createTest);
router.get('/tests', getTests);
router.post('/questions', addQuestion);
router.get('/results', getResults);
export default router;
//# sourceMappingURL=testRoutes.js.map