import React, { useState, useEffect } from 'react';
import { Users, FileUser, CheckCircle, Code, Award } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface ResumeBatchViewProps {
  onContinueToScreening: (resumes: any[]) => void;
}

export const ResumeBatchView: React.FC<ResumeBatchViewProps> = ({ onContinueToScreening }) => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.getSyntheticResumes();
      if (res.success && Array.isArray(res.resumes)) {
        setResumes(res.resumes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load synthetic candidate resumes dataset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
            <Users size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>5. Synthetic Resume Dataset Input</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Synthetic candidate batch provided off-chain for Screening Agent evaluation.
            </p>
          </div>
        </div>

        <button
          onClick={() => onContinueToScreening(resumes)}
          disabled={resumes.length === 0}
          style={{
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            border: 'none',
            color: '#fff',
            fontWeight: 600,
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            cursor: resumes.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
          }}
        >
          <CheckCircle size={18} />
          Execute Screening Agent Evaluation ({resumes.length} Resumes)
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
          <p>Loading synthetic candidate resume dataset...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {resumes.map((resume) => (
            <div
              key={resume.candidateId}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileUser size={18} color="var(--accent-cyan)" />
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{resume.name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {resume.candidateId}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={14} color="var(--accent-purple)" />
                  Experience: <strong>{resume.experienceYears} year(s)</strong>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Code size={12} /> Tech Stack & Skills:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {resume.skills?.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                Education: {resume.education || 'B.S. Computer Science'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
