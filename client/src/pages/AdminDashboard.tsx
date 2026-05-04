import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, BarChart3, X, Trash2, FileQuestion, Eye, Trophy, Edit3, Search, Play, Upload, FileSpreadsheet, FileText, Table2 } from 'lucide-react';
import api from '../services/api';
import { serializeQuestion, parseQuestion } from '../utils/questionMeta';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem', borderRadius: '10px',
  background: 'var(--glass)', border: '1px solid var(--glass-border)',
  color: 'white', fontSize: '0.95rem', outline: 'none'
};
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500
};

type BulkQuestionRow = {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
};

/** RFC4180-style CSV row (commas inside "quotes" allowed). */
function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function splitLineByMode(line: string, mode: 'tab' | 'csv'): string[] {
  if (mode === 'tab') return line.split('\t').map((c) => c.trim());
  return parseCsvRow(line);
}

function pickDelimitedMode(sampleLine: string): 'tab' | 'csv' {
  const stripped = sampleLine.replace(/^\uFEFF/, '');
  const tabCols = stripped.split('\t').length;
  const csvCols = parseCsvRow(stripped).length;
  if (tabCols >= 6) return 'tab';
  if (csvCols >= 6) return 'csv';
  return tabCols >= csvCols ? 'tab' : 'csv';
}

function isQuestionHeaderRow(line: string): boolean {
  const stripped = line.replace(/^\uFEFF/, '');
  const tabFirst = stripped.split('\t')[0]?.trim().toLowerCase();
  if (tabFirst === 'question') return true;
  const csvFirst = parseCsvRow(stripped)[0]?.trim().toLowerCase();
  return csvFirst === 'question';
}

function parseBulkQuestions(raw: string): BulkQuestionRow[] {
  const t = raw.trim();
  if (!t) throw new Error('Kuch paste ya type karein (khali nahi).');

  if (t.startsWith('[')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(t);
    } catch {
      throw new Error('JSON galat hai — array format check karein.');
    }
    if (!Array.isArray(parsed)) throw new Error('JSON ek array hona chahiye.');
    return parsed.map((q: any, idx: number) => {
      const question = String(q.question ?? '').trim();
      const option_a = String(q.option_a ?? '').trim();
      const option_b = String(q.option_b ?? '').trim();
      const option_c = String(q.option_c ?? '').trim();
      const option_d = String(q.option_d ?? '').trim();
      const correct_raw = q.correct_answer || q.correct_answers || '';
      const correct_answer = String(correct_raw).trim().toLowerCase();
      if (!question || !option_a || !option_b || !option_c || !option_d) {
        throw new Error(`JSON row ${idx + 1}: question aur chaaron options zaroori hain.`);
      }
      if (!['a', 'b', 'c', 'd'].includes(correct_answer)) {
        throw new Error(`JSON row ${idx + 1}: correct_answer a, b, c, ya d hona chahiye.`);
      }
      const topic = String(q.topic ?? '').trim();
      const difficulty = String(q.difficulty ?? '').trim();
      const chapter = String(q.chapter ?? '').trim();

      const row: BulkQuestionRow = {
        question: serializeQuestion(question, topic, difficulty, chapter),
        option_a, option_b, option_c, option_d, correct_answer
      };
      return row;
    });
  }

  let lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
  if (lines.length === 0) throw new Error('Koi data line nahi mili.');

  if (isQuestionHeaderRow(lines[0])) lines = lines.slice(1);
  if (lines.length === 0) throw new Error('Sirf header tha — neeche questions add karein.');

  const mode = pickDelimitedMode(lines[0]);
  const sepLabel = mode === 'tab' ? 'TAB' : 'comma (CSV)';

  return lines.map((line, idx) => {
    const parts = splitLineByMode(line, mode);
    if (parts.length < 6) {
      throw new Error(
        `Line ${idx + 1}: 6 columns chahiye (question, option_a, option_b, option_c, option_d, correct) — separator: ${sepLabel}. Ab ${parts.length} column(s) hain.`
      );
    }
    const [question, option_a, option_b, option_c, option_d, correct_raw, topic, difficulty, chapter] = parts.map((c) => c?.trim() || '');
    return {
      question: serializeQuestion(question, topic, difficulty, chapter),
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer: correct_raw.toLowerCase()
    };
  });
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'results'>('tests');

  // Create/Edit Test Modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testForm, setTestForm] = useState({ id: '', title: '', duration: 30, marks_per_question: 1, negative_mark: 0 });
  const [testLoading, setTestLoading] = useState(false);

  // Manage Questions Panel
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Auto Generate Test Modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({ title: 'Generated Test', duration: 30, marks_per_question: 1, negative_mark: 0, topic: '', chapter: '' });
  const [generating, setGenerating] = useState(false);

  // Add/Edit Question Modal
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    id: '', question: '', question_hi: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a',
    topic: '', difficulty: 'Medium', chapter: ''
  });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkRaw, setBulkRaw] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkErr, setBulkErr] = useState('');
  const csvFileRef = useRef<HTMLInputElement>(null);
  const txtFileRef = useRef<HTMLInputElement>(null);
  const tsvFileRef = useRef<HTMLInputElement>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTests();
    fetchResults();
  }, []);

  const fetchTests = async () => {
    try {
      const { data } = await api.get('/admin/tests');
      setTests(data);
    } catch (err) {
      console.error('Failed to fetch tests', err);
    }
  };

  const fetchResults = async () => {
    try {
      const { data } = await api.get('/admin/results');
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch results', err);
    }
  };

  const fetchQuestions = async (testId: string) => {
    setQuestionsLoading(true);
    setActiveTestId(testId);
    try {
      const { data } = await api.get(`/admin/questions/${testId}`);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to fetch questions', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestLoading(true);
    try {
      if (testForm.id) {
        await api.put(`/admin/tests/${testForm.id}`, testForm);
        setSelectedTest((prev: any) =>
          prev && prev.id === testForm.id
            ? {
              ...prev,
              title: testForm.title,
              duration: Number(testForm.duration) || 0,
              marks_per_question: Number(testForm.marks_per_question) || 0,
              negative_mark: Number(testForm.negative_mark) || 0
            }
            : prev
        );
      } else {
        // Omitting id for new test creation
        const { id, ...createData } = testForm;
        const { data } = await api.post('/admin/tests', createData);
        setSelectedTest(data);
        fetchQuestions(data.id);
      }
      fetchTests();
      setIsTestModalOpen(false);
      setTestForm({ id: '', title: '', duration: 30, marks_per_question: 1, negative_mark: 0 });
    } catch (err) {
      console.error('Failed to save test', err);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuestion(true);
    try {
      const payload = {
        ...questionForm,
        question: serializeQuestion(questionForm.question, questionForm.topic, questionForm.difficulty, questionForm.chapter, questionForm.question_hi)
      };
      if (questionForm.id) {
        await api.put(`/admin/questions/${questionForm.id}`, payload);
        setSuccessMsg('Question updated!');
      } else {
        await api.post('/admin/questions', { ...payload, test_id: selectedTest.id });
        setSuccessMsg('Question added!');
      }
      setQuestionForm({ id: '', question: '', question_hi: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', topic: '', difficulty: 'Medium', chapter: '' });
      setIsQuestionOpen(false);
      fetchQuestions(selectedTest.id);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Failed to save question', err);
      setErrorMsg(err?.response?.data?.message || 'Failed to save question');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleGenerateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const { data: adminTests } = await api.get('/admin/tests');
      let allQuestions: any[] = [];

      for (const t of adminTests) {
        try {
          const { data: qData } = await api.get(`/admin/questions/${t.id}`);
          allQuestions = [...allQuestions, ...qData];
        } catch (e) { }
      }

      let pool = allQuestions.map(q => {
        const meta = parseQuestion(q.question);
        return { ...q, meta };
      });

      if (generateForm.topic) {
        pool = pool.filter(q => q.meta.topic?.toLowerCase().includes(generateForm.topic.toLowerCase()));
      }
      if (generateForm.chapter) {
        pool = pool.filter(q => q.meta.chapter?.toLowerCase().includes(generateForm.chapter.toLowerCase()));
      }

      const easy = pool.filter(q => q.meta.difficulty === 'Easy').sort(() => 0.5 - Math.random()).slice(0, 5);
      const medium = pool.filter(q => q.meta.difficulty === 'Medium').sort(() => 0.5 - Math.random()).slice(0, 5);
      const hard = pool.filter(q => q.meta.difficulty === 'Hard').sort(() => 0.5 - Math.random()).slice(0, 5);

      const selected = [...easy, ...medium, ...hard];
      if (selected.length === 0) {
        alert('Not enough questions match your criteria across your tests!');
        setGenerating(false);
        return;
      }

      const { data: newTest } = await api.post('/admin/tests', {
        title: generateForm.title,
        duration: generateForm.duration,
        marks_per_question: generateForm.marks_per_question,
        negative_mark: generateForm.negative_mark
      });

      const payload = selected.map(q => ({
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer
      }));

      await api.post('/admin/questions/bulk', {
        test_id: newTest.id,
        questions: payload
      });

      alert(`Successfully generated test with ${selected.length} questions! (${easy.length} Easy, ${medium.length} Medium, ${hard.length} Hard)`);
      setIsGenerateOpen(false);
      fetchTests();
    } catch (err) {
      console.error(err);
      alert('Failed to generate test. Make sure you have enough questions in other tests.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!activeTestId) return;
    const topic = prompt("Enter topic (e.g. Percentage, Indian History):");
    if (!topic) return;
    const difficulty = prompt("Enter difficulty (Easy/Medium/Hard):") || 'Medium';

    setIsAiLoading(true);
    try {
      const { data } = await api.post('/admin/ai/generate-questions', { topic, difficulty, count: 5 });
      const questionsWithTestId = data.map((q: any) => ({
        ...q,
        test_id: activeTestId,
        question: serializeQuestion(q.question, q.topic, q.difficulty, '')
      }));
      await api.post('/admin/questions/bulk', { test_id: activeTestId, questions: questionsWithTestId });
      fetchQuestions(activeTestId);
      alert('✨ 5 AI Questions generated and added successfully!');
    } catch (err) {
      console.error(err);
      alert('AI Generation failed. Check server logs.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest?.id) return;
    setBulkErr('');
    setBulkLoading(true);
    try {
      const rows = parseBulkQuestions(bulkRaw);
      const { data } = await api.post('/admin/questions/bulk', {
        test_id: selectedTest.id,
        questions: rows
      });
      setSuccessMsg(data.message || `${data.inserted} questions bulk mein add ho gaye!`);
      setBulkRaw('');
      setIsBulkOpen(false);
      fetchQuestions(selectedTest.id);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : '') ||
        'Bulk upload fail';
      setBulkErr(msg);
    } finally {
      setBulkLoading(false);
    }
  };

  const readBulkTextFile = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'csv' | 'txt' | 'tsv') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBulkErr('');
    try {
      setBulkRaw(await file.text());
    } catch (err: unknown) {
      setBulkErr(err instanceof Error ? err.message : `${kind} read fail`);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${qId}`);
      fetchQuestions(selectedTest.id);
    } catch (err) {
      console.error('Failed to delete question', err);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Delete this test, all questions, and all student attempts for it?')) return;
    try {
      await api.delete(`/admin/tests/${testId}`);
      fetchTests();
      fetchResults();
      if (selectedTest?.id === testId) setSelectedTest(null);
    } catch (err: any) {
      console.error('Failed to delete test', err);
      const msg = err?.response?.data?.message || err?.message || 'Test delete failed';
      alert(msg);
    }
  };

  const openEditTest = (test: any) => {
    setTestForm({
      id: test.id,
      title: test.title,
      duration: Number(test.duration) || 0,
      marks_per_question: Number(test.marks_per_question) || 0,
      negative_mark: Number(test.negative_mark) || 0
    });
    setSelectedTest(test);
    fetchQuestions(test.id);
    setActiveTab('tests');
    setIsTestModalOpen(true);
  };

  const openEditQuestion = (q: any) => {
    const meta = parseQuestion(q.question);
    setQuestionForm({
      id: q.id,
      question: meta.text,
      question_hi: meta.text_hi || '',
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      topic: meta.topic || '',
      difficulty: meta.difficulty || 'Medium',
      chapter: meta.chapter || ''
    });
    setIsQuestionOpen(true);
  };

  const filteredResults = results.filter(res =>
    res.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.tests?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem' }}>Admin Control</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage tests and track student performance.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setIsGenerateOpen(true)}
            style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            💡 Auto Generate Test
          </button>
          <button
            onClick={() => {
              setTestForm({ id: '', title: '', duration: 30, marks_per_question: 1, negative_mark: 0 });
              setSelectedTest(null);
              setIsTestModalOpen(true);
            }}
            style={{ background: 'var(--primary)', color: 'white', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={20} /> Create New Test
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {(['tests', 'results'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedTest(null); }}
            style={{
              padding: '0.75rem 2rem', borderRadius: '10px',
              background: activeTab === tab ? 'var(--glass)' : 'transparent',
              color: activeTab === tab ? (tab === 'tests' ? 'var(--primary)' : 'var(--secondary)') : 'var(--text-muted)',
              fontWeight: 600,
              border: activeTab === tab ? `1px solid ${tab === 'tests' ? 'var(--primary)' : 'var(--secondary)'}` : '1px solid transparent'
            }}
          >
            {tab === 'tests' ? <><List size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Tests ({tests.length})</> :
              <><BarChart3 size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Results ({results.length})</>}
          </button>
        ))}

        {activeTab === 'results' && (
          <div style={{ marginLeft: 'auto', position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search students or tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '40px', fontSize: '0.85rem' }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTest ? '1fr 1fr' : '1fr', gap: '2rem' }}>
        {/* Main List Panel */}
        <div className="glass" style={{ padding: '2rem', minHeight: '400px' }}>
          {activeTab === 'tests' ? (
            tests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tests.map(test => (
                  <motion.div
                    key={test.id}
                    whileHover={{ x: 5 }}
                    style={{
                      padding: '1.5rem', borderRadius: '14px',
                      background: selectedTest?.id === test.id ? 'rgba(99,102,241,0.15)' : 'var(--glass)',
                      border: selectedTest?.id === test.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedTest(test);
                      fetchQuestions(test.id);
                      setIsQuestionOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.15rem' }}>{test.title}</h3>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <span>⏱ {test.duration}m</span>
                          <span>✅ +{test.marks_per_question}</span>
                          <span>❌ -{test.negative_mark}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/test/${test.id}`); }}
                          style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--success)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.25)' }}
                          title="Preview test (student view)"
                        >
                          <Play size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditTest(test); }}
                          style={{ background: 'var(--glass)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                          title="Edit Test"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); window.location.href = `/leaderboard/${test.id}`; }}
                          style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.2)' }}
                          title="Leaderboard"
                        >
                          <Trophy size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTest(test.id); }}
                          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <FileQuestion size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No tests yet.</p>
              </div>
            )
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem' }}>Student</th>
                  <th style={{ padding: '1rem' }}>Test</th>
                  <th style={{ padding: '1rem' }}>Score</th>
                  <th style={{ padding: '1rem' }}>Time</th>
                  <th style={{ padding: '1rem' }}>Cheating</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map(res => (
                  <tr key={res.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem' }}>{res.users?.name || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>{res.tests?.title || 'N/A'}</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: res.score >= 0 ? 'var(--success)' : 'var(--danger)' }}>{res.score}</td>
                    <td style={{ padding: '1rem' }}>{Math.floor(res.time_taken / 60)}m {res.time_taken % 60}s</td>
                    <td style={{ padding: '1rem' }}>
                       {res.tab_switches > 0 || res.fullscreen_exits > 0 ? (
                         <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>
                           ⚠️ {res.tab_switches} Tabs | {res.fullscreen_exits} FS
                         </span>
                       ) : (
                         <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>Clean</span>
                       )}
                    </td>
                    <td style={{ padding: '1rem' }}>{new Date(res.submitted_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => window.location.href = `/result/${res.id}`}
                        style={{ background: 'var(--glass)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        <Eye size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Question Panel */}
        {selectedTest && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass" style={{ padding: '2rem', minHeight: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem' }}>{selectedTest.title}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{questions.length} question(s)</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleAiGenerate}
                  disabled={isAiLoading}
                  className="glass"
                  style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 700, border: '1px solid var(--accent)', cursor: isAiLoading ? 'not-allowed' : 'pointer' }}
                >
                  {isAiLoading ? '⌛ Generating...' : '✨ AI Generate'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                      setQuestionForm({
                        id: '', question: '', question_hi: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a',
                        topic: '', difficulty: 'Medium', chapter: ''
                      });
                      setErrorMsg('');
                      setIsQuestionOpen(true);
                  }}
                  style={{ background: 'var(--success)', color: 'white', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}
                >
                  <Plus size={16} /> Add Q
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkErr('');
                    setIsBulkOpen(true);
                  }}
                  style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', border: '1px solid rgba(99, 102, 241, 0.35)', cursor: 'pointer' }}
                >
                  <Upload size={16} /> Bulk upload
                </button>
                <button onClick={() => setSelectedTest(null)} style={{ background: 'var(--glass)', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {successMsg && <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid rgba(16,185,129,0.2)' }}>{successMsg}</div>}
            {errorMsg && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)' }}>{errorMsg}</div>}

            {questionsLoading ? <p>Loading...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {questions.map((q, idx) => {
                  const meta = parseQuestion(q.question);
                  return (
                    <div key={q.id} style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1, paddingRight: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ background: 'var(--primary)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '5px', fontSize: '0.7rem' }}>Q{idx + 1}</span>
                            {meta.topic && <span style={{ background: 'var(--glass)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', padding: '0.1rem 0.5rem', borderRadius: '5px', fontSize: '0.65rem' }}>{meta.topic}</span>}
                            {meta.difficulty && <span style={{ background: 'var(--glass)', color: meta.difficulty === 'Hard' ? 'var(--danger)' : meta.difficulty === 'Medium' ? 'var(--secondary)' : 'var(--success)', border: '1px solid var(--glass-border)', padding: '0.1rem 0.5rem', borderRadius: '5px', fontSize: '0.65rem' }}>{meta.difficulty}</span>}
                            {meta.chapter && <span style={{ background: 'var(--glass)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', padding: '0.1rem 0.5rem', borderRadius: '5px', fontSize: '0.65rem' }}>Ch: {meta.chapter}</span>}
                          </div>
                          <p style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.5 }}>
                            {meta.text}
                            {meta.text_hi && (
                              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                हिंदी: {meta.text_hi}
                              </span>
                            )}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button onClick={() => openEditQuestion(q)} style={{ color: 'var(--primary)', background: 'transparent' }}><Edit3 size={14} /></button>
                          <button onClick={() => handleDeleteQuestion(q.id)} style={{ color: 'var(--danger)', background: 'transparent' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
                        {['a', 'b', 'c', 'd'].map(opt => (
                          <div key={opt} style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', background: q.correct_answer === opt ? 'rgba(16,185,129,0.1)' : 'transparent', border: q.correct_answer === opt ? '1px solid var(--success)' : '1px solid var(--glass-border)', color: q.correct_answer === opt ? 'var(--success)' : 'var(--text-muted)' }}>
                            <span style={{ fontWeight: 700, textTransform: 'uppercase', marginRight: '0.3rem' }}>{opt}.</span> {q[`option_${opt}`]}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Test Modal */}
      <AnimatePresence>
        {isTestModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative' }}>
              <button onClick={() => setIsTestModalOpen(false)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', color: 'var(--text-muted)' }}><X size={24} /></button>
              <h2 style={{ marginBottom: '2rem' }}>{testForm.id ? 'Edit Test' : 'New Mock Test'}</h2>
              <form onSubmit={handleSaveTest} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Test Title</label>
                  <input type="text" required value={testForm.title} onChange={e => setTestForm({ ...testForm, title: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Duration (mins)</label>
                    <input type="number" required value={testForm.duration ?? ''} onChange={e => setTestForm({ ...testForm, duration: Number(e.target.value) })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Marks/Q</label>
                    <input type="number" required step="any" value={testForm.marks_per_question ?? ''} onChange={e => setTestForm({ ...testForm, marks_per_question: Number(e.target.value) })} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Negative Mark</label>
                  <input type="number" required step="any" value={testForm.negative_mark ?? ''} onChange={e => setTestForm({ ...testForm, negative_mark: Number(e.target.value) })} style={inputStyle} />
                </div>
                <button type="submit" disabled={testLoading} style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '12px', fontWeight: 700 }}>
                  {testLoading ? 'Saving...' : 'Save Test'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk questions modal */}
      <AnimatePresence>
        {isBulkOpen && selectedTest && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass"
              style={{ width: '100%', maxWidth: 'min(92vw, 480px)', maxHeight: '90vh', padding: '1.35rem 1.25rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              <button
                type="button"
                onClick={() => { setIsBulkOpen(false); setBulkErr(''); }}
                style={{ position: 'absolute', right: '1rem', top: '1rem', color: 'var(--text-muted)' }}
              >
                <X size={22} />
              </button>
              <h2 style={{ margin: 0, paddingRight: '2rem', fontSize: '1.1rem' }}>Bulk upload — {selectedTest.title}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <input ref={csvFileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={(e) => readBulkTextFile(e, 'csv')} />
                <input ref={txtFileRef} type="file" accept=".txt,text/plain" style={{ display: 'none' }} onChange={(e) => readBulkTextFile(e, 'txt')} />
                <input ref={tsvFileRef} type="file" accept=".tsv,text/tab-separated-values,text/plain" style={{ display: 'none' }} onChange={(e) => readBulkTextFile(e, 'tsv')} />
                <button type="button" onClick={() => csvFileRef.current?.click()} style={{ padding: '0.55rem 1rem', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <FileSpreadsheet size={16} /> CSV
                </button>
                <button type="button" onClick={() => txtFileRef.current?.click()} style={{ padding: '0.55rem 1rem', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <FileText size={16} /> TXT
                </button>
                <button type="button" onClick={() => tsvFileRef.current?.click()} style={{ padding: '0.55rem 1rem', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <Table2 size={16} /> TSV
                </button>
              </div>
              {bulkErr && (
                <div style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.25)' }}>
                  {bulkErr}
                </div>
              )}
              <form onSubmit={handleBulkUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: 0 }}>
                <textarea
                  value={bulkRaw}
                  onChange={(e) => setBulkRaw(e.target.value)}
                  rows={10}
                  placeholder={`Question,A,B,C,D,Correct,Topic,Difficulty,Chapter`}
                  style={{ ...inputStyle, flex: 1, minHeight: '160px', resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}
                />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => { setIsBulkOpen(false); setBulkErr(''); }} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" disabled={bulkLoading || !bulkRaw.trim()} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', opacity: bulkLoading || !bulkRaw.trim() ? 0.6 : 1 }}>
                    {bulkLoading ? 'Uploading...' : 'Upload questions'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Question Modal */}
      <AnimatePresence>
        {isQuestionOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', position: 'relative' }}>
              <button onClick={() => setIsQuestionOpen(false)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', color: 'var(--text-muted)' }}><X size={24} /></button>
              <h2 style={{ marginBottom: '1.5rem' }}>{questionForm.id ? 'Edit Question' : 'Add Question'}</h2>
              {errorMsg && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)' }}>{errorMsg}</div>}
              <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <textarea required value={questionForm.question} onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })} rows={3} style={inputStyle} placeholder="Question (English)..." />
                  <textarea value={questionForm.question_hi} onChange={e => setQuestionForm({ ...questionForm, question_hi: e.target.value })} rows={3} style={inputStyle} placeholder="सवाल (हिंदी) - Optional" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <input key={opt} type="text" required value={(questionForm as any)[`option_${opt}`]} onChange={e => setQuestionForm({ ...questionForm, [`option_${opt}`]: e.target.value })} style={inputStyle} placeholder={`Option ${opt.toUpperCase()}`} />
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <input type="text" value={questionForm.topic} onChange={e => setQuestionForm({ ...questionForm, topic: e.target.value })} style={inputStyle} placeholder="Topic (Math, etc.)" />
                  <select value={questionForm.difficulty} onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value as any })} style={{ ...inputStyle, background: 'var(--glass)' }}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <input type="text" value={questionForm.chapter} onChange={e => setQuestionForm({ ...questionForm, chapter: e.target.value })} style={inputStyle} placeholder="Chapter" />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <button key={opt} type="button" onClick={() => setQuestionForm({ ...questionForm, correct_answer: opt })} style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', background: questionForm.correct_answer === opt ? 'var(--success)' : 'var(--glass)', color: questionForm.correct_answer === opt ? 'white' : 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>{opt.toUpperCase()}</button>
                  ))}
                </div>
                <button type="submit" disabled={savingQuestion} style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '12px', fontWeight: 700 }}>
                  {savingQuestion ? 'Saving...' : 'Save Question'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generate Auto Test Modal */}
      <AnimatePresence>
        {isGenerateOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative' }}>
              <button onClick={() => setIsGenerateOpen(false)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', color: 'var(--text-muted)' }}><X size={24} /></button>
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Trophy size={24} color="var(--primary)" /> Auto Generate Test</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Pulls 5 Easy, 5 Medium, and 5 Hard questions from your existing question pool to create a new test.</p>

              <form onSubmit={handleGenerateTest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div><label style={labelStyle}>Test Title</label><input required type="text" value={generateForm.title} onChange={e => setGenerateForm({ ...generateForm, title: e.target.value })} style={inputStyle} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><label style={labelStyle}>Topic (Optional filter)</label><input type="text" placeholder="e.g. Math" value={generateForm.topic} onChange={e => setGenerateForm({ ...generateForm, topic: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Chapter (Optional filter)</label><input type="text" value={generateForm.chapter} onChange={e => setGenerateForm({ ...generateForm, chapter: e.target.value })} style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div><label style={labelStyle}>Duration (mins)</label><input required type="number" min="1" value={generateForm.duration ?? ''} onChange={e => setGenerateForm({ ...generateForm, duration: Number(e.target.value) })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Marks / Q</label><input required type="number" min="0" step="any" value={generateForm.marks_per_question ?? ''} onChange={e => setGenerateForm({ ...generateForm, marks_per_question: Number(e.target.value) })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Negative</label><input required type="number" min="0" step="any" value={generateForm.negative_mark ?? ''} onChange={e => setGenerateForm({ ...generateForm, negative_mark: Number(e.target.value) })} style={inputStyle} /></div>
                </div>

                <button type="submit" disabled={generating} style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '12px', fontWeight: 700, marginTop: '1rem' }}>
                  {generating ? 'Generating Test...' : 'Generate 15-Question Test'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
