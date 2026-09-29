import React, { useState, useEffect } from 'react';
import { Lock, Wallet, ExternalLink, ShieldCheck, AlertCircle, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { WalletService, IWalletState } from '../services/walletService';
import { ApiService } from '../services/apiService';
import { CONTRACT_CONFIG } from '../config/contractConfig';
import { MST_TESTNET_CONFIG } from '../config/mstNetwork';
import { AmountUtils } from '../utils/amountUtils';


interface EscrowPanelProps {
  agreement: any;
  selectedAgent: any;
  walletState: IWalletState;
  onConnectWallet: () => void;
  onEscrowFunded: (fundingTxHash: string, contractAddress: string, numericId: number, recoveredAgreement?: any) => void;
}

export const EscrowPanel: React.FC<EscrowPanelProps> = ({
  agreement,
  selectedAgent,
  walletState,
  onConnectWallet,
  onEscrowFunded
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [txHash, setTxHash] = useState<string | null>(agreement.fundingTxHash || null);
  const [error, setError] = useState<string | null>(null);

  // On-chain status check state
  const [onChainChecking, setOnChainChecking] = useState(false);
  const [onChainFunded, setOnChainFunded] = useState(false);
  const [onChainData, setOnChainData] = useState<any>(null);

  // Recovery panel state
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryId, setRecoveryId] = useState('613731');
  const [recoveryChecking, setRecoveryChecking] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Stable numeric ID — fixed once per panel mount, does NOT re-roll on re-render
  const [stableNumericId] = useState<number>(
    () => agreement.numericId || Math.floor(Math.random() * 899999) + 100000
  );

  const sellerWallet = selectedAgent?.walletAddress || agreement.sellerWallet || '0x8fc62396f95b2212CF10E78EC695B8F55872dA16';
  const amountMSTC = selectedAgent?.pricePerTask ?? agreement.amountMSTC ?? 1.0;

  // On mount: if we already have a numericId, auto-check on-chain status
  useEffect(() => {
    if (agreement.numericId) {
      checkOnChainStatus(agreement.numericId);
    }
  }, []);

  const checkOnChainStatus = async (numericId: number) => {
    setOnChainChecking(true);
    try {
      const res = await ApiService.getOnChainAgreementStatus(numericId);
      if (res.success) {
        setOnChainData(res);
        if (res.isFunded) {
          setOnChainFunded(true);
        }
      }
    } catch (e) {
      // Silent — don't block the UI if RPC fails
      console.warn('[EscrowPanel] On-chain status check failed:', e);
    } finally {
      setOnChainChecking(false);
    }
  };

  const handleFundEscrow = async () => {
    if (!walletState.isConnected) {
      onConnectWallet();
      return;
    }

    if (!walletState.isCorrectNetwork) {
      setError(`Connected to wrong network. Please switch BridgeKey to MST Testnet (Chain ID ${MST_TESTNET_CONFIG.chainIdDecimal}).`);
      return;
    }

    setLoading(true);
    setLoadingStage('preflight');
    setError(null);
    const t0 = performance.now();
    console.log(`[FUND] Button clicked — agreementNumericId: ${stableNumericId}`);

    try {
      if (!CONTRACT_CONFIG.isDeployed || !CONTRACT_CONFIG.address) {
        throw new Error('MST AgentEscrow contract is not deployed on MST Testnet.');
      }

      // Safety: check on-chain status before funding to prevent duplicate transactions.
      // CRITICAL: if the check times out or fails, BLOCK funding — do not silently skip.
      const t1 = performance.now();
      console.log('[FUND] on-chain safety preflight START');
      let preflightBlocked = false;
      try {
        const preflightPromise = ApiService.getOnChainAgreementStatus(stableNumericId);
        const preflightTimeout = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('preflight_timeout')), 5000)
        );
        const preCheck = await Promise.race([preflightPromise, preflightTimeout]);
        const t2 = performance.now();
        console.log(`[FUND] on-chain safety preflight END — ${(t2 - t1).toFixed(0)}ms — status: ${preCheck?.onChainStatus}`);
        if (preCheck?.success && (preCheck?.isFunded || preCheck?.isReleased)) {
          throw new Error(
            preCheck.isReleased
              ? `Agreement ${stableNumericId} has already been RELEASED on-chain. This escrow is settled.`
              : `Agreement ${stableNumericId} is already FUNDED on-chain. Use "Resume Existing Agreement" to continue without funding again.`
          );
        }
      } catch (preErr: any) {
        const t2 = performance.now();
        if (preErr.message === 'preflight_timeout') {
          console.error(`[FUND] on-chain safety preflight TIMED OUT after ${(t2 - t1).toFixed(0)}ms — BLOCKING FUNDING`);
          preflightBlocked = true;
          throw new Error(
            'Unable to verify escrow status. Funding is blocked until the blockchain state can be confirmed. Please retry in a moment.'
          );
        } else if (preErr.message?.includes('already FUNDED') || preErr.message?.includes('already been RELEASED')) {
          throw preErr;
        } else {
          console.error(`[FUND] on-chain safety preflight FAILED after ${(t2 - t1).toFixed(0)}ms — ${preErr.message} — BLOCKING FUNDING`);
          preflightBlocked = true;
          throw new Error(
            `Unable to verify escrow status (${preErr.message}). Funding is blocked until the blockchain state can be confirmed. Please retry.`
          );
        }
      }

      setLoadingStage('bridgekey');
      console.log(`[FUND] eth_sendTransaction INVOKING via WalletService.fundEscrowAgreement — ${(performance.now() - t0).toFixed(0)}ms since button click`);
      const t3 = performance.now();

      const res = await WalletService.fundEscrowAgreement(stableNumericId, sellerWallet, amountMSTC);

      const t4 = performance.now();
      console.log(`[FUND] eth_sendTransaction RETURNED — txHash: ${res.txHash} — ${(t4 - t3).toFixed(0)}ms`);
      console.log(`[FUND] Total time from button click to txHash: ${(t4 - t0).toFixed(0)}ms`);

      setTxHash(res.txHash);
      setOnChainFunded(true);
      onEscrowFunded(res.txHash, res.contractAddress, stableNumericId);
    } catch (err: any) {
      console.error('[FUND] Error:', err.message);
      const isRejection = err.code === 4001 || err.message?.includes('rejected') || err.message?.includes('user denied');
      const errorMsg = isRejection
        ? 'Transaction was cancelled or rejected inside BridgeKey extension.'
        : err.message || 'Escrow funding transaction failed or timed out.';
      setError(errorMsg);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  // Recovery handler: verify on-chain + upsert canonical off-chain record → resume
  const handleResumeExisting = async () => {
    const numId = parseInt(recoveryId.trim(), 10);
    if (!numId || isNaN(numId) || numId <= 0) {
      setRecoveryError('Please enter a valid on-chain numeric agreement ID.');
      return;
    }
    setRecoveryChecking(true);
    setRecoveryError(null);
    try {
      // POST /api/agreements/recover — verifies on-chain + upserts AGR-{numId}-DEMO record
      const res = await ApiService.recoverAgreement(numId);
      if (!res.success) {
        setRecoveryError(res.message || `Could not recover agreement ${numId}.`);
        return;
      }
      if (!res.isFunded) {
        setRecoveryError(
          `Agreement ${numId} is not Funded on-chain — status: ${res.onChainStatus}. Only FUNDED agreements can be resumed.`
        );
        return;
      }
      const recovered = res.agreement;
      setOnChainData(res.agreement);
      setOnChainFunded(true);
      // Use a sentinel tx hash that won't be shown as a real explorer link
      const sentinelTx = `RESUMED-${numId}`;
      setTxHash(sentinelTx);
      console.log('[EscrowPanel] Recovered agreement:', recovered.agreementId, 'numericId:', numId);
      // Pass the full recovered agreement back so App.tsx can merge agreementId correctly
      onEscrowFunded(sentinelTx, CONTRACT_CONFIG.address, numId, recovered);
    } catch (err: any) {
      setRecoveryError(err.message || 'Failed to recover agreement from on-chain state.');
    } finally {
      setRecoveryChecking(false);
    }
  };

  const isFunded = txHash || onChainFunded || agreement.status === 'FUNDED';

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
          <Lock size={22} color="var(--accent-emerald)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>4. Fund MST Escrow Smart Contract</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Deposit agreed {amountMSTC} MSTC into AgentEscrow contract on MST Testnet.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Agreement Info Grid */}
      <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Agreement ID:</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{agreement.agreementId}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Status:</div>
            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', background: isFunded ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: isFunded ? 'var(--accent-emerald)' : '#f59e0b', fontWeight: 600, fontSize: '0.75rem' }}>
              {isFunded ? 'FUNDED' : 'CREATED (Awaiting Deposit)'}
            </span>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Recruiter Wallet (Buyer):</div>
            <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
              {walletState.isConnected && walletState.address ? (
                AmountUtils.shortenAddress(walletState.address)
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>Not Connected</span>
              )}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Screening Agent Wallet (Seller):</div>
            <div style={{ fontWeight: 600, color: 'var(--accent-purple)', fontFamily: 'monospace' }}>
              {AmountUtils.shortenAddress(sellerWallet)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Escrow Lock Amount:</div>
            <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '1.05rem' }}>
              {amountMSTC} MSTC
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>AgentEscrow Contract:</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {CONTRACT_CONFIG.address ? AmountUtils.shortenAddress(CONTRACT_CONFIG.address) : 'Pending Deployment'}
            </div>
          </div>
        </div>
      </div>

      {/* Funded Success State */}
      {isFunded && txHash && !txHash.startsWith('RESUMED-') && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '0.5rem' }}>
            <ShieldCheck size={20} /> Escrow Deposit Confirmed on MST Testnet!
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Transaction Hash: <code style={{ color: '#fff', wordBreak: 'break-all' }}>{txHash}</code>
          </div>
          <a href={`${MST_TESTNET_CONFIG.explorerBaseUrl}/tx/${txHash}`} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Verify on MST Explorer (mstscan.com) <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* Resumed Existing Agreement State */}
      {isFunded && txHash?.startsWith('RESUMED-') && onChainData && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '0.75rem' }}>
            <CheckCircle2 size={20} /> Existing Funded Escrow Verified on MST Testnet
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>On-Chain Agreement ID: </span><code style={{ color: 'var(--accent-cyan)' }}>{onChainData.numericId}</code></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Amount: </span><span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{onChainData.amountMSTC} MSTC</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Recruiter: </span><code style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem' }}>{AmountUtils.shortenAddress(onChainData.recruiter)}</code></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Seller: </span><code style={{ color: 'var(--accent-purple)', fontSize: '0.75rem' }}>{AmountUtils.shortenAddress(onChainData.seller)}</code></div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <a href={`${MST_TESTNET_CONFIG.explorerBaseUrl}/address/${CONTRACT_CONFIG.address}`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              View Contract on MST Explorer <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {/* Action Section — only shown when NOT yet funded */}
      {!isFunded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Recovery Panel */}
          <div style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem' }}>
            <button
              onClick={() => setShowRecovery(!showRecovery)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
            >
              <RotateCcw size={16} />
              Resume Existing On-Chain Funded Agreement
            </button>

            {showRecovery && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                  If you have already funded an escrow on MST Testnet, enter its numeric on-chain agreement ID below. The system will verify its FUNDED status read-only and continue to the next step without sending another transaction.
                </p>
                {recoveryError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                    {recoveryError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    id="recovery-numeric-id"
                    type="number"
                    value={recoveryId}
                    onChange={e => setRecoveryId(e.target.value)}
                    placeholder="e.g. 613731"
                    style={{
                      background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#fff',
                      padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace',
                      fontSize: '0.9rem', width: '160px'
                    }}
                  />
                  <button
                    id="btn-resume-agreement"
                    onClick={handleResumeExisting}
                    disabled={recoveryChecking}
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                      border: 'none', color: '#fff', fontWeight: 600, padding: '0.55rem 1.25rem',
                      borderRadius: 'var(--radius-sm)', cursor: recoveryChecking ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem'
                    }}
                  >
                    <CheckCircle2 size={15} />
                    {recoveryChecking ? 'Verifying on-chain...' : 'Verify & Resume'}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Demo funded agreement: <code style={{ color: 'var(--accent-cyan)' }}>613731</code>
                </p>
              </div>
            )}
          </div>

          {/* Standard Fund Button */}
          {!CONTRACT_CONFIG.isDeployed && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>Smart Contract deployment pending. Set <code>VITE_MST_ESCROW_CONTRACT_ADDRESS</code> in <code>client/.env</code>.</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            {!walletState.isConnected && (
              <button onClick={onConnectWallet}
                style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', border: 'none', color: '#fff', fontWeight: 600, padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={18} /> Connect BridgeKey First
              </button>
            )}

            <button
              id="btn-fund-escrow"
              onClick={handleFundEscrow}
              disabled={loading || !CONTRACT_CONFIG.isDeployed}
              style={{
                background: CONTRACT_CONFIG.isDeployed ? 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: CONTRACT_CONFIG.isDeployed ? '#fff' : 'var(--text-muted)',
                fontWeight: 600, padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)',
                cursor: loading || !CONTRACT_CONFIG.isDeployed ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: CONTRACT_CONFIG.isDeployed ? '0 4px 14px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              <Lock size={18} />
              {!loading
                ? `Fund ${amountMSTC} MSTC Escrow`
                : loadingStage === 'preflight'
                ? 'Checking escrow status...'
                : 'Requesting BridgeKey Signature...'}
            </button>
          </div>
        </div>
      )}

      {/* Continue button shown when funded via recovery and app hasn't auto-advanced */}
      {isFunded && txHash?.startsWith('RESUMED-') && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            id="btn-continue-to-screening"
            onClick={() => onEscrowFunded(txHash, CONTRACT_CONFIG.address, parseInt(recoveryId) || 613731)}
            style={{
              background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
              border: 'none', color: '#fff', fontWeight: 600, padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            Continue to Resume Screening <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
