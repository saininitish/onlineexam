import { Router } from 'express';
import { createTest, getTests, updateTest, deleteTest, addQuestion, bulkAddQuestions, getQuestionsByTest, updateQuestion, deleteQuestion, getResults, getStudents } from '../controllers/testController.js';
import { handleGenerateQuestions } from '../controllers/aiController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate, isAdmin);

// Test CRUD
router.post('/tests', createTest);
router.get('/tests', getTests);
router.get('/students', getStudents);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);

// Question CRUD
router.post('/questions', addQuestion);
router.post('/questions/bulk', bulkAddQuestions);
router.get('/questions/:testId', getQuestionsByTest);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// Results
router.get('/results', getResults);

// AI Generation
router.post('/ai/generate-questions', handleGenerateQuestions);

export default router;
