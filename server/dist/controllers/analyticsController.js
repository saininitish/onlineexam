import { supabase } from '../config/supabase.js';
// ===========================================
// STUDENT PERFORMANCE TRACKING
// ===========================================
export const getStudentPerformanceOverview = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const isAdmin = req.user?.role === 'admin';
        // 1. Fetch Performance Data
        let perfQuery = supabase.from('student_performance_overview').select('*');
        if (!isAdmin)
            perfQuery = perfQuery.eq('student_id', userId);
        const { data: performanceData, error: perfError } = await perfQuery;
        if (perfError) {
            console.error('perfError:', perfError);
            throw perfError;
        }
        // 2. Fetch User Stats (XP, Streak)
        const { data: userStats } = await supabase
            .from('users')
            .select('xp, streak, coins')
            .eq('id', userId)
            .maybeSingle();
        // 3. Fetch All Scores for Ranking
        const { data: allScores } = await supabase
            .from('student_performance_overview')
            .select('*');
        // 4. Enrich Data
        const enrichedData = (performanceData || []).map(item => {
            // Find rank by sorting allScores in memory (safe)
            const sortedScores = (allScores || []).sort((a, b) => (b.avg_score || b.avg_accuracy_percentage || 0) - (a.avg_score || a.avg_accuracy_percentage || 0));
            const rank = sortedScores.findIndex(s => s.student_id === item.student_id) + 1;
            const isCurrentUser = item.student_id === userId;
            return {
                ...item,
                global_rank: rank || '---',
                current_streak: isCurrentUser ? (userStats?.streak || 0) : (item.current_streak || 0),
                total_xp_earned: isCurrentUser ? (userStats?.xp || 0) : (item.total_xp_earned || 0)
            };
        });
        res.status(200).json(enrichedData);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getStudentTopicPerformance = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        let query = supabase.from('student_topic_performance').select('*');
        if (!isAdmin)
            query = query.eq('student_id', userId);
        const { data, error } = await query;
        if (error)
            throw error;
        res.status(200).json(data || []);
    }
    catch (error) {
        res.status(500).json({ message: error.message, details: error });
    }
};
export const getStudentProgressTimeline = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        let query = supabase.from('student_progress_timeline').select('*');
        if (!isAdmin)
            query = query.eq('student_id', userId);
        const { data, error } = await query;
        if (error)
            throw error;
        res.status(200).json(data || []);
    }
    catch (error) {
        res.status(500).json({ message: error.message, details: error });
    }
};
// ===========================================
// TEST-WISE ANALYTICS
// ===========================================
export const getTestPerformanceAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        let query = supabase.from('test_performance_analytics').select('*');
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
        const { data, error } = await query;
        if (error)
            throw error;
        // Sort in memory safely
        const sortedData = (data || []).sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0));
        res.status(200).json(sortedData);
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
            .eq('test_id', testId);
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
        const { data, error } = await supabase
            .from('question_difficulty_metrics')
            .select('*');
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
        const { data, error } = await supabase
            .from('question_difficulty_metrics')
            .select('*');
        if (error)
            throw error;
        // Sort by failure rate in memory
        const sortedData = (data || []).sort((a, b) => (b.failure_rate || 0) - (a.failure_rate || 0));
        res.status(200).json(sortedData.slice(0, 20));
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
        const { data, error } = await supabase
            .from('global_leaderboard')
            .select('*');
        if (error)
            throw error;
        const sortedData = (data || []).sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));
        res.status(200).json(sortedData);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getTestLeaderboard = async (req, res) => {
    try {
        const { testId } = req.params;
        const { data, error } = await supabase
            .from('test_leaderboards')
            .select('*')
            .eq('test_id', testId);
        if (error)
            throw error;
        const sortedData = (data || []).sort((a, b) => (b.score || 0) - (a.score || 0));
        res.status(200).json(sortedData);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getMonthlyLeaderboard = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('monthly_leaderboard')
            .select('*');
        if (error)
            throw error;
        const sortedData = (data || []).sort((a, b) => (b.monthly_xp || 0) - (a.monthly_xp || 0));
        res.status(200).json(sortedData);
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
        let query = supabase.from('student_engagement_metrics').select('*');
        if (!isAdmin)
            query = query.eq('student_id', userId);
        const { data, error } = await query;
        if (error)
            throw error;
        res.status(200).json(data || []);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getTestCompletionRates = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        let query = supabase.from('test_completion_rates').select('*');
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
        const { data, error } = await query;
        if (error)
            throw error;
        const sortedData = (data || []).sort((a, b) => (b.completion_rate_percentage || 0) - (a.completion_rate_percentage || 0));
        res.status(200).json(sortedData);
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
        const [ovRes, testRes, leadRes, engRes] = await Promise.all([
            supabase.from('student_performance_overview').select('*').limit(10),
            supabase.from('test_performance_analytics').select('*').limit(10),
            supabase.from('global_leaderboard').select('*').limit(10),
            supabase.from('student_engagement_metrics').select('*').limit(10)
        ]);
        const dashboard = {
            studentOverview: isAdmin ? (ovRes.data || []) : (ovRes.data || []).filter(s => s.student_id === userId),
            testAnalytics: testRes.data || [],
            globalLeaderboard: leadRes.data || [],
            engagementMetrics: isAdmin ? (engRes.data || []) : (engRes.data || []).filter(e => e.student_id === userId),
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
