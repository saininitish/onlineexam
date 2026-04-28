import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { TrendingUp, Target, Zap, Brain, Sparkles, Activity, Trophy, Rocket, History, LayoutDashboard, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- Premium Styled Components ---

const SectionWrapper = ({ title, subtitle, icon: Icon, children, color, id }: any) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8 }}
    className="w-full mb-32 relative"
  >
    <div className={`absolute top-0 left-0 w-[500px] h-[500px] blur-[150px] opacity-10 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2`} style={{ backgroundColor: color }} />

    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10" style={{ color }}>
            <Icon size={28} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">{title}</h2>
        </div>
        <p className="text-slate-400 text-lg font-medium max-w-xl ml-1">{subtitle}</p>
      </div>
      <div className="h-[2px] flex-1 bg-gradient-to-r from-white/5 to-transparent hidden md:block mb-4 mx-8" />
    </div>

    <div className="relative z-10">
      {children}
    </div>
  </motion.section>
);

const StatCard = ({ label, value, sub, icon: Icon, color, index }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className="relative p-8 rounded-[3rem] bg-[#0A0F1E] border border-white/5 overflow-hidden group cursor-pointer"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    <div
      className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:rotate-0 transition-all duration-500"
      style={{ color }}
    >
      <Icon size={140} />
    </div>

    <div className="flex flex-col h-full relative z-10">
      <div className="flex justify-between items-start mb-10">
        <div
          className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 group-hover:scale-110 group-hover:border-white/20 transition-all shadow-2xl shadow-black"
          style={{ color }}
        >
          <Icon size={32} />
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</span>
          <div className="h-1 w-10 rounded-full mt-2 ml-auto" style={{ backgroundColor: color }} />
        </div>
      </div>

      <div>
        <h3 className="text-5xl font-black text-white tracking-tighter mb-4 group-hover:translate-x-1 transition-transform tabular-nums">{value}</h3>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-green-400 font-black text-xs bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
            <TrendingUp size={14} /> {sub}
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Growth Metric</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0F1E]/95 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-3xl">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">{label}</p>
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-2xl font-black text-white">{payload[0].value}%</p>
        </div>
      </div>
    );
  }
  return null;
};

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPlan, setAiPlan] = useState<any>(null);

  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ovRes, topRes, timeRes, dashRes] = await Promise.all([
        api.get('/analytics/students/overview'),
        api.get('/analytics/students/topics'),
        api.get('/analytics/students/progress'),
        api.get('/analytics/dashboard')
      ]);

      setOverview(ovRes.data[0] || null);
      setTopics(topRes.data || []);
      setTimeline(timeRes.data || []);
      setDashboard(dashRes.data || null);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('analytics-content');
    if (!element) return;
    setGeneratingPdf(true);
    try {
      const canvas = await html2canvas(element, { backgroundColor: '#020617', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Full_Report_${user?.name.replace(' ', '_')}.pdf`);
    } catch (error) {
      alert('PDF failed');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const fetchAIStudyPlan = async () => {
    setGeneratingAi(true);
    try {
      const performanceData = {
        name: user?.name,
        avgAccuracy: overview?.avg_accuracy_percentage || 0,
        totalTests: overview?.total_exams_taken || 0,
        weakTopics: topics.filter(t => (t.accuracy_percentage || t.topic_accuracy_percentage) < 60).map(t => t.topic_name),
        strongTopics: topics.filter(t => (t.accuracy_percentage || t.topic_accuracy_percentage) >= 80).map(t => t.topic_name)
      };
      const { data } = await api.post('/student/ai/study-plan', { performanceData });
      setAiPlan(data);
      setShowAiModal(true);
    } catch (error: any) {
      alert('AI failed');
    } finally {
      setGeneratingAi(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="relative w-24 h-24">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-t-2 border-indigo-500 rounded-full" />
        <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" size={32} />
      </div>
    </div>
  );

  const progressData = timeline?.map((t, i) => ({
    name: t.recorded_at ? new Date(t.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `T-${i}`,
    score: t.score || 0
  })) || [];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* --- Floating Navigation (Quick Jump) --- */}
      <nav className="fixed left-8 top-1/2 -translate-y-1/2 z-[100] hidden xl:flex flex-col gap-6">
        {[
          { id: 'hero', icon: LayoutDashboard, label: 'Top' },
          { id: 'velocity', icon: TrendingUp, label: 'Growth' },
          { id: 'subjects', icon: Brain, label: 'Subjects' },
          { id: 'history', icon: History, label: 'History' }
        ].map(item => (
          <motion.a
            key={item.id}
            href={`#${item.id}`}
            whileHover={{ scale: 1.2, x: 5 }}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-indigo-600/20 hover:border-indigo-500/50 transition-all group relative"
          >
            <item.icon size={20} />
            <span className="absolute left-16 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest pointer-events-none">
              {item.label}
            </span>
          </motion.a>
        ))}
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-20">
        {/* --- Hero Header --- */}
        <header id="hero" className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-24">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-indigo-400 font-black uppercase tracking-[0.4em] text-[10px]">
              <Sparkles size={16} />
              AI-Powered Performance Core
            </div>
            <h1 className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">
              Mastery<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">Analysis</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <motion.button onClick={handleExportPDF} disabled={generatingPdf} whileHover={{ scale: 1.05 }} className="px-10 py-6 rounded-[2.5rem] bg-white text-black font-black text-sm uppercase tracking-widest shadow-3xl hover:bg-indigo-50 transition-all disabled:opacity-50">
              {generatingPdf ? 'Generating...' : 'Export PDF Report'}
            </motion.button>
            <motion.button onClick={fetchAIStudyPlan} disabled={generatingAi} whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(99,102,241,0.5)' }} className="px-10 py-6 rounded-[2.5rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-3xl hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center gap-3">
              <Sparkles size={20} /> AI Insight
            </motion.button>
          </div>
        </header>

        <div id="analytics-content" className="space-y-32">
          {/* --- Distinct Section 1: Core Metrics --- */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard label="Global Rank" value={`#${overview?.global_rank || '---'}`} sub="Top 5%" icon={Trophy} color="#F59E0B" index={0} />
            <StatCard label="Avg Accuracy" value={`${Math.round(overview?.avg_accuracy_percentage || 0)}%`} sub="+12%" icon={Target} color="#10B981" index={1} />
            <StatCard label="Cognitive XP" value={(overview?.total_xp_earned || 0).toLocaleString()} sub="+1.2k" icon={Zap} color="#8B5CF6" index={2} />
            <StatCard label="Daily Streak" value={`${overview?.current_streak || 0}d`} sub="Active" icon={Rocket} color="#EF4444" index={3} />
          </section>

          {/* --- Distinct Section 2: Velocity --- */}
          <SectionWrapper
            id="velocity"
            title="Growth Velocity"
            subtitle="Deep analysis of your performance trajectory over multiple attempts."
            icon={TrendingUp}
            color="#6366f1"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] p-12 shadow-3xl">
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressData}>
                      <defs>
                        <linearGradient id="colorVel" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} dy={20} />
                      <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip color="#6366f1" />} />
                      <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={8} fillOpacity={1} fill="url(#colorVel)" animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-10 rounded-[4rem] bg-[#0A0F1E] border border-white/5 flex flex-col">
                <div className="flex items-center gap-3 mb-10">
                  <Trophy className="text-amber-500" size={24} />
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Global Leaders</h3>
                </div>
                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {(dashboard?.globalLeaderboard || []).map((student: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-500/20 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' :
                            i === 1 ? 'bg-slate-400/20 text-slate-300' :
                              i === 2 ? 'bg-orange-700/20 text-orange-600' :
                                'bg-white/5 text-slate-500'
                          }`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{student.student_name || 'Anonymous'}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Elite Scholar</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-amber-500">{student.avg_score}%</p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase">Avg Score</p>
                      </div>
                    </div>
                  ))}
                  {(!dashboard?.globalLeaderboard || dashboard.globalLeaderboard.length === 0) && (
                    <div className="text-slate-600 text-sm italic py-10 text-center">No leaderboard data available</div>
                  )}
                </div>
              </div>
            </div>
          </SectionWrapper>

          {/* --- Distinct Section 3: Subjects --- */}
          <SectionWrapper
            id="subjects"
            title="Subject Intelligence"
            subtitle="Comparative analysis of your strengths across different cognitive domains."
            icon={Brain}
            color="#10b981"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topics.map((topic, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-10 rounded-[3.5rem] bg-[#0A0F1E] border border-white/5 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Brain size={32} />
                    </div>
                    <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                      {Math.round(topic.accuracy_percentage || topic.topic_accuracy_percentage || 0)}% Accurate
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-8 tracking-tighter">{topic.topic_name}</h3>
                  <div className="space-y-8">
                    <div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${topic.accuracy_percentage || topic.topic_accuracy_percentage || 0}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className="h-full bg-gradient-to-r from-emerald-600 to-cyan-500 rounded-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/5 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Attempts</p>
                        <p className="text-2xl font-black text-white">{topic.exams_count || 0}</p>
                      </div>
                      <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/5 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rank</p>
                        <p className="text-2xl font-black text-white">#{(topic.accuracy_percentage || topic.topic_accuracy_percentage || 0) > 80 ? '1' : '5'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionWrapper>

          {/* --- Distinct Section 4: History --- */}
          <SectionWrapper
            id="history"
            title="Attempt Chronology"
            subtitle="A complete historical record of your cognitive journey and passthrough logs."
            icon={History}
            color="#f43f5e"
          >
            <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] p-12 shadow-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Chronology</th>
                      <th className="pb-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Score Meta</th>
                      <th className="pb-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Timestamp</th>
                      <th className="pb-10 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {timeline.map((t, i) => (
                      <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-8 font-black text-2xl text-white tracking-tighter">{t.exam_name || `Log #${i + 1}`}</td>
                        <td className="py-8">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${t.score >= 80 ? 'bg-green-500' : 'bg-rose-500'}`} />
                            <span className="text-3xl font-black text-white tracking-tighter">{t.score}%</span>
                          </div>
                        </td>
                        <td className="py-8 text-slate-400 font-bold uppercase text-xs tracking-widest">
                          {new Date(t.recorded_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-8 text-right">
                          <span className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${t.score >= 50 ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            }`}>
                            {t.score >= 50 ? 'Successful' : 'Critical Review'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionWrapper>
        </div>
      </div>

      {/* AI Modal */}
      <AnimatePresence>
        {showAiModal && aiPlan && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0A0F1E] border border-white/10 max-w-2xl w-full rounded-[4rem] p-12 shadow-3xl relative overflow-hidden">
              <button onClick={() => setShowAiModal(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-colors">
                <XCircle size={36} />
              </button>
              <div className="flex items-center gap-6 mb-12">
                <div className="w-20 h-20 rounded-[2rem] bg-indigo-600/20 flex items-center justify-center text-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.3)] border border-indigo-500/30">
                  <Sparkles size={40} />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter">Elite Roadmap</h2>
                  <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mt-1">Intelligence Core Output</p>
                </div>
              </div>
              <div className="space-y-10">
                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 italic text-slate-300 text-lg leading-relaxed relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 rounded-full" />
                  "{aiPlan.insight}"
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Completion Est.</p>
                    <p className="text-2xl font-black text-indigo-400">{aiPlan.prediction}</p>
                  </div>
                  <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Priority Focus</p>
                    <p className="text-2xl font-black text-white truncate">{aiPlan.mastery_path}</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAiModal(false)} className="w-full py-6 rounded-[2.5rem] bg-white text-black font-black uppercase tracking-[0.3em] text-xs shadow-3xl">
                  Close Intelligence Core
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Analytics;