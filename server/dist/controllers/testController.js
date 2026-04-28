import { TestService } from '../services/testService.js';
import { handleError, AppError } from '../utils/errorHandler.js';
import { supabase } from '../config/supabase.js';
// ========== TEST CRUD ==========
export const getTests = async (req, res) => {
    try {
        const data = await TestService.getAllTests();
        res.status(200).json(data);
    }
    catch (error) {
        handleError(error, res);
    }
};
export const createTest = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new AppError('Unauthorized', 401);
        const data = await TestService.createTest(req.body, userId);
        res.status(201).json(data);
    }
    catch (error) {
        handleError(error, res);
    }
};
export const updateTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, duration, marks_per_question, negative_mark } = req.body;
        const { data, error } = await supabase
            .from('tests')
            .update({ title, duration, marks_per_question, negative_mark: parseFloat(negative_mark) })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new AppError(error.message, 500);
        res.status(200).json(data);
    }
    catch (error) {
        handleError(error, res);
    }
};
export const deleteTest = async (req, res) => {
    try {
        const { id } = req.params;
        await TestService.deleteTest(id);
        res.status(200).json({ message: 'Test deleted successfully' });
    }
    catch (error) {
        handleError(error, res);
    }
};
// ========== QUESTION CRUD ==========
export const addQuestion = async (req, res) => {
    try {
        const { data, error } = await supabase.from('questions').insert([req.body]).select().single();
        if (error)
            throw new AppError(error.message, 500);
        res.status(201).json(data);
    }
    catch (error) {
        handleError(error, res);
    }
};
export const bulkAddQuestions = async (req, res) => {
    try {
        const { test_id, questions } = req.body;
        if (!test_id || !Array.isArray(questions))
            throw new AppError('Invalid input', 400);
        const { data, error } = await supabase.from('questions').insert(questions.map(q => ({ ...q, test_id }))).select();
        if (error)
            throw new AppError(error.message, 500);
        res.status(201).json({ inserted: data?.length ?? 0, questions: data });
    }
    catch (error) {
        handleError(error, res);
    }
};
export const getQuestionsByTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { data, error } = await supabase.from('questions').select('*').eq('test_id', testId).order('created_at', { ascending: true });
        if (error)
            throw new AppError(error.message, 500);
        res.status(200).json(data);
    }
    catch (error) {
        handleError(error, res);
    }
};
export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        await supabase.from('answers').delete().eq('question_id', id);
        const { error } = await supabase.from('questions').delete().eq('id', id);
        if (error)
            throw new AppError(error.message, 500);
        res.status(200).json({ message: 'Question deleted successfully' });
    }
    catch (error) {
        handleError(error, res);
    }
};
export const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('questions').update(req.body).eq('id', id).select().single();
        if (error)
            throw new AppError(error.message, 500);
        res.status(200).json(data);
    }
    catch (error) {
        handleError(error, res);
    }
};
export const getResults = async (req, res) => {
    try {
        const data = await TestService.getResults();
        res.status(200).json(data);
    }
    catch (error) {
        handleError(error, res);
    }
};
