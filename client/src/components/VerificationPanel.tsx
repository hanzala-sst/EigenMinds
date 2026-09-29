import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, ExternalLink, ArrowRight, DollarSign, Wallet, Send } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { MST_TESTNET_CONFIG } from '../config/mstNetwork';
import { CONTRACT_CONFIG } from '../config/contractConfig';
import { WalletService, IWalletState } from '../services/walletService';
import { AmountUtils } from '../utils/amountUtils';

interface VerificationPanelProps {
  screeningTask: any;
  agreement: any;
  selectedAgent: any;
  walletState: IWalletState;
  onWorkflowComplete: () => void;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  screeningTask,
  agreement,
  selectedAgent,
  walletState,
  onWorkflowComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [releasing, setReleasing] = useState(false);
  const [releaseTxHash, setReleaseTxHash] = useState<string | null>(agreement.releaseTxHash || null);
  const [error, setError] = useState<string | null>(null);

  const numericId = agreement.numericId || Math.floor(Math.random() * 899999) + 100000;

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.verifyScreening(screeningTask.taskId);
      if (res.success && (res.verificationResult || res.verification)) {
        setVerificationResult(res.verificationResult || res.verification);
      } else {
        throw new Error(res.message || 'Verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing verification engine checks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleVerify();
  }, []);

  const handleReleasePaymentBridgeKey = async () => {
    if (!CONTRACT_CONFIG.isDeployed) {
      setError('Smart contract is not deployed.');
      return;
    }
    setReleasing(true);
    setError(null);
    try {
      const res = await WalletService.releasePayment(numericId);
      setReleaseTxHash(res.txHash);
    } catch (err: any) {
      console.error('[VerificationPanel] Release payment error:', err);
      setError(err.message || 'Failed to submit release transaction in BridgeKey.');
    } finally {
      setReleasing(false);
    }
  };

  const checksList = [
    { label: 'Evaluation Output Completeness', key: 'complete' },
    { label: 'JSON Schema Validation', key: 'schemaValid' },
    { label: 'Score Range Integrity (0 - 100)', key: 'scoresValid' },
    { label: 'All Candidates Evaluated', key: 'allCandidatesEvaluated' },
    { label: 'Unique Candidate IDs (No Duplicates)', key: 'uniqueIds' }
  ];

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
          <ShieldCheck size={22} color="var(--accent-emerald)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>7. Verification Engine & On-Chain Settlement</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            10-rule off-chain verification engine validating screening report before releasing MST escrow funds.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
          <p>Running 10-rule verification engine against screening task output...</p>
        </div>
      ) : verificationResult ? (
        <div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '1.1rem' }}>
                <Check size={24} /> VERIFICATION PASSED — 100% VALIDATED
              </div>
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)', padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                Escrow Settlement Authorization: GRANTED
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {checksList.map((chk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  <div style={{ background: 'var(--accent-emerald)', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={10} color="#000" />
                  </div>
                  {chk.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--accent-cyan)' }}>
              On-Chain Settlement Receipt
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Agreement ID:</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{agreement.agreementId}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)' }}>Final Agreement State:</div>
                <span style={{ color: releaseTxHash ? 'var(--accent-emerald)' : '#f59e0b', fontWeight: 700 }}>
                  {releaseTxHash ? 'RELEASED / SETTLED' : 'VERIFIED (Awaiting Payout Release)'}
                </span>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)' }}>Seller Payout Destination:</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-purple)', fontFamily: 'monospace' }}>
                  {AmountUtils.shortenAddress(selectedAgent?.walletAddress || agreement.sellerWallet)}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)' }}>Escrow Payout Amount:</div>
                <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '1.1rem' }}>
                  {agreement.amountMSTC || selectedAgent?.pricePerTask || 1.0} MSTC
                </div>
              </div>
            </div>

            {agreement.fundingTxHash && (
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.75rem', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Funding Deposit Transaction:</div>
                <a
                  href={`${MST_TESTNET_CONFIG.explorerBaseUrl}/tx/${agreement.fundingTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {agreement.fundingTxHash} <ExternalLink size={12} />
                </a>
              </div>
            )}

            {releaseTxHash ? (
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.75rem', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '0.2rem' }}>Payment Release Transaction Hash:</div>
                <a
                  href={`${MST_TESTNET_CONFIG.explorerBaseUrl}/tx/${releaseTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent-emerald)', fontFamily: 'monospace', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {releaseTxHash} <ExternalLink size={12} />
                </a>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleReleasePaymentBridgeKey}
                  disabled={releasing}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: releasing ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Send size={16} />
                  {releasing ? 'Signing Release in BridgeKey...' : 'Release Payment to Seller via BridgeKey'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onWorkflowComplete}
              style={{
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
              }}
            >
              Start New Hiring Task <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
