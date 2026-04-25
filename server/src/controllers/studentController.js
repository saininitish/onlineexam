import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';
export const getAvailableTests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tests')
            .select('*, users(name)');
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getTestById = async (req, res) => {
    try {
        const { id } = req.params;
        // Get test details
        const { data: test, error: testError } = await supabase
            .from('tests')
            .select('*')
            .eq('id', id)
            .single();
        if (testError || !test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        // Get questions for this test
        const { data: questions, error: qError } = await supabase
            .from('questions')
            .select('id, question, option_a, option_b, option_c, option_d')
            .eq('test_id', id);
        if (qError)
            throw qError;
        res.status(200).json({ ...test, questions });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const submitTest = async (req, res) => {
    try {
        const { test_id, answers, time_taken } = req.body;
        const userId = req.user?.id;
        // Get test details for scoring
        const { data: test } = await supabase
            .from('tests')
            .select('marks_per_question, negative_mark')
            .eq('id', test_id)
            .single();
        if (!test)
            return res.status(404).json({ message: 'Test not found' });
        // Get correct answers
        const { data: questions } = await supabase
            .from('questions')
            .select('id, correct_answer')
            .eq('test_id', test_id);
        if (!questions)
            return res.status(500).json({ message: 'Could not fetch questions' });
        let score = 0;
        const results = questions.map(q => {
            const submittedAnswer = answers.find((a) => a.question_id === q.id);
            const isCorrect = submittedAnswer?.selected_answer === q.correct_answer;
            if (submittedAnswer) {
                if (isCorrect) {
                    score += test.marks_per_question;
                }
                else {
                    score -= test.negative_mark;
                }
            }
            return {
                question_id: q.id,
                selected_answer: submittedAnswer?.selected_answer || null,
                is_correct: isCorrect
            };
        });
        // Save attempt
        const { data: attempt, error: attemptError } = await supabase
            .from('attempts')
            .insert([{
                user_id: userId,
                test_id,
                score,
                time_taken,
                submitted_at: new Date().toISOString()
            }])
            .select()
            .single();
        if (attemptError)
            throw attemptError;
        // Save individual answers
        const answersToInsert = results.map(r => ({
            attempt_id: attempt.id,
            question_id: r.question_id,
            selected_answer: r.selected_answer,
            is_correct: r.is_correct
        }));
        const { error: ansError } = await supabase
            .from('answers')
            .insert(answersToInsert);
        if (ansError)
            throw ansError;
        res.status(200).json({
            message: 'Test submitted successfully',
            attempt_id: attempt.id,
            score
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getAttempts = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { data, error } = await supabase
            .from('attempts')
            .select('*, tests(title)')
            .eq('user_id', userId)
            .order('submitted_at', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
//# sourceMappingURL=studentController.js.map