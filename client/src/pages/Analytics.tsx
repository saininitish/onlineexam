import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { BarChart3, TrendingUp, Users, Target, Award, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

// Chart Components
const PerformanceChart = ({ data, title }: { data: any[], title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value || 0));

  return (
    <div className="glass p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between"
          >
            <span className="text-sm text-gray-300 truncate flex-1 mr-4">{item.label}</span>
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / maxValue) * 100}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                />
              </div>
              <span className="text-sm font-medium text-white min-w-[3rem] text-right">
                {item.value}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const LeaderboardTable = ({ data, title }: { data: any[], title: string }) => (
  <div className="glass p-6">
    <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
      <Award className="w-5 h-5 text-yellow-400" />
      {title}
    </h3>
    <div className="space-y-2">
      {data.slice(0, 10).map((student, index) => (
        <motion.div
          key={student.student_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              index === 0 ? 'bg-yellow-500 text-black' :
              index === 1 ? 'bg-gray-400 text-black' :
              index === 2 ? 'bg-orange-600 text-white' :
              'bg-gray-600 text-white'
            }`}>
              {index + 1}
            </div>
            <div>
              <p className="font-medium text-white">{student.student_name}</p>
              <p className="text-xs text-gray-400">{student.avg_score?.toFixed(1)} avg score</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white">{student.total_attempts} attempts</p>
            <p className="text-xs text-green-400">{student.accuracy_percentage?.toFixed(1)}% accuracy</p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'leaderboard'>('overview');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAnalytics();
  }, [user, navigate]);

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/analytics/dashboard');
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass p-6 animate-pulse">
                <div className="h-4 bg-gray-600 rounded mb-2"></div>
                <div className="h-8 bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass p-6 animate-pulse">
                <div className="h-6 bg-gray-600 rounded mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-600 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Total Students',
      value: analytics?.summary?.totalStudents || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Tests',
      value: analytics?.summary?.totalTests || 0,
      icon: Target,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Attempts',
      value: analytics?.summary?.totalAttempts || 0,
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Average Score',
      value: analytics?.summary?.avgScore?.toFixed(1) || 0,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Comprehensive insights into student performance and test analytics</p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="glass p-6 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color}`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2 mb-6"
        >
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'leaderboard', label: 'Leaderboard', icon: Award }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'glass text-gray-300 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeaderboardTable
                data={analytics?.globalLeaderboard || []}
                title="Global Leaderboard"
              />
              <PerformanceChart
                data={(analytics?.testAnalytics || []).map((test: any) => ({
                  label: test.test_title,
                  value: test.avg_score
                }))}
                title="Test Performance"
              />
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceChart
                data={(analytics?.studentOverview || []).slice(0, 10).map((student: any) => ({
                  label: student.student_name,
                  value: student.avg_score
                }))}
                title="Student Performance"
              />
              <PerformanceChart
                data={(analytics?.engagementMetrics || []).slice(0, 10).map((student: any) => ({
                  label: student.student_name,
                  value: student.total_attempts
                }))}
                title="Student Engagement"
              />
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeaderboardTable
                data={analytics?.globalLeaderboard || []}
                title="Global Leaderboard"
              />
              <div className="glass p-6">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {(analytics?.engagementMetrics || [])
                    .filter((student: any) => student.engagement_status === 'Active')
                    .slice(0, 5)
                    .map((student: any, index: number) => (
                    <motion.div
                      key={student.student_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-white font-medium">{student.student_name}</span>
                      </div>
                      <span className="text-green-400 text-sm">Active</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;