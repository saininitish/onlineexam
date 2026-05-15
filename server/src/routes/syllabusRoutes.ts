import { Router } from 'express';
import { SyllabusService } from '../services/syllabusService.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/upload', authenticate, async (req: any, res) => {
  try {
    const result = await SyllabusService.uploadSyllabus(req.user.id, req.body.rows);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/subjects', authenticate, async (req: any, res) => {
  try {
    const subjects = await SyllabusService.getSubjects(req.user.id);
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/chapters', authenticate, async (req: any, res) => {
  try {
    const { subject } = req.query;
    const chapters = await SyllabusService.getChapters(req.user.id, subject as string);
    res.json(chapters);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/topics', authenticate, async (req: any, res) => {
  try {
    const { subject, chapter } = req.query;
    const topics = await SyllabusService.getTopics(req.user.id, subject as string, chapter as string);
    res.json(topics);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
