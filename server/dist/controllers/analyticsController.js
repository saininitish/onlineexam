import { supabase } from '../config/supabase.js';
// ===========================================
// STUDENT PERFORMANCE TRACKING
// ===========================================
export const getStudentPerformanceOverview = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        let query = supabase
            .from('student_performance_overview')
            .select('*');
        // If not admin, only show their own data
        if (!isAdmin) {
            query = query.eq('student_id', userId);
        }
        const { data, error } = await query.order('avg_score', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getStudentTopicPerformance = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        let query = supabase
            .from('student_topic_performance')
            .select('*');
        // If not admin, only show their own data
        if (!isAdmin) {
            query = query.eq('student_id', userId);
        }
        const { data, error } = await query.order('topic_accuracy_percentage', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getStudentProgressTimeline = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        let query = supabase
            .from('student_progress_timeline')
            .select('*');
        // If not admin, only show their own data
        if (!isAdmin) {
            query = query.eq('student_id', userId);
        }
        const { data, error } = await query.order('week_start', { ascending: true });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ===========================================
// TEST-WISE ANALYTICS
// ===========================================
export const getTestPerformanceAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        let query = supabase
            .from('test_performance_analytics')
            .select('*');
        // If not admin, only show tests they've attempted
        if (!isAdmin) {
            const { data: attemptedTestIds } = await supabase
                .from('attempts')
                .select('test_id')
                .eq('user_id', userId);
            const testIds = attemptedTestIds?.map(a => a.test_id) || [];
            if (testIds.length > 0) {
                query = query.in('test_id', testIds);
            }
            else {
                return res.status(200).json([]);
            }
        }
        const { data, error } = await query.order('avg_score', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getTestDifficultyAnalysis = async (req, res) => {
    try {
        const { testId } = req.params;
        const { data, error } = await supabase
            .from('test_difficulty_analysis')
            .select('*')
            .eq('test_id', testId)
            .order('difficulty_accuracy_percentage', { ascending: true });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ===========================================
// HARD QUESTIONS DETECTION
// ===========================================
export const getQuestionDifficultyMetrics = async (req, res) => {
    try {
        const { testId } = req.params;
        const { limit = 10 } = req.query;
        let query = supabase
            .from('question_difficulty_metrics')
            .select('*')
            .order('difficulty_score', { ascending: false })
            .limit(Number(limit));
        if (testId) {
            query = query.eq('test_id', testId);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getHardestQuestionsRanking = async (req, res) => {
    try {
        const { testId, limit = 20 } = req.query;
        let query = supabase
            .from('hardest_questions_ranking')
            .select('*')
            .order('difficulty_rank', { ascending: true })
            .limit(Number(limit));
        if (testId) {
            query = query.eq('test_id', testId);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ===========================================
// LEADERBOARD SYSTEM
// ===========================================
export const getGlobalLeaderboard = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const { data, error } = await supabase
            .from('global_leaderboard')
            .select('*')
            .order('global_rank', { ascending: true })
            .limit(Number(limit));
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getTestLeaderboard = async (req, res) => {
    try {
        const { testId } = req.params;
        const { limit = 50 } = req.query;
        const { data, error } = await supabase
            .from('test_leaderboard')
            .select('*')
            .eq('test_id', testId)
            .order('test_rank', { ascending: true })
            .limit(Number(limit));
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getMonthlyLeaderboard = async (req, res) => {
    try {
        const { month, year } = req.query;
        const { limit = 50 } = req.query;
        let query = supabase
            .from('monthly_leaderboard')
            .select('*')
            .order('monthly_rank', { ascending: true })
            .limit(Number(limit));
        if (month && year) {
            // Filter by specific month/year if provided
            const targetMonth = new Date(Number(year), Number(month) - 1, 1);
            query = query.eq('month', targetMonth.toISOString().split('T')[0] + ' 00:00:00+00');
        }
        else {
            // Get current month by default
            const now = new Date();
            const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            query = query.eq('month', currentMonth.toISOString().split('T')[0] + ' 00:00:00+00');
        }
        const { data, error } = await query;
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ===========================================
// ADDITIONAL ANALYTICS
// ===========================================
export const getStudentEngagementMetrics = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        let query = supabase
            .from('student_engagement_metrics')
            .select('*');
        // If not admin, only show their own data
        if (!isAdmin) {
            query = query.eq('student_id', userId);
        }
        const { data, error } = await query.order('last_activity', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getTestCompletionRates = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        let query = supabase
            .from('test_completion_rates')
            .select('*');
        // If not admin, only show tests they've attempted
        if (!isAdmin) {
            const { data: attemptedTestIds } = await supabase
                .from('attempts')
                .select('test_id')
                .eq('user_id', userId);
            const testIds = attemptedTestIds?.map(a => a.test_id) || [];
            if (testIds.length > 0) {
                query = query.in('test_id', testIds);
            }
            else {
                return res.status(200).json([]);
            }
        }
        const { data, error } = await query.order('completion_rate_percentage', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getQuestionPerformanceTrends = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { data, error } = await supabase
            .from('question_performance_trends')
            .select('*')
            .eq('question_id', questionId)
            .order('week', { ascending: true });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ===========================================
// DASHBOARD ANALYTICS
// ===========================================
export const getAnalyticsDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        // Get various metrics for dashboard
        const [{ data: studentOverview }, { data: testAnalytics }, { data: globalLeaderboard }, { data: engagementMetrics }] = await Promise.all([
            supabase.from('student_performance_overview').select('*').limit(10),
            supabase.from('test_performance_analytics').select('*').limit(10),
            supabase.from('global_leaderboard').select('*').limit(10),
            supabase.from('student_engagement_metrics').select('*').limit(10)
        ]);
        const dashboard = {
            studentOverview: isAdmin ? studentOverview : studentOverview?.filter(s => s.student_id === userId),
            testAnalytics,
            globalLeaderboard,
            engagementMetrics: isAdmin ? engagementMetrics : engagementMetrics?.filter(e => e.student_id === userId),
            summary: {
                totalStudents: isAdmin ? await getTotalCount('student_performance_overview') : 1,
                totalTests: await getTotalCount('test_performance_analytics'),
                totalAttempts: await getTotalAttempts(),
                avgScore: await getAvgScore()
            }
        };
        res.status(200).json(dashboard);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Helper functions
async function getTotalCount(tableName) {
    const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
    return count || 0;
}
async function getTotalAttempts() {
    const { count } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true });
    return count || 0;
}
async function getAvgScore() {
    const { data } = await supabase
        .from('attempts')
        .select('score');
    if (!data || data.length === 0)
        return 0;
    const avg = data.reduce((sum, a) => sum + (a.score || 0), 0) / data.length;
    return Math.round(avg * 100) / 100;
}
