import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, Clock, ShieldCheck } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    { icon: <Clock className="text-primary" />, title: 'Real-time Timer', desc: 'Simulate actual exam conditions with our precise test engine.' },
    { icon: <Trophy className="text-secondary" />, title: 'Detailed Results', desc: 'Get instant feedback and comprehensive performance analytics.' },
    { icon: <ShieldCheck className="text-accent" />, title: 'Secure Platform', desc: 'Integrated anti-cheat measures and secure login systems.' },
    { icon: <BookOpen className="text-success" />, title: 'Diverse Tests', desc: 'Access a wide range of mock tests across various subjects.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '4rem 0' }}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}
        >
          Master Your Exams <br />
          with <span style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Myra Chappy
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 2.5rem' }}
        >
          The ultimate platform for online mock tests. Practice, analyze, and improve your scores with our real-world exam simulation engine.
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
