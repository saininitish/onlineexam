import { supabase } from '../config/supabase.js';
const normAnswer = (v) => v == null || v === '' ? '' : String(v).trim().toLowerCase();
export const getAvailableTests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tests')
            .select('id, title, duration, marks_per_question, negative_mark, created_by, users(name)')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const reportTestHeartbeat = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { test_id, event, details, current_question, time_left, page_timestamp } = req.body;
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getStudentDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        const [testsResult, attemptsResult] = await Promise.all([
            supabase
                .from('tests')
                .select('id, title, duration, marks_per_question, negative_mark')
                .order('created_at', { ascending: false }),
            supabase
                .from('attempts')
                .select('id, test_id, score, submitted_at')
                .eq('user_id', userId)
                .order('submitted_at', { ascending: false })
        ]);
        if (testsResult.error)
            throw testsResult.error;
        if (attemptsResult.error)
            throw attemptsResult.error;
        res.status(200).json({
            tests: testsResult.data || [],
            attempts: attemptsResult.data || []
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getTestById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: test, error: testError } = await supabase
            .from('tests')
            .select('*')
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
        if (qError)
            throw qError;
        // Shuffle questions for randomness
        const shuffled = questions ? questions.sort(() => Math.random() - 0.5) : [];
        res.status(200).json({ ...test, questions: shuffled });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const submitTest = async (req, res) => {
    try {
        const { test_id, answers, time_taken } = req.body;
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
        if (!questions)
            return res.status(500).json({ message: 'Could not fetch questions' });
        let score = 0;
        let correctCount = 0;
        let wrongCount = 0;
        let unansweredCount = 0;
        const marks = Number(test.marks_per_question) || 0;
        const neg = Number(test.negative_mark) || 0;
        const results = questions.map((q) => {
            const submittedAnswer = answers.find((a) => a.question_id === q.id);
            const rawSelected = submittedAnswer?.selected_answer;
            const selected = rawSelected == null || String(rawSelected).trim() === '' ? null : String(rawSelected).trim();
            const isCorrect = !!selected && normAnswer(selected) === normAnswer(q.correct_answer);
            if (!selected) {
                unansweredCount++;
            }
            else if (isCorrect) {
                score += marks;
                correctCount++;
            }
            else {
                score -= neg;
                wrongCount++;
            }
            return {
                question_id: q.id,
                selected_answer: selected,
                is_correct: selected ? isCorrect : false
            };
        });
        // Save attempt
        const { data: attempt, error: attemptError } = await supabase
            .from('attempts')
            .insert([{
                user_id: userId,
                test_id,
                score: Math.round(score),
                time_taken: Math.floor(time_taken),
                submitted_at: new Date().toISOString()
            }])
            .select()
            .single();
        if (attemptError)
            throw attemptError;
        // Save individual answers
        const answersToInsert = results.map((r) => ({
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
            score,
            correct: correctCount,
            wrong: wrongCount,
            unanswered: unansweredCount,
            total: questions.length
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
            .select('*, tests(title, duration, marks_per_question, negative_mark)')
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
export const getAttemptDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        // Get the attempt
        let query = supabase
            .from('attempts')
            .select('*, users(name), tests(title, duration, marks_per_question, negative_mark)')
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
        if (ansError)
            throw ansError;
        const list = [...(answers || [])].sort((a, b) => {
            const ta = a.questions?.created_at ? new Date(a.questions.created_at).getTime() : 0;
            const tb = b.questions?.created_at ? new Date(b.questions.created_at).getTime() : 0;
            if (ta !== tb)
                return ta - tb;
            return String(a.id || '').localeCompare(String(b.id || ''));
        });
        res.status(200).json({ attempt, answers: list });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getLeaderboard = async (req, res) => {
    try {
        const { testId } = req.params;
        // Get test title
        const { data: test } = await supabase
            .from('tests')
            .select('title')
            .eq('id', testId)
            .single();
        // Get all attempts for this test, sorted by score (desc), then time (asc)
        const { data, error } = await supabase
            .from('attempts')
            .select('*, users(name, email)')
            .eq('test_id', testId)
            .order('score', { ascending: false })
            .order('time_taken', { ascending: true });
        if (error)
            throw error;
        res.status(200).json({
            test_title: test?.title || 'Unknown Test',
            leaderboard: data
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
