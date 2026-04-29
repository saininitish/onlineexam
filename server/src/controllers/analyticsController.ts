import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getStudentPerformanceOverview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch all attempts for the student
    const { data: attempts, error: attemptsError } = await supabase
      .from('attempts')
      .select('score, time_taken')
      .eq('user_id', userId);

    if (attemptsError) throw attemptsError;

    // Fetch user stats
    const { data: userStats } = await supabase
      .from('users')
      .select('xp, streak, coins')
      .eq('id', userId)
      .maybeSingle();

    // Calculate metrics manually
    const totalTests = attempts?.length || 0;
    const avgScore = totalTests > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalTests)
      : 0;

    const avgAccuracy = 0; // Simplified

    const totalTime = attempts?.reduce((sum, a) => sum + (a.time_taken || 0), 0) || 0;

    // Mock ranking (since we can't easily query all students' averages without views)
    const rank = totalTests > 0 ? Math.max(1, 15 - Math.floor(avgScore / 10)) : '---';

    const result = [{
      student_id: userId,
      total_exams_taken: totalTests,
      avg_score: avgScore,
      avg_accuracy_percentage: avgAccuracy,
      total_time_spent_seconds: totalTime,
      global_rank: rank,
      current_streak: userStats?.streak || 0,
      total_xp_earned: userStats?.xp || 0
    }];

    res.status(200).json(result);
  } catch (error: any) {
    console.error('[Analytics] Overview Error:', error);
    res.status(200).json([]);
  }
};

export const getStudentTopicPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch attempts with test details to get topics
    const { data: attempts, error } = await supabase
      .from('attempts')
      .select(`
        score,
        tests (
          title,
          category
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Group by category/topic
    const topicMap: Record<string, any> = {};
    attempts?.forEach((a: any) => {
      const topic = a.tests?.category || 'General';
      if (!topicMap[topic]) {
        topicMap[topic] = { topic, total_score: 0, count: 0 };
      }
      topicMap[topic].total_score += a.score || 0;
      topicMap[topic].count++;
    });

    const result = Object.values(topicMap).map(t => ({
      topic_name: t.topic,
      avg_score: Math.round(t.total_score / t.count),
      accuracy_percentage: 0, // Simplified
      exams_count: t.count
    }));

    res.status(200).json(result);
  } catch (error: any) {
    console.error('[Analytics] Topic Error:', error);
    res.status(200).json([]);
  }
};

export const getStudentProgressTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { data: attempts, error } = await supabase
      .from('attempts')
      .select('score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const result = (attempts || []).map((a, index) => ({
      attempt_id: index,
      score: a.score,
      recorded_at: a.created_at,
      exam_name: `Attempt ${index + 1}`
    }));

    res.status(200).json(result);
  } catch (error: any) {
    console.error('[Analytics] Timeline Error:', error);
    res.status(200).json([]);
  }
};

export const getTestPerformanceAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { data: attempts, error } = await supabase
      .from('attempts')
      .select('id, user_id, test_id, score, time_taken, submitted_at, users(name, email), tests(title)');

    if (error) throw error;

    const testMap: Record<string, any> = {};
    attempts?.forEach((a: any) => {
      const testId = a.test_id;
      if (!testMap[testId]) {
        testMap[testId] = { test_id: testId, title: a.tests?.title, total_score: 0, count: 0 };
      }
      testMap[testId].total_score += a.score || 0;
      testMap[testId].count++;
    });

    const result = Object.values(testMap).map(t => ({
      test_id: t.test_id,
      test_name: t.title,
      avg_score: Math.round(t.total_score / t.count),
      total_attempts: t.count
    }));

    res.status(200).json(result);
  } catch (error: any) {
    res.status(200).json([]);
  }
};

export const getTestDifficultyAnalysis = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ message: 'Manual calculation not implemented' });
};

export const getQuestionDifficultyMetrics = async (req: AuthRequest, res: Response) => {
  res.status(200).json([]);
};

export const getHardestQuestionsRanking = async (req: AuthRequest, res: Response) => {
  res.status(200).json([]);
};

export const getGlobalLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { data: attempts, error } = await supabase
      .from('attempts')
      .select('user_id, score, users(name, avatar_url)');

    if (error) throw error;

    const leaderMap: Record<string, any> = {};
    attempts?.forEach((a: any) => {
      const uid = a.user_id;
      if (!leaderMap[uid]) {
        leaderMap[uid] = { student_id: uid, student_name: a.users?.name, avatar_url: a.users?.avatar_url, total_score: 0, count: 0 };
      }
      leaderMap[uid].total_score += a.score || 0;
      leaderMap[uid].count++;
    });

    const result = Object.values(leaderMap)
      .map((l: any) => ({
        ...l,
        avg_score: Math.round(l.total_score / l.count)
      }))
      .sort((a, b) => b.avg_score - a.avg_score)
      .slice(0, 10);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(200).json([]);
  }
};

export const getTestLeaderboard = async (req: AuthRequest, res: Response) => {
  res.status(200).json([]);
};

export const getMonthlyLeaderboard = async (req: AuthRequest, res: Response) => {
  res.status(200).json([]);
};

export const getStudentEngagementMetrics = async (req: AuthRequest, res: Response) => {
  res.status(200).json([]);
};

export const getTestCompletionRates = async (req: AuthRequest, res: Response) => {
  res.status(200).json([]);
};

export const getQuestionPerformanceTrends = async (req: AuthRequest, res: Response) => {
  res.status(200).json([]);
};

export const getAnalyticsDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch raw data
    const [
      { data: studentAttempts },
      { data: allAttempts },
      { data: userStats }
    ] = await Promise.all([
      supabase.from('attempts').select('score, test_id').eq('user_id', userId),
      supabase.from('attempts').select('score, test_id, user_id, users(name)'),
      supabase.from('users').select('xp, streak').eq('id', userId).maybeSingle()
    ]);

    // Leaderboard calculation
    const leaderMap: Record<string, any> = {};
    allAttempts?.forEach((a: any) => {
      const uid = a.user_id;
      if (!leaderMap[uid]) leaderMap[uid] = { name: a.users?.name, total: 0, count: 0 };
      leaderMap[uid].total += a.score || 0;
      leaderMap[uid].count++;
    });
    const globalLeaderboard = Object.values(leaderMap)
      .map((l: any) => ({ student_name: l.name, avg_score: Math.round(l.total / l.count) }))
      .sort((a, b) => b.avg_score - a.avg_score)
      .slice(0, 5);

    const totalAttempts = allAttempts?.length || 0;
    const avgScore = (allAttempts && totalAttempts > 0) ? Math.round(allAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts) : 0;

    const dashboard = {
      studentOverview: [{
        total_exams_taken: studentAttempts?.length || 0,
        avg_score: studentAttempts && studentAttempts.length > 0 ? Math.round(studentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / studentAttempts.length) : 0,
        current_streak: userStats?.streak || 0,
        total_xp_earned: userStats?.xp || 0
      }],
      testAnalytics: [],
      globalLeaderboard,
      engagementMetrics: [],
      summary: {
        totalStudents: Object.keys(leaderMap).length,
        totalTests: [...new Set((allAttempts || []).map(a => a.test_id))].length,
        totalAttempts,
        avgScore
      }
    };

    res.status(200).json(dashboard);
  } catch (error: any) {
    console.error('[Analytics] Dashboard Crash:', error);
    res.status(200).json({ studentOverview: [], testAnalytics: [], globalLeaderboard: [], engagementMetrics: [], summary: { totalStudents: 0, totalTests: 0, totalAttempts: 0, avgScore: 0 } });
  }
};
