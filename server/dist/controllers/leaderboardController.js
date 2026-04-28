import { supabase } from '../config/supabase.js';
/**
 * Leaderboard Controller
 *
 * Strategy for efficiency:
 * 1. For Global/Weekly leaderboards, we use aggregation.
 * 2. In a production environment with millions of rows, we would use a Materialized View
 *    or a dedicated Redis Sorted Set.
 * 3. Here we use optimized SQL queries via Supabase.
 */
export const getGlobalLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        // Optimized Query: Sum of best scores per test for each user
        // We use a subquery to get the best score for each (user, test) pair first
        const { data, error } = await supabase.rpc('get_global_leaderboard', {
            row_limit: limit
        });
        if (error) {
            // Fallback if RPC is not defined yet
            console.error('RPC get_global_leaderboard failed, falling back to JS aggregation', error);
            const { data: attempts, error: fetchError } = await supabase
                .from('attempts')
                .select('user_id, score, time_taken, users(name, email)')
                .order('score', { ascending: false });
            if (fetchError)
                throw fetchError;
            // Group by user and take best score per user (simplified version)
            const userMap = new Map();
            attempts?.forEach((a) => {
                if (!userMap.has(a.user_id) || userMap.get(a.user_id).score < a.score) {
                    userMap.set(a.user_id, {
                        name: a.users?.name,
                        email: a.users?.email,
                        total_score: a.score,
                        total_time: a.time_taken
                    });
                }
            });
            const sorted = Array.from(userMap.values())
                .sort((a, b) => b.total_score - a.total_score || a.total_time - b.total_time)
                .slice(0, limit);
            return res.status(200).json(sorted);
        }
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getWeeklyLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const { data, error } = await supabase.rpc('get_weekly_leaderboard', {
            row_limit: limit,
            since_date: oneWeekAgo.toISOString()
        });
        if (error) {
            console.error('RPC get_weekly_leaderboard failed, falling back to JS aggregation', error);
            const { data: attempts, error: fetchError } = await supabase
                .from('attempts')
                .select('user_id, score, time_taken, users(name, email)')
                .gte('submitted_at', oneWeekAgo.toISOString())
                .order('score', { ascending: false });
            if (fetchError)
                throw fetchError;
            const userMap = new Map();
            attempts?.forEach((a) => {
                if (!userMap.has(a.user_id) || userMap.get(a.user_id).score < a.score) {
                    userMap.set(a.user_id, {
                        name: a.users?.name,
                        email: a.users?.email,
                        total_score: a.score,
                        total_time: a.time_taken
                    });
                }
            });
            const sorted = Array.from(userMap.values())
                .sort((a, b) => b.total_score - a.total_score || a.total_time - b.total_time)
                .slice(0, limit);
            return res.status(200).json(sorted);
        }
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
