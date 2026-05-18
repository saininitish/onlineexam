import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Bot, 
  FileText, 
  Lightbulb, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCw, 
  Play, 
  Check, 
  Zap,
  BookmarkCheck
} from 'lucide-react';
import api from '../../services/api';

interface KeyConcept {
  title: string;
  explanation: string;
  mnemonic?: string;
}

interface FormulaItem {
  name: string;
  formula: string;
  variables: string;
  notes: string;
}

interface Flashcard {
  question: string;
  answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface QuizItem {
  question: string;
  answer: string;
}

interface StudentMistake {
  mistake: string;
  correction: string;
}

interface AIStudyMaterial {
  summary_notes: string[];
  key_concepts: KeyConcept[];
  formula_sheet: FormulaItem[];
  flashcards: Flashcard[];
  rapid_quiz: QuizItem[];
  student_mistakes: StudentMistake[];
}

const PRESETS = [
  {
    topic: "Electrostatics & Coulomb's Law",
    content: "Electrostatics is the study of electric charges at rest. Coulomb's Law states that the electrostatic force between two stationary point charges is directly proportional to the product of charges and inversely proportional to the square of distance. Quantization of charge Q = ne. Permittivity of free space is 8.85 x 10^-12. Force in medium F_med = F_vacuum / K."
  },
  {
    topic: "Quadratic Equations",
    content: "A quadratic equation is in the form ax^2 + bx + c = 0. The roots are given by the quadratic formula x = (-b +- sqrt(b^2 - 4ac)) / 2a. Discriminant D = b^2 - 4ac. If D > 0, roots are real and distinct. If D = 0, roots are real and equal. If D < 0, roots are complex. Sum of roots alpha + beta = -b/a, product of roots alpha * beta = c/a."
  },
  {
    topic: "Photosynthesis",
    content: "Photosynthesis is the process by which green plants transform light energy into chemical energy. Equation: 6CO2 + 6H2O + light -> C6H12O6 + 6O2. It occurs in chloroplasts containing chlorophyll. Light-dependent reactions occur in thylakoid membranes producing ATP and NADPH. Light-independent reactions (Calvin Cycle) occur in stroma where CO2 is fixed into glucose."
  }
];

const StudyAssistant: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [studyMaterial, setStudyMaterial] = useState<AIStudyMaterial | null>(null);

  // Interactive states for generated content
  const [activeTab, setActiveTab] = useState<'notes' | 'concepts' | 'formulas' | 'flashcards' | 'quiz' | 'mistakes'>('notes');
  const [currentFlashcard, setCurrentFlashcard] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [revealedQuiz, setRevealedQuiz] = useState<Record<number, boolean>>({});

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a topic name!');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStudyMaterial(null);
      setIsFlipped(false);
      setCurrentFlashcard(0);
      setRevealedQuiz({});

      const res = await api.post('/ai/generate-notes', { 
        topic: topic.trim(), 
        content: content.trim() 
      });

      if (res.data?.data) {
        setStudyMaterial(res.data.data);
        setActiveTab('notes');
      } else {
        throw new Error('No study material received');
      }
    } catch (err: any) {
      console.error('Error generating study material:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate study material. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: { topic: string; content: string }) => {
    setTopic(preset.topic);
    setContent(preset.content);
  };

  const handleNextCard = () => {
    if (!studyMaterial?.flashcards) return;
    setIsFlipped(false);
    setCurrentFlashcard((prev) => (prev + 1) % studyMaterial.flashcards.length);
  };

  const handlePrevCard = () => {
    if (!studyMaterial?.flashcards) return;
    setIsFlipped(false);
    setCurrentFlashcard((prev) => (prev - 1 + studyMaterial.flashcards.length) % studyMaterial.flashcards.length);
  };

  const toggleQuizAnswer = (index: number) => {
    setRevealedQuiz((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="study-assistant-container" style={{ color: 'white', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Premium Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
        borderRadius: '24px',
        padding: '2.5rem',
        marginBottom: '2rem',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ background: '#a855f7', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Groq Llama-3 AI Engine
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
              <Sparkles size={16} /> Instant Synthesis
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            AI Study Assistant & Flashcards <Bot color="#a855f7" />
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem', maxWidth: '650px' }}>
            Convert dense syllabus chapters, PDFs, or raw text into Smart Notes, Mnemonics, Formula Sheets, and Spaced Repetition Flashcards instantly.
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', minWidth: '220px' }}>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>AI Synthesis Power</p>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#a855f7' }}>10x Faster</h3>
          <p style={{ color: '#10b981', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Exam-Ready Revision</p>
        </div>
      </div>

      {/* Input Form & Presets */}
      <div style={{ 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: '24px', 
        padding: '2.5rem', 
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '2.5rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText color="var(--primary)" /> Step 1: Provide Study Material
        </h2>

        {/* Preset Buttons */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>Quick Test Presets (Click to autofill):</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => applyPreset(preset)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '14px',
                  background: topic === preset.topic ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: topic === preset.topic ? 'white' : 'var(--text-muted)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <BookmarkCheck size={16} /> {preset.topic}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Topic Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Electrostatics & Coulomb's Law, Quadratic Equations, Laws of Motion"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '16px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '1.05rem',
                fontWeight: 500
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Chapter Text / PDF Content / Raw Notes (Optional but recommended)
            </label>
            <textarea
              placeholder="Paste your dense chapter text, formulas, or raw study notes here... The AI will synthesize everything into structured revision assets."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '16px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '1.05rem',
                fontWeight: 500,
                resize: 'vertical'
              }}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              color: loading ? 'var(--text-muted)' : 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: loading ? 'none' : '0 10px 25px rgba(168,85,247,0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <>
                <RefreshCw className="spin" size={22} /> AI Synthesizing Masterpiece Study Assets...
              </>
            ) : (
              <>
                <Sparkles size={22} /> Generate Smart Notes & Flashcards (AI Assistant)
              </>
            )}
          </button>
        </form>
      </div>

      {/* Generated Content Section */}
      {studyMaterial && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          {/* Navigation Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            overflowX: 'auto', 
            paddingBottom: '1rem', 
            marginBottom: '2rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)' 
          }}>
            {[
              { id: 'notes', label: 'Summary Notes', icon: FileText },
              { id: 'concepts', label: 'Key Concepts & Mnemonics', icon: Lightbulb },
              { id: 'formulas', label: 'Formula Sheet', icon: Zap },
              { id: 'flashcards', label: 'Spaced Repetition Flashcards', icon: BookOpen },
              { id: 'quiz', label: 'Rapid Revision Quiz', icon: HelpCircle },
              { id: 'mistakes', label: 'Student Mistakes & Traps', icon: AlertTriangle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '16px',
                  background: activeTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                  border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === tab.id ? '0 10px 20px rgba(99,102,241,0.4)' : 'none'
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: SUMMARY NOTES */}
          {activeTab === 'notes' && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText color="var(--primary)" /> Smart Summary Notes
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {studyMaterial.summary_notes?.map((note, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '1.1rem', lineHeight: '1.6', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--primary)', padding: '0.35rem', borderRadius: '50%', marginTop: '0.2rem' }}>
                      <Check size={18} />
                    </div>
                    <div>{note}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 2: KEY CONCEPTS & MNEMONICS */}
          {activeTab === 'concepts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lightbulb color="#f59e0b" /> Key Concepts & Memory Tricks
              </h2>
              {studyMaterial.key_concepts?.map((concept, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#f59e0b' }}>{concept.title}</h3>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-muted)', marginBottom: concept.mnemonic ? '1.5rem' : 0 }}>
                    {concept.explanation}
                  </p>
                  {concept.mnemonic && (
                    <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(15,23,42,0.8) 100%)', border: '1px solid #f59e0b', padding: '1.5rem', borderRadius: '16px' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                        <Sparkles size={18} /> Memory Trick / Mnemonic
                      </h4>
                      <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'white' }}>{concept.mnemonic}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: FORMULA SHEET */}
          {activeTab === 'formulas' && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap color="#10b981" /> Important Formula Sheet
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem', fontWeight: 700 }}>Formula Name</th>
                      <th style={{ padding: '1rem', fontWeight: 700 }}>Equation / Formula</th>
                      <th style={{ padding: '1rem', fontWeight: 700 }}>Variables & Units</th>
                      <th style={{ padding: '1rem', fontWeight: 700 }}>Key Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studyMaterial.formula_sheet?.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <td style={{ padding: '1.25rem 1rem', fontWeight: 700, color: '#10b981' }}>{item.name}</td>
                        <td style={{ padding: '1.25rem 1rem', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{item.formula}</td>
                        <td style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>{item.variables}</td>
                        <td style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '700px', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen color="#a855f7" /> Spaced Repetition Flashcards
                </h2>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.35rem 1rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
                  Card {currentFlashcard + 1} of {studyMaterial.flashcards?.length || 0}
                </span>
              </div>

              {/* Interactive Flip Card */}
              {studyMaterial.flashcards?.[currentFlashcard] && (
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{ 
                    width: '100%', 
                    maxWidth: '700px', 
                    minHeight: '350px',
                    background: isFlipped ? 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(15,23,42,0.9) 100%)' : 'rgba(255,255,255,0.03)', 
                    borderRadius: '28px', 
                    padding: '3rem', 
                    border: isFlipped ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: isFlipped ? '0 20px 40px rgba(168,85,247,0.3)' : '0 10px 25px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                >
                  {/* Difficulty Badge */}
                  <span style={{ 
                    position: 'absolute', 
                    top: '24px', 
                    right: '24px', 
                    background: studyMaterial.flashcards[currentFlashcard].difficulty === 'Easy' ? 'rgba(16,185,129,0.2)' : studyMaterial.flashcards[currentFlashcard].difficulty === 'Medium' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', 
                    color: studyMaterial.flashcards[currentFlashcard].difficulty === 'Easy' ? '#10b981' : studyMaterial.flashcards[currentFlashcard].difficulty === 'Medium' ? '#f59e0b' : '#ef4444', 
                    border: `1px solid ${studyMaterial.flashcards[currentFlashcard].difficulty === 'Easy' ? '#10b981' : studyMaterial.flashcards[currentFlashcard].difficulty === 'Medium' ? '#f59e0b' : '#ef4444'}`,
                    padding: '0.35rem 1rem', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700 
                  }}>
                    {studyMaterial.flashcards[currentFlashcard].difficulty}
                  </span>

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {isFlipped ? '💡 ANSWER' : '❓ QUESTION'} (Click card to flip)
                  </div>

                  <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: '1.5', margin: '2rem 0', color: isFlipped ? '#a855f7' : 'white', textAlign: 'center' }}>
                    {isFlipped ? studyMaterial.flashcards[currentFlashcard].answer : studyMaterial.flashcards[currentFlashcard].question}
                  </div>

                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {isFlipped ? 'Click again to see question' : 'Click to reveal answer'}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <button
                  onClick={handlePrevCard}
                  style={{
                    padding: '1rem 2rem',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ChevronLeft size={20} /> Previous Card
                </button>
                <button
                  onClick={handleNextCard}
                  style={{
                    padding: '1rem 2rem',
                    borderRadius: '16px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 10px 20px rgba(99,102,241,0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Next Card <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: RAPID REVISION QUIZ */}
          {activeTab === 'quiz' && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle color="var(--primary)" /> Rapid Revision Quiz (5 Questions)
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
                Test your immediate recall! Read the question, guess the answer in your head, and click "Reveal Answer" to check.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {studyMaterial.rapid_quiz?.map((quiz, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: '1.5' }}>
                        <span style={{ color: 'var(--primary)', marginRight: '0.5rem' }}>Q{i + 1}.</span> {quiz.question}
                      </h3>
                      <button
                        onClick={() => toggleQuizAnswer(i)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '12px',
                          background: revealedQuiz[i] ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                          color: revealedQuiz[i] ? '#10b981' : 'white',
                          border: revealedQuiz[i] ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {revealedQuiz[i] ? 'Hide Answer' : 'Reveal Answer'}
                      </button>
                    </div>

                    {revealedQuiz[i] && (
                      <div style={{ background: 'rgba(16,185,129,0.1)', borderLeft: '4px solid #10b981', padding: '1.25rem', borderRadius: '0 16px 16px 0', marginTop: '1rem', animation: 'fadeIn 0.3s ease' }}>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#10b981', fontSize: '0.9rem', textTransform: 'uppercase' }}>Correct Answer:</h4>
                        <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'white' }}>{quiz.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: STUDENT MISTAKES & TRAPS */}
          {activeTab === 'mistakes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle color="#ef4444" /> Common Student Mistakes & Exam Traps
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {studyMaterial.student_mistakes?.map((trap, i) => (
                  <div key={i} style={{ background: 'rgba(239,68,68,0.05)', borderRadius: '24px', padding: '2.5rem', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', marginBottom: '1rem', fontWeight: 700, fontSize: '1.1rem' }}>
                        <AlertTriangle size={24} /> Exam Trap #{i + 1}
                      </div>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1rem', color: 'white', lineHeight: '1.4' }}>
                        {trap.mistake}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '1.25rem', borderRadius: '16px', marginTop: '1.5rem' }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#10b981', fontSize: '0.85rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={16} /> How to Avoid / Correction
                      </h4>
                      <p style={{ margin: 0, fontSize: '1.05rem', color: 'white', fontWeight: 600, lineHeight: '1.5' }}>{trap.correction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyAssistant;
