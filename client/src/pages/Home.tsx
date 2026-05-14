import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, Trophy, Zap, ShieldCheck } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    { icon: <Zap className="text-primary" />, title: 'Real-time Battles', desc: 'Compete with friends or random players in real-time quiz battles.' },
    { icon: <Trophy className="text-secondary" />, title: 'Win Rewards', desc: 'Earn points, maintain streaks, and climb the global leaderboard.' },
    { icon: <ShieldCheck className="text-accent" />, title: 'AI Powered', desc: 'Get personalized AI-generated questions and detailed explanations.' },
    { icon: <Swords className="text-success" />, title: 'Study Mode', desc: 'Transform boring study sessions into engaging game sessions.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '4rem 0' }}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ fontSize: '4.5rem', marginBottom: '1.5rem', lineHeight: 1.1, fontWeight: 900 }}
        >
          Study Ko Game Banaao <br />
          with <span style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Exam Prep Battle
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: '1.4rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto 2.5rem' }}
        >
          The ultimate gamified learning platform. Join the arena, compete with peers, and master your exams through high-stakes quiz battles.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}
        >
          <Link to="/register" className="glass" style={{ background: 'var(--primary)', color: 'white', padding: '1rem 2.5rem', borderRadius: '14px', fontWeight: 700, fontSize: '1.1rem' }}>
            Start Free Test
          </Link>
          <Link to="/login" className="glass" style={{ padding: '1rem 2.5rem', borderRadius: '14px', fontWeight: 600, fontSize: '1.1rem' }}>
            View Demo
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        {features.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="glass"
            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={{ background: 'var(--glass)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>{f.title}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
};

export default Home;
