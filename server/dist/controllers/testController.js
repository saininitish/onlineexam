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
        const { test_id, question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
        // Check for existing question in this test
        const { data: existing, error: checkError } = await supabase
            .from('questions')
            .select('id')
            .eq('test_id', test_id)
            .ilike('question', question.trim())
            .maybeSingle();
        if (checkError)
            throw new AppError(checkError.message, 500);
        if (existing) {
            throw new AppError('This question already exists in this test.', 400);
        }
        const cleanData = { test_id, question: question.trim(), option_a, option_b, option_c, option_d, correct_answer };
        const { data, error } = await supabase.from('questions').insert([cleanData]).select().single();
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
        // 1. Fetch existing questions for this test to prevent duplicates
        const { data: existingQuestions, error: fetchError } = await supabase
            .from('questions')
            .select('question')
            .eq('test_id', test_id);
        if (fetchError)
            throw new AppError(fetchError.message, 500);
        const existingSet = new Set(existingQuestions?.map(q => q.question.trim().toLowerCase()) || []);
        const seenInBatch = new Set();
        // 2. Filter unique questions
        const uniqueIncoming = questions.filter(q => {
            const norm = q.question.trim().toLowerCase();
            if (existingSet.has(norm) || seenInBatch.has(norm)) {
                return false;
            }
            seenInBatch.add(norm);
            return true;
        });
        const skippedCount = questions.length - uniqueIncoming.length;
        if (uniqueIncoming.length === 0) {
            return res.status(200).json({
                message: 'All questions already exist or are duplicates in this batch.',
                inserted: 0,
                skipped: skippedCount
            });
        }
        const CHUNK_SIZE = 100;
        let insertedCount = 0;
        const allInsertedData = [];
        for (let i = 0; i < uniqueIncoming.length; i += CHUNK_SIZE) {
            const chunk = uniqueIncoming.slice(i, i + CHUNK_SIZE);
            console.log(`[BulkUpload] Inserting chunk ${i / CHUNK_SIZE + 1}...`);
            const cleanChunk = chunk.map(q => ({
                test_id,
                question: q.question.trim(),
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: q.correct_answer
            }));
            const { data, error } = await supabase
                .from('questions')
                .insert(cleanChunk)
                .select();
            if (error) {
                console.error('💥 [BulkUpload Error]:', error);
                throw new AppError(`Database Error: ${error.message}`, 500);
            }
            if (data) {
                insertedCount += data.length;
                allInsertedData.push(...data);
            }
        }
        console.log(`✅ [BulkUpload] Successfully inserted ${insertedCount} questions. Skipped ${skippedCount} duplicates.`);
        res.status(201).json({
            inserted: insertedCount,
            skipped: skippedCount,
            questions: allInsertedData,
            message: skippedCount > 0 ? `Successfully inserted ${insertedCount} questions. ${skippedCount} duplicates were skipped.` : 'Successfully inserted all questions.'
        });
    }
    catch (error) {
        handleError(error, res);
    }
};
export const getQuestionsByTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { data, error } = await supabase
            .from('questions')
            .select('id, question, option_a, option_b, option_c, option_d, correct_answer, created_at')
            .eq('test_id', testId)
            .order('created_at', { ascending: true });
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
