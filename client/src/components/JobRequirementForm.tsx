import React, { useState } from 'react';
import { Briefcase, Plus, Tag, CheckCircle } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface JobRequirementFormProps {
  onJobCreated: (job: any) => void;
}

export const JobRequirementForm: React.FC<JobRequirementFormProps> = ({ onJobCreated }) => {
  const [title, setTitle] = useState('Backend Engineer');
  const [description, setDescription] = useState(
    'Role requirement for a Senior Backend Engineer proficient in Node.js, Express, MongoDB, and REST APIs with at least 2 years experience.'
  );
  const [requiredSkillsInput, setRequiredSkillsInput] = useState('Node.js, Express, MongoDB, REST APIs');
  const [preferredSkillsInput, setPreferredSkillsInput] = useState('TypeScript, Docker, Redis');
  const [minExperienceYears, setMinExperienceYears] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const requiredSkills = requiredSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const preferredSkills = preferredSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (requiredSkills.length === 0) {
      setError('Please provide at least one required skill.');
      setLoading(false);
      return;
    }

    try {
      const res = await ApiService.createJob({
        title,
        description,
        requiredSkills,
        preferredSkills,
        minExperienceYears: Number(minExperienceYears)
      });

      if (res.success && res.job) {
        onJobCreated(res.job);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create job requirement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
          <Briefcase size={22} color="var(--accent-cyan)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>1. Formulate Role Requirement</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Define hiring criteria for the Recruiter Agent to discover specialized screening services.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Role Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.95rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Minimum Experience (Years) *
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={minExperienceYears}
              onChange={(e) => setMinExperienceYears(Number(e.target.value))}
              required
              style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.95rem' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Required Skills (Comma Separated) *
          </label>
          <input
            type="text"
            value={requiredSkillsInput}
            onChange={(e) => setRequiredSkillsInput(e.target.value)}
            placeholder="Node.js, Express, MongoDB, REST APIs"
            required
            style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.95rem' }}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Preferred Skills (Optional)
          </label>
          <input
            type="text"
            value={preferredSkillsInput}
            onChange={(e) => setPreferredSkillsInput(e.target.value)}
            placeholder="TypeScript, Docker, Redis"
            style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.95rem' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Role Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-sm)',
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
            }}
          >
            <CheckCircle size={18} />
            {loading ? 'Creating Requirement...' : 'Save & Discover Screening Agents'}
          </button>
        </div>
      </form>
    </div>
  );
};
