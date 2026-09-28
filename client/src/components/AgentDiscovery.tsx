import React, { useState, useEffect } from 'react';
import { Search, Bot, Star, ShieldCheck, ArrowRight, DollarSign } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { AmountUtils } from '../utils/amountUtils';

interface AgentDiscoveryProps {
  jobRequirement: any;
  onSelectAgent: (agent: any) => void;
}

export const AgentDiscovery: React.FC<AgentDiscoveryProps> = ({
  jobRequirement,
  onSelectAgent
}) => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscoveredAgents();
  }, [jobRequirement]);

  const fetchDiscoveredAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.discoverAgents(jobRequirement);
      if (res.success && Array.isArray(res.agents)) {
        setAgents(res.agents);
      } else {
        // Fallback to all agents
        const allAgentsRes = await ApiService.getAgents();
        if (allAgentsRes.success) {
          const screeners = allAgentsRes.agents.filter((a: any) => a.role === 'SCREENER');
          setAgents(screeners);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to discover screening agents.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
            <Search size={22} color="var(--accent-purple)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>2. Agent Discovery & Pricing</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Recruiter Agent matched specialized Screening Agents for role: <strong>{jobRequirement.title}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={fetchDiscoveredAgents}
          disabled={loading}
          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          {loading ? 'Refreshing...' : 'Refresh Quotes'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
          <p>Matching candidate requirements against active Screening Agent capabilities...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {agents.map((agent) => (
            <div
              key={agent.agentId}
              style={{
                background: 'rgba(17, 24, 39, 0.8)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={20} color="#fff" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem' }}>{agent.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                        {agent.role} AGENT
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(245, 158, 11, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '12px', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Star size={12} fill="#f59e0b" />
                    {agent.rating || 5.0}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  {agent.description}
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Capabilities & Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {agent.capabilities?.map((cap: string, i: number) => (
                      <span
                        key={i}
                        style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Public Seller Wallet:</span>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                      {AmountUtils.shortenAddress(agent.walletAddress)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Escrow Fee:</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <DollarSign size={16} />
                      {agent.pricePerTask} {agent.currency || 'MSTC'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectAgent(agent)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                Select Screening Agent <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
