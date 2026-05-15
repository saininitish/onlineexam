import { Request, Response } from 'express';
import { generateAIQuestions, generateAIExplanation, generateAIStudyPlan } from '../services/aiService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const handleGenerateQuestions = async (req: Request, res: Response) => {
  try {
    const { subject, topic, difficulty, count, context, standard } = req.body;
    console.log(`[AI] Requesting questions for: ${subject} -> ${topic}`);
    const questions = await generateAIQuestions(subject, topic, difficulty, count, context, standard);
    res.json(questions);
  } catch (error: any) {
    console.error('[AI] Generation Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const handleExplainQuestion = async (req: Request, res: Response) => {
  try {
    const { question, correctAnswer, options } = req.body;
    console.log('[AI Explain] Request:', { question, correctAnswer, options });
    const explanation = await generateAIExplanation(question, correctAnswer, options);
    console.log('[AI Explain] Success:', explanation.substring(0, 50) + '...');
    res.json({ explanation });
  } catch (error: any) {
    console.error('[AI Explain] Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const handleGetAIStudyPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { performanceData } = req.body;
    const studyPlan = await generateAIStudyPlan(performanceData);
    res.json(studyPlan);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
