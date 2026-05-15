import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle2, AlertCircle, ChevronLeft, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../../services/api';

const SyllabusManager: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [stats, setStats] = useState({ subjects: 0, chapters: 0, topics: 0 });

  const fetchStats = async () => {
    try {
      const subRes = await api.get('/syllabus/subjects');
      setStats(prev => ({ ...prev, subjects: subRes.data?.length || 0 }));
    } catch (err) {
      console.error('Failed to fetch syllabus stats');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to delete ALL syllabus data? This cannot be undone.')) return;
    
    try {
      setUploading(true);
      await api.delete('/syllabus/reset');
      setStats({ subjects: 0, chapters: 0, topics: 0 });
      setStatus({ type: 'success', msg: 'Syllabus bank has been reset successfully!' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: 'Failed to reset syllabus' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        let rows: any[] = [];

        if (file.name.endsWith('.csv')) {
          const text = data as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          rows = lines.slice(1).filter(l => l.trim()).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj: any = {};
            headers.forEach((header, i) => {
              obj[header] = values[i];
            });
            return obj;
          });
        } else {
          // Handle Excel (.xlsx, .xls)
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          rows = XLSX.utils.sheet_to_json(worksheet);
        }

        const res = await api.post('/syllabus/upload', { rows });
        setStatus({ type: 'success', msg: `Successfully uploaded ${res.data.count} syllabus entries!` });
        setFile(null);
        fetchStats(); // Refresh stats
      } catch (err: any) {
        setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to parse or upload file' });
      } finally {
        setUploading(false);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ChevronLeft size={20} /> Back to Dashboard
        </button>

        {stats.subjects > 0 && (
          <button
            onClick={handleReset}
            disabled={uploading}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '8px', 
              background: 'rgba(239,68,68,0.1)', 
              color: 'var(--danger)', 
              border: '1px solid rgba(239,68,68,0.2)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reset All Syllabus Data
          </button>
        )}
      </div>

      <div className="glass" style={{ padding: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
        <Database size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Syllabus Bank</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Upload your subject syllabus to get 100% accurate AI battles.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.subjects}</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subjects</p>
          </div>
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Structured</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Format</p>
          </div>
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>AI</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grounded</p>
          </div>
        </div>

        <div style={{ border: '2px dashed var(--glass-border)', padding: '3rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)' }}>
          <input 
            type="file" 
            id="csv-upload" 
            accept=".csv, .xlsx, .xls" 
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
            style={{ display: 'none' }}
          />
          <label htmlFor="csv-upload" style={{ cursor: 'pointer' }}>
            <Upload size={40} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p style={{ fontWeight: 600 }}>{file ? file.name : 'Click to select Syllabus (CSV or Excel)'}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Supported: .csv, .xlsx, .xls</p>
          </label>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFileUpload}
          disabled={uploading || !file}
          style={{ 
            marginTop: '2rem', 
            padding: '1rem 3rem', 
            borderRadius: '12px', 
            background: file ? 'var(--primary)' : 'var(--glass)', 
            color: file ? 'white' : 'var(--text-muted)', 
            fontWeight: 800, 
            border: 'none', 
            cursor: file ? 'pointer' : 'not-allowed',
            boxShadow: file ? '0 10px 20px rgba(99,102,241,0.2)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          {uploading ? 'Uploading...' : file ? 'Import Syllabus 🚀' : 'Select a File to Import'}
        </motion.button>

        {status && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              borderRadius: '10px', 
              background: status.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: status.type === 'success' ? 'var(--success)' : 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {status.msg}
          </motion.div>
        )}
      </div>

      <div className="glass" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--secondary)" /> Instructions
          </h2>
          <a 
            href="/syllabus_template.csv" 
            download 
            style={{ 
              fontSize: '0.8rem', 
              color: 'var(--primary)', 
              fontWeight: 700, 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)'
            }}
          >
            Download Sample CSV 📥
          </a>
        </div>
        <ul style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <li>1. Create an Excel file with headers: <strong>Subject, Chapter, Topic, Context</strong></li>
          <li>2. Fill in your syllabus data for each subject.</li>
          <li>3. You can upload the <strong>Excel (.xlsx)</strong> file directly, or save it as <strong>CSV</strong>.</li>
          <li>4. Upload it here. The AI will use the "Context" column to generate questions.</li>
        </ul>
      </div>
    </div>
  );
};

export default SyllabusManager;
