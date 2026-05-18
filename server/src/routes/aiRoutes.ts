import { Router } from 'express';
import { generateAIQuestions, generateAIExplanation, generateAIStudyPlan, generateAIStudyMaterial, generateBattleRoastAndAnalysis } from '../services/aiService.js';

const router = Router();

router.post('/generate-questions', async (req, res) => {
  try {
    const { subject, topic, difficulty, count, context, standard } = req.body;
    if (!topic || !difficulty) {
      return res.status(400).json({ message: "Topic and difficulty are required" });
    }
    const questions = await generateAIQuestions(subject || 'General', topic, difficulty, count, context || '', standard || 'UG Level');
    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/explain', async (req, res) => {
  try {
    const { question, correctAnswer, options } = req.body;
    const explanation = await generateAIExplanation(question, correctAnswer, options);
    res.json({ explanation });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/study-plan', async (req, res) => {
  try {
    const { performanceData } = req.body;
    const plan = await generateAIStudyPlan(performanceData);
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/generate-notes', async (req, res) => {
  try {
    const { topic, content } = req.body;
    if (!topic) {
      return res.status(400).json({ message: "Topic name is required" });
    }
    const studyMaterial = await generateAIStudyMaterial(topic, content || '');
    res.json({ status: 'success', data: studyMaterial });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/battle-roast', async (req, res) => {
  try {
    const { performanceData } = req.body;
    const roastData = await generateBattleRoastAndAnalysis(performanceData || {});
    res.json({ status: 'success', data: roastData });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
