import { generateAIQuestions, generateAIExplanation } from '../services/aiService.js';
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
        const explanation = await generateAIExplanation(question, correctAnswer, options);
        res.json({ explanation });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
