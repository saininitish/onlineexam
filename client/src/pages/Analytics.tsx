import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  TrendingUp, Target, Award, Zap, Brain, ChevronRight, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const XPGrowthChart = ({ data }: { data: any[] }) => (
  <div className="glass p-6 h-[300px]">
    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
      <Zap size={20} className="text-yellow-500" /> XP Growth Trend
    </h3>
    <ResponsiveContainer width="100%" height="80%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} axisLine={false} tickLine={false} />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} axisLine={false} tickLine={false} />
        <Tooltip 
          contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px' }}
          itemStyle={{ color: 'var(--primary)' }}
        />
        <Area type="monotone" dataKey="xp" stroke="var(--primary)" fillOpacity={1} fill="url(#colorXp)" strokeWidth={3} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const SubjectRadar = ({ data }: { data: any[] }) => (
  <div className="glass p-6 h-[300px]">
    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
      <Brain size={20} className="text-purple-500" /> Skill Radar
    </h3>
    <ResponsiveContainer width="100%" height="80%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Student"
          dataKey="score"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  </div>
);

const PerformanceTrend = ({ data }: { data: any[] }) => (
  <div className="glass p-6 h-[300px]">
    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
      <TrendingUp size={20} className="text-primary" /> Performance Trend
    </h3>
    <ResponsiveContainer width="100%" height="80%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="rgba(255,255,255,0.5)" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke="rgba(255,255,255,0.5)" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false}
          domain={[0, 100]}
        />
        <Tooltip 
          contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
          itemStyle={{ color: 'var(--primary)' }}
        />
        <Line 
          type="monotone" 
          dataKey="accuracy" 
          stroke="var(--primary)" 
          strokeWidth={3} 
          dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }} 
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const TopicCard = ({ data, index }: { data: any, index: number }) => {
  const isWeak = data.status === 'Weak';
  const isStrong = data.status === 'Strong';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass p-4 border border-white/5 hover:border-primary/20 transition-all"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-white truncate max-w-[150px]">{data.topic}</h3>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
          isWeak ? 'bg-red-500/10 text-red-500' : isStrong ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
        }`}>
          {data.status}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-gray-400">Proficiency</span>
            <span className="text-white font-bold">{data.accuracy}%</span>
          </div>
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.accuracy}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full ${isWeak ? 'bg-red-500' : isStrong ? 'bg-green-500' : 'bg-orange-500'}`}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
          <div>
            <p className="text-[9px] text-gray-400 uppercase font-bold">Avg Time</p>
            <p className="text-xs font-bold text-white">{data.avgTime}s</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase font-bold">Topic Score</p>
            <p className="text-xs font-bold text-white">{data.score}/100</p>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-primary/5 p-2 rounded-lg">
          <Sparkles size={12} className="text-primary mt-0.5" />
          <p className="text-[10px] text-gray-300 leading-tight">{data.recommendation}</p>
        </div>
      </div>
    </motion.div>
  );
};

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [topicStats, setTopicStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchInsights();
  }, [user, navigate]);

  const fetchInsights = async () => {
    try {
      const { data } = await api.get('/analytics/weak-topics');
      setTopicStats(data.data || []);
    } catch (error) {
      console.error('Failed to fetch insights', error);
    } finally {
      setLoading(false);
    }
  };

  // Topics analysis calculated but simplified for current UI

  if (loading) return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 font-medium animate-pulse">Analyzing your performance...</p>
    </div>
  );

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">
      {/* Header with Breadcrumbs */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Performance Report</p>
        <h1 className="text-4xl font-black text-white tracking-tight">Student Analytics</h1>
      </div>

      {/* Professional Metric Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Global Rank', value: '#124', sub: 'Top 5%', icon: Award, color: '#f59e0b' },
          { label: 'Avg Accuracy', value: '78.4%', sub: '+2.1% from last', icon: Target, color: '#10b981' },
          { label: 'Total XP', value: '12,450', sub: 'Level 14', icon: Zap, color: '#6366f1' },
          { label: 'Current Streak', value: '12 Days', sub: 'Personal Record', icon: Sparkles, color: '#ec4899' },
        ].map((tile, i) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <tile.icon size={20} style={{ color: tile.color }} />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{tile.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-white">{tile.value}</h3>
              <span className="text-[10px] font-bold text-green-400">{tile.sub}</span>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <tile.icon size={80} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance & Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <PerformanceTrend data={[
            { name: 'Mon', accuracy: 65 },
            { name: 'Tue', accuracy: 72 },
            { name: 'Wed', accuracy: 68 },
            { name: 'Thu', accuracy: 85 },
            { name: 'Fri', accuracy: 82 },
          ]} />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <XPGrowthChart data={[
            { name: 'Day 1', xp: 400 },
            { name: 'Day 2', xp: 1200 },
            { name: 'Day 3', xp: 2100 },
            { name: 'Day 4', xp: 3400 },
            { name: 'Day 5', xp: 4800 },
          ]} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SubjectRadar data={[
            { subject: 'Math', score: 85 },
            { subject: 'Science', score: 65 },
            { subject: 'English', score: 90 },
            { subject: 'History', score: 45 },
            { subject: 'Civics', score: 70 },
          ]} />
        </div>

        {/* AI Strategy / Global Level Section (previously in the side) */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-6 h-full border-l-8 border-primary/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Sparkles className="text-primary" size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">Advanced Growth Strategy</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm font-bold text-primary mb-1 flex items-center gap-2">
                    <Zap size={14} /> Power Move
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Your <b>Consistency</b> is your biggest strength. If you maintain your 12-day streak for another week, 
                    you are predicted to reach <b>Level 18</b>.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  Continue Growth Path <ChevronRight size={18} />
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="glass p-4 text-center flex flex-col justify-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Growth Rate</p>
                  <p className="text-2xl font-black text-green-400">+18%</p>
                  <p className="text-[9px] text-gray-500">vs last week</p>
                </div>
                <div className="glass p-4 text-center flex flex-col justify-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Peer Rank</p>
                  <p className="text-2xl font-black text-primary">Top 2%</p>
                  <p className="text-[9px] text-gray-500">Global</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Full Topic Breakdown */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Target className="text-accent" size={28} />
          Topic-wise Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {topicStats.map((topic, i) => (
            <TopicCard key={topic.topic} data={topic} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;