import React from 'react';
import { Wallet, ShieldCheck, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { IWalletState } from '../services/walletService';
import { AmountUtils } from '../utils/amountUtils';
import { MST_TESTNET_CONFIG } from '../config/mstNetwork';

interface HeaderProps {
  walletState: IWalletState;
  onConnectWallet: () => void;
  onSwitchNetwork: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  walletState,
  onConnectWallet,
  onSwitchNetwork
}) => {
  return (
    <header className="glass-panel" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>
          EM
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', lineHeight: '1.2' }} className="gradient-text">EigenMinds</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Agent-to-Agent Commerce & MST Blockchain Escrow</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Network Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: '20px', background: walletState.isCorrectNetwork ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${walletState.isCorrectNetwork ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, fontSize: '0.85rem' }}>
          {walletState.isCorrectNetwork ? (
            <>
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 500 }}>
                MST Testnet (Chain ID: {MST_TESTNET_CONFIG.chainIdDecimal})
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={16} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: 500 }}>
                Wrong Network
              </span>
              <button
                onClick={onSwitchNetwork}
                style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: '12px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <RefreshCw size={12} /> Switch
              </button>
            </>
          )}
        </div>

        {/* Wallet Connection Status */}
        {walletState.isConnected && walletState.address ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <Wallet size={18} color="var(--accent-cyan)" />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {AmountUtils.shortenAddress(walletState.address)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>
                {walletState.balanceMSTC} MSTC
              </span>
            </div>
            <a
              href={`${MST_TESTNET_CONFIG.faucetUrl}`}
              target="_blank"
              rel="noreferrer"
              title="Claim MSTC Faucet"
              style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
            >
              <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          <button
            onClick={onConnectWallet}
            style={{
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              padding: '0.6rem 1.2rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
            }}
          >
            <Wallet size={18} />
            Connect BridgeKey
          </button>
        )}
      </div>
    </header>
  );
};
