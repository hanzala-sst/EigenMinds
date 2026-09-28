import React, { useState } from 'react';
import { FileText, Shield, Wallet, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { AmountUtils } from '../utils/amountUtils';
import { IWalletState } from '../services/walletService';

interface AgreementPanelProps {
  jobRequirement: any;
  selectedAgent: any;
  walletState: IWalletState;
  onAgreementCreated: (agreement: any) => void;
}

export const AgreementPanel: React.FC<AgreementPanelProps> = ({
  jobRequirement,
  selectedAgent,
  walletState,
  onAgreementCreated
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recruiterWallet = walletState.address || '0x1111111111111111111111111111111111111111';
  const screeningAgentId = selectedAgent?.agentId || selectedAgent?.agent?.agentId || 'AGENT-SCREENER-ALPHA';
  const sellerWallet = selectedAgent?.walletAddress || selectedAgent?.agent?.walletAddress || '0x8fc62396f95b2212CF10E78EC695B8F55872dA16';
  const amountMSTC = selectedAgent?.pricePerTask ?? selectedAgent?.price ?? selectedAgent?.agent?.pricePerTask ?? 1.0;
  const agentName = selectedAgent?.name || selectedAgent?.agent?.name || 'Screening Agent Alpha';

  const handleRegisterAgreement = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.createAgreement({
        jobId: jobRequirement?.jobId || 'JOB-BACKEND-01',
        recruiterAgentId: 'AGENT-RECRUITER-01',
        screeningAgentId,
        recruiterWallet: recruiterWallet,
        sellerWallet,
        amountMSTC
      });

      if (res.success && res.agreement) {
        onAgreementCreated(res.agreement);
      } else {
        throw new Error(res.message || 'Failed to create agreement record.');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating agreement record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
          <FileText size={22} color="var(--accent-blue)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>3. Formulate Escrow Agreement</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Review terms, public wallet parameters, and register off-chain escrow agreement.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Job Specification
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            {jobRequirement?.title || 'Senior Backend Engineer'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Min Experience: {jobRequirement?.minExperienceYears ?? 2} year(s)
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Required Skills: {jobRequirement?.requiredSkills?.join(', ') || 'Node.js, Express, MongoDB'}
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Selected Screening Provider
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '0.2rem' }}>
            {agentName}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Wallet size={14} color="var(--accent-cyan)" />
            Seller Address: <code style={{ color: 'var(--accent-cyan)' }}>{AmountUtils.shortenAddress(sellerWallet)}</code>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600, marginTop: '0.2rem' }}>
            Agreed Fee: {amountMSTC} MSTC
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '0.3rem' }}>
          <Shield size={16} /> Trustless Programmable Escrow Settlement
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          Funds will be deposited into the MST <code>AgentEscrow</code> smart contract. Payment will remain locked until off-chain Verification Engine confirms candidate screening evaluation results satisfy all 10 verification rules.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleRegisterAgreement}
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
          <CheckCircle2 size={18} />
          {loading ? 'Creating Agreement...' : 'Confirm Terms & Register Agreement'}
        </button>
      </div>
    </div>
  );
};
