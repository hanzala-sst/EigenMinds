import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface ScreeningViewProps {
  agreement: any;
  jobRequirement: any;
  onScreeningCompleted: (screeningTask: any) => void;
}

export const ScreeningView: React.FC<ScreeningViewProps> = ({
  agreement,
  jobRequirement,
  onScreeningCompleted
}) => {
  const [loading, setLoading] = useState(false);
  const [screeningTask, setScreeningTask] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecuteScreening = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.submitScreening({
        agreementId: agreement.agreementId,
        jobId: jobRequirement.jobId,
        screeningAgentId: agreement.screeningAgentId || 'AGENT-SCREENER-ALPHA'
      });

      if (res.success && res.task) {
        setScreeningTask(res.task);
      } else {
        throw new Error(res.message || 'Screening execution failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing screening evaluation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleExecuteScreening();
  }, []);

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'HIRE':
        return (
          <span style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--accent-emerald)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={14} /> HIRE
          </span>
        );
      case 'CONSIDER':
        return (
          <span style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertTriangle size={14} /> CONSIDER
          </span>
        );
      case 'REJECT':
      default:
        return (
          <span style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <XCircle size={14} /> REJECT
          </span>
        );
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
            <Cpu size={22} color="var(--accent-purple)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>6. Screening Agent Evaluation Report</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Autonomous candidate ranking, skill matching, and match score computation.
            </p>
          </div>
        </div>

        {screeningTask && (
          <button
            onClick={() => onScreeningCompleted(screeningTask)}
            style={{
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
            }}
          >
            <ShieldCheck size={18} />
            Validate with Verification Engine
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
          <p>Screening Agent evaluating synthetic resumes against role specification...</p>
        </div>
      ) : screeningTask ? (
        <div>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Evaluation Summary:</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {screeningTask.assessmentResult?.summary}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {screeningTask.assessmentResult?.rankings?.map((rank: any, idx: number) => (
              <div
                key={rank.candidateId}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ background: 'rgba(255, 255, 255, 0.1)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{rank.candidateName}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    ID: {rank.candidateId}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Match Score:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flexGrow: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${rank.matchScore}%`,
                          background: rank.matchScore >= 80 ? 'var(--accent-emerald)' : rank.matchScore >= 50 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: rank.matchScore >= 80 ? 'var(--accent-emerald)' : rank.matchScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {rank.matchScore}/100
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Recommendation:</div>
                  {getRecommendationBadge(rank.recommendation)}
                </div>

                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    <strong>Experience:</strong> {rank.experienceAssessment}
                  </div>
                  {rank.keyStrengths?.length > 0 && (
                    <div style={{ color: 'var(--accent-emerald)', marginBottom: '0.2rem' }}>
                      <strong>Key Strengths:</strong> {rank.keyStrengths.join(' | ')}
                    </div>
                  )}
                  {rank.missingSkills?.length > 0 && (
                    <div style={{ color: '#ef4444' }}>
                      <strong>Missing Required Skills:</strong> {rank.missingSkills.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
