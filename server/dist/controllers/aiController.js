import { generateAIQuestions, generateAIExplanation, generateAIStudyPlan } from '../services/aiService.js';
export const handleGenerateQuestions = async (req, res) => {
    try {
        const { topic, difficulty, count } = req.body;
        const questions = await generateAIQuestions(topic, difficulty, count);
        res.json(questions);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const handleExplainQuestion = async (req, res) => {
    try {
        const { question, correctAnswer, options } = req.body;
        console.log('[AI Explain] Request:', { question, correctAnswer, options });
        const explanation = await generateAIExplanation(question, correctAnswer, options);
        console.log('[AI Explain] Success:', explanation.substring(0, 50) + '...');
        res.json({ explanation });
    }
    catch (error) {
        console.error('[AI Explain] Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
export const handleGetAIStudyPlan = async (req, res) => {
    try {
        const { performanceData } = req.body;
        const studyPlan = await generateAIStudyPlan(performanceData);
        res.json(studyPlan);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
