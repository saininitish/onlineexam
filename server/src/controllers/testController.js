import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';
export const createTest = async (req, res) => {
    try {
        const { title, duration, marks_per_question, negative_mark } = req.body;
        const userId = req.user?.id;
        const { data, error } = await supabase
            .from('tests')
            .insert([{ title, duration, marks_per_question, negative_mark, created_by: userId }])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getTests = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { data, error } = await supabase
            .from('tests')
            .select('*')
            .eq('created_by', userId);
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const addQuestion = async (req, res) => {
    try {
        const { test_id, question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
        const { data, error } = await supabase
            .from('questions')
            .insert([{ test_id, question, option_a, option_b, option_c, option_d, correct_answer }])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getResults = async (req, res) => {
    try {
        const userId = req.user?.id;
        // Get all tests created by this admin
        const { data: tests } = await supabase
            .from('tests')
            .select('id')
            .eq('created_by', userId);
        const testIds = tests?.map(t => t.id) || [];
        // Get attempts for these tests
        const { data, error } = await supabase
            .from('attempts')
            .select('*, users(name, email), tests(title)')
            .in('test_id', testIds);
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
//# sourceMappingURL=testController.js.map