import React from 'react';
import { useProctoring } from '../../hooks/useProctoring';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';
import { Video, Monitor, Radio } from 'lucide-react';

export const LiveProctoring: React.FC<{ roomId: string }> = ({ roomId }) => {
  const user = useAuthStore(s => s.user);
  const { socket, activeStudents, streams, requestStudentStream } = useProctoring('admin', user?.id || 'admin', roomId);
  const isConnected = socket?.connected;
  const [gridSize, setGridSize] = React.useState(450); // Default min width in px

  return (
    <div className="glass" style={{ padding: '2rem', minHeight: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Radio size={24} color="var(--danger)" /> Live Proctoring Dashboard
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Resize Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'var(--glass)', padding: '0.4rem 1rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Monitor Size</span>
            <input 
              type="range" 
              min="300" 
              max="800" 
              value={gridSize} 
              onChange={(e) => setGridSize(Number(e.target.value))}
              style={{ cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected ? 'var(--success)' : 'var(--danger)' }} />
            <span>{isConnected ? 'Signaling Online' : 'Signaling Offline'}</span>
          </div>
          <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
            {activeStudents.length} Students Online
          </span>
        </div>
      </div>
      
      {!isConnected && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          ⚠️ <strong>Connection Issue:</strong> Admin panel signaling server se connect nahi ho pa raha hai. 
          Kripya check karein ki backend server (port 5000) chal raha hai aur firewall blocked nahi hai.
        </div>
      )}


      {activeStudents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Radio size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>No students are currently taking the exam.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}px, 1fr))`, gap: '2rem' }}>
          {activeStudents.map(studentId => (
            <motion.div
              key={studentId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass"
              style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', overflow: 'hidden' }}
            >

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Student ID: {studentId.slice(0, 8)}...</span>
                <button
                  onClick={() => requestStudentStream(studentId)}
                  style={{ background: 'var(--primary)', color: 'white', padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  Start Monitoring
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Camera View */}
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
                  <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.5)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    <Video size={14} color="white" />
                    <span style={{ color: 'white', fontSize: '0.7rem' }}>Camera</span>
                  </div>
                  {streams[`${studentId}-camera`] ? (
                    <video
                      autoPlay
                      playsInline
                      ref={el => { if (el) el.srcObject = streams[`${studentId}-camera`]; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                      Waiting for stream...
                    </div>
                  )}
                </div>

                {/* Screen View */}
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
                  <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.5)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    <Monitor size={14} color="white" />
                    <span style={{ color: 'white', fontSize: '0.7rem' }}>Screen</span>
                  </div>
                  {streams[`${studentId}-screen`] ? (
                    <video
                      autoPlay
                      playsInline
                      ref={el => { if (el) el.srcObject = streams[`${studentId}-screen`]; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                      Waiting for stream...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
