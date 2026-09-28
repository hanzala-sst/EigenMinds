import React, { useState } from 'react';
import { Lock, Wallet, ExternalLink, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { WalletService, IWalletState } from '../services/walletService';
import { CONTRACT_CONFIG } from '../config/contractConfig';
import { MST_TESTNET_CONFIG } from '../config/mstNetwork';
import { AmountUtils } from '../utils/amountUtils';

interface EscrowPanelProps {
  agreement: any;
  selectedAgent: any;
  walletState: IWalletState;
  onConnectWallet: () => void;
  onEscrowFunded: (fundingTxHash: string, contractAddress: string) => void;
}

export const EscrowPanel: React.FC<EscrowPanelProps> = ({
  agreement,
  selectedAgent,
  walletState,
  onConnectWallet,
  onEscrowFunded
}) => {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(agreement.fundingTxHash || null);
  const [error, setError] = useState<string | null>(null);

  const agreementNumericId = agreement.numericId || Math.floor(Math.random() * 899999) + 100000;
  const sellerWallet = selectedAgent?.walletAddress || agreement.sellerWallet || '0x8fc62396f95b2212CF10E78EC695B8F55872dA16';
  const amountMSTC = selectedAgent?.pricePerTask ?? agreement.amountMSTC ?? 1.0;

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
    setError(null);

    try {
      if (!CONTRACT_CONFIG.isDeployed || !CONTRACT_CONFIG.address) {
        throw new Error(
          'MST AgentEscrow contract is currently un-deployed on MST Testnet. Contract deployment is required before submitting live on-chain transaction.'
        );
      }

      const res = await WalletService.fundEscrowAgreement(
        agreementNumericId,
        sellerWallet,
        amountMSTC
      );

      console.log('[EscrowPanel] Transaction successful, hash:', res.txHash);
      setTxHash(res.txHash);
      onEscrowFunded(res.txHash, res.contractAddress);
    } catch (err: any) {
      console.error('[EscrowPanel] Transaction error:', err);
      const isRejection = err.code === 4001 || err.message?.includes('rejected') || err.message?.includes('user denied');
      const errorMsg = isRejection
        ? 'Transaction was cancelled or rejected inside BridgeKey extension.'
        : err.message || 'Escrow funding transaction failed or timed out.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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

      <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Agreement ID:</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{agreement.agreementId}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Status:</div>
            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', background: txHash || agreement.status === 'FUNDED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: txHash || agreement.status === 'FUNDED' ? 'var(--accent-emerald)' : '#f59e0b', fontWeight: 600, fontSize: '0.75rem' }}>
              {txHash || agreement.status === 'FUNDED' ? 'FUNDED' : 'CREATED (Awaiting Deposit)'}
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
            <div style={{ color: 'var(--text-muted)' }}>AgentEscrow Contract Address:</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {CONTRACT_CONFIG.address ? AmountUtils.shortenAddress(CONTRACT_CONFIG.address) : 'Pending Deployment'}
            </div>
          </div>
        </div>
      </div>

      {txHash ? (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '0.5rem' }}>
            <ShieldCheck size={20} /> Escrow Deposit Confirmed on MST Testnet!
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Transaction Hash: <code style={{ color: '#fff', wordBreak: 'break-all' }}>{txHash}</code>
          </div>
          <a
            href={`${MST_TESTNET_CONFIG.explorerBaseUrl}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
          >
            Verify on MST Explorer (mstscan.com) <ExternalLink size={14} />
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
          {!CONTRACT_CONFIG.isDeployed && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>Smart Contract deployment pending environment setup. (To enable live BridgeKey transaction signing, deploy contract to MST Testnet and set <code>VITE_MST_ESCROW_CONTRACT_ADDRESS</code> in client `.env`).</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            {!walletState.isConnected && (
              <button
                onClick={onConnectWallet}
                style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', border: 'none', color: '#fff', fontWeight: 600, padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Wallet size={18} /> Connect BridgeKey First
              </button>
            )}

            <button
              onClick={handleFundEscrow}
              disabled={loading || !CONTRACT_CONFIG.isDeployed}
              style={{
                background: CONTRACT_CONFIG.isDeployed ? 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: CONTRACT_CONFIG.isDeployed ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-sm)',
                cursor: loading || !CONTRACT_CONFIG.isDeployed ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: CONTRACT_CONFIG.isDeployed ? '0 4px 14px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              <Lock size={18} />
              {loading ? 'Signing Transaction in BridgeKey...' : `Fund ${amountMSTC} MSTC Escrow`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
