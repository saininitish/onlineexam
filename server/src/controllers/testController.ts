import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest } from '../middleware/authMiddleware.js';



// ========== TEST CRUD ==========

export const createTest = async (req: AuthRequest, res: Response) => {
  try {
    const { title, duration, marks_per_question, negative_mark } = req.body;
    const userId = req.user?.id;

    const { data, error } = await supabase
      .from('tests')
      .insert([{ title, duration, marks_per_question, negative_mark: parseFloat(negative_mark), created_by: userId }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, duration, marks_per_question, negative_mark } = req.body;

    const { data, error } = await supabase
      .from('tests')
      .update({ title, duration, marks_per_question, negative_mark: parseFloat(negative_mark) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Order matters: answers reference questions; attempts reference tests.
    // Deleting attempts removes answers (ON DELETE CASCADE on answers.attempt_id).
    const { error: attemptsErr } = await supabase.from('attempts').delete().eq('test_id', id);
    if (attemptsErr) throw attemptsErr;

    const { error: questionsErr } = await supabase.from('questions').delete().eq('test_id', id);
    if (questionsErr) throw questionsErr;

    const { error } = await supabase.from('tests').delete().eq('id', id);
    if (error) throw error;

    res.status(200).json({ message: 'Test deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ========== QUESTION CRUD ==========

export const addQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { test_id, question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
    const { data, error } = await supabase
      .from('questions')
      .insert([{ test_id, question, option_a, option_b, option_c, option_d, correct_answer }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkAddQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { test_id, questions } = req.body;

    if (!test_id || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'test_id and a non-empty questions array are required' });
    }

    const { data: owned, error: ownErr } = await supabase
      .from('tests')
      .select('id')
      .eq('id', test_id)
      .eq('created_by', userId)
      .single();

    if (ownErr || !owned) {
      return res.status(404).json({ message: 'Test not found or access denied' });
    }

    const rows = questions.map((q: any, idx: number) => {
      const question = String(q.question ?? '').trim();
      const option_a = String(q.option_a ?? '').trim();
      const option_b = String(q.option_b ?? '').trim();
      const option_c = String(q.option_c ?? '').trim();
      const option_d = String(q.option_d ?? '').trim();
      const correct = String(q.correct_answer ?? '').trim().toLowerCase();

      if (!question || !option_a || !option_b || !option_c || !option_d) {
        throw new Error(`Row ${idx + 1}: question and all four options are required`);
      }
      if (!['a', 'b', 'c', 'd'].includes(correct)) {
        throw new Error(`Row ${idx + 1}: correct_answer must be a, b, c, or d`);
      }

      return { test_id, question, option_a, option_b, option_c, option_d, correct_answer: correct };
    });

    const { data, error } = await supabase.from('questions').insert(rows).select();
    if (error) throw error;

    res.status(201).json({ inserted: data?.length ?? 0, questions: data });
  } catch (error: any) {
    const msg = error.message || 'Bulk insert failed';
    if (/^Row \d+:/.test(msg)) {
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: msg });
  }
};

export const getQuestionsByTest = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('test_id', testId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error: ansErr } = await supabase.from('answers').delete().eq('question_id', id);
    if (ansErr) throw ansErr;

    const { error } = await supabase.from('questions').delete().eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
    const { data, error } = await supabase
      .from('questions')
      .update({ question, option_a, option_b, option_c, option_d, correct_answer })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ========== RESULTS ==========

export const getResults = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get all tests created by this admin
    const { data: tests } = await supabase
      .from('tests')
      .select('id')
      .eq('created_by', userId);

    const testIds = tests?.map((t: any) => t.id) || [];

    if (testIds.length === 0) {
      return res.status(200).json([]);
    }

    // Get attempts for these tests
    const { data, error } = await supabase
      .from('attempts')
      .select('*, users(name, email), tests(title)')
      .in('test_id', testIds)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
