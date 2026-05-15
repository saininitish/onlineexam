import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const normAnswer = (v: string | null | undefined) =>
  v == null || v === '' ? '' : String(v).trim().toLowerCase();

export const getAvailableTests = async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('tests')
      .select('id, title, duration, marks_per_question, negative_mark, created_by, users(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const reportTestHeartbeat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      test_id,
      event,
      details,
      current_question,
      time_left,
      page_timestamp
    } = req.body;

    if (!test_id) {
      return res.status(400).json({ message: 'test_id is required' });
    }

    console.info('[TestHeartbeat]', {
      userId,
      test_id,
      event,
      details,
      current_question,
      time_left,
      page_timestamp
    });

    res.status(200).json({ serverTime: Date.now() });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const [testsResult, attemptsResult, userResult] = await Promise.all([
      supabase
        .from('tests')
        .select('id, title, duration, marks_per_question, negative_mark')
        .order('created_at', { ascending: false }),
      supabase
        .from('attempts')
        .select('id, user_id, test_id, score, time_taken, submitted_at, tests(title, duration, marks_per_question, negative_mark)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false }),
      supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', userId)
        .single()
    ]);

    if (testsResult.error) throw testsResult.error;
    if (attemptsResult.error) throw attemptsResult.error;

    res.status(200).json({
      tests: testsResult.data || [],
      attempts: attemptsResult.data || [],
      stats: userResult.data || { xp: 0, coins: 0, streak: 0 }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('id, title, duration, marks_per_question, negative_mark')
      .eq('id', id)
      .single();

    if (testError || !test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Get questions (without correct_answer for students)
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, question, option_a, option_b, option_c, option_d')
      .eq('test_id', id);

    if (qError) throw qError;

    // Shuffle questions for randomness
    const shuffled = questions ? questions.sort(() => Math.random() - 0.5) : [];

    res.status(200).json({ ...test, questions: shuffled });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const submitTest = async (req: AuthRequest, res: Response) => {
  try {
    const { test_id, answers, time_taken, tab_switches, fullscreen_exits, time_spent_map } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers must be an array' });
    }

    const [testResult, questionsResult] = await Promise.all([
      supabase
        .from('tests')
        .select('marks_per_question, negative_mark')
        .eq('id', test_id)
        .single(),
      supabase
        .from('questions')
        .select('id, correct_answer')
        .eq('test_id', test_id)
    ]);

    if (testResult.error || !testResult.data) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (questionsResult.error || !questionsResult.data) {
      return res.status(500).json({ message: 'Could not fetch questions' });
    }

    const test = testResult.data;
    const questions = questionsResult.data;

    if (!questions) return res.status(500).json({ message: 'Could not fetch questions' });

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const marks = Number(test.marks_per_question) || 0;
    const neg = Number(test.negative_mark) || 0;

    const results = questions.map((q: any) => {
      const submittedAnswer = answers.find((a: any) => a.question_id === q.id);
      const rawSelected = submittedAnswer?.selected_answer;
      const selected =
        rawSelected == null || String(rawSelected).trim() === '' ? null : String(rawSelected).trim();
      const isCorrect = !!selected && normAnswer(selected) === normAnswer(q.correct_answer);

      if (!selected) {
        unansweredCount++;
      } else if (isCorrect) {
        score += marks;
        correctCount++;
      } else {
        score -= neg;
        wrongCount++;
      }

      return {
        question_id: q.id,
        selected_answer: selected,
        is_correct: selected ? isCorrect : false,
        time_spent: time_spent_map ? Math.round(Number(time_spent_map[q.id]) || 0) : 0

      };
    });

    // Save attempt (Strictly sanitize columns)
    const attemptPayload = {
      user_id: userId,
      test_id,
      score: Number(score.toFixed(2)),
      time_taken: Math.floor(time_taken),
      tab_switches: Number(tab_switches) || 0,
      fullscreen_exits: Number(fullscreen_exits) || 0,
      time_spent_map: time_spent_map || {},
      submitted_at: new Date().toISOString()
    };

    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .insert([attemptPayload])
      .select('id, user_id, test_id, score, time_taken, tab_switches, fullscreen_exits, submitted_at')
      .single();

    if (attemptError) throw attemptError;

    // Save individual answers
    const answersToInsert = results.map((r: any) => ({
      attempt_id: attempt.id,
      question_id: r.question_id,
      selected_answer: r.selected_answer,
      is_correct: r.is_correct,
      time_spent: r.time_spent
    }));

    const { error: ansError } = await supabase
      .from('answers')
      .insert(answersToInsert);

    if (ansError) throw ansError;

    // --- SaaS Gamification Logic ---
    const xpEarned = 0;
    const coinsEarned = 0;
    const newStreak = 0;
    // --- End SaaS Logic ---

    res.status(200).json({
      message: 'Test submitted successfully',
      attempt_id: attempt.id,
      score,
      correct: correctCount,
      wrong: wrongCount,
      unanswered: unansweredCount,
      total: questions.length,
      tab_switches: attempt.tab_switches,
      fullscreen_exits: attempt.fullscreen_exits,
      rewards: { xp: xpEarned, coins: coinsEarned, streak: newStreak }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttempts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { data, error } = await supabase
      .from('attempts')
      .select('id, user_id, test_id, score, time_taken, tab_switches, fullscreen_exits, submitted_at, tests(title, duration, marks_per_question, negative_mark)')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttemptDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get the attempt
    let query = supabase
      .from('attempts')
      .select('id, user_id, test_id, score, time_taken, tab_switches, fullscreen_exits, submitted_at, users(name), tests(title, duration, marks_per_question, negative_mark)')
      .eq('id', id);

    // If not admin, only allow seeing their own attempts
    if (user?.role !== 'admin') {
      query = query.eq('user_id', user?.id);
    }

    const { data: attempt, error: attemptError } = await query.single();

    if (attemptError || !attempt) {
      return res.status(404).json({ message: 'Attempt not found or unauthorized' });
    }

    // Get answers with question details
    const { data: answers, error: ansError } = await supabase
      .from('answers')
      .select('*, questions(id, question, option_a, option_b, option_c, option_d, correct_answer, created_at)')
      .eq('attempt_id', id);

    if (ansError) throw ansError;

    const list = [...(answers || [])].sort((a: any, b: any) => {
      const ta = a.questions?.created_at ? new Date(a.questions.created_at).getTime() : 0;
      const tb = b.questions?.created_at ? new Date(b.questions.created_at).getTime() : 0;
      if (ta !== tb) return ta - tb;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

    res.status(200).json({ attempt, answers: list });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const isGlobal = testId === 'all';

    let testTitle = 'Global Leaderboard';
    let query = supabase.from('attempts').select('id, user_id, test_id, score, time_taken, tab_switches, fullscreen_exits, submitted_at, users(name, email), tests(title)');

    if (isGlobal) {
      // Global: Sort by overall score across all tests
      query = query.order('score', { ascending: false });
    } else {
      // Specific test: Get title first
      const { data: test } = await supabase
        .from('tests')
        .select('title')
        .eq('id', testId)
        .maybeSingle();

      testTitle = test?.title || 'Unknown Test';
      query = query.eq('test_id', testId).order('score', { ascending: false });
    }

    const { data, error } = await query.order('time_taken', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      test_title: testTitle,
      leaderboard: data
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
