import React from 'react';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { MST_TESTNET_CONFIG } from '../config/mstNetwork';

interface NetworkModalProps {
  currentChainId: number | null;
  onSwitchNetwork: () => void;
  onClose: () => void;
}

export const NetworkModal: React.FC<NetworkModalProps> = ({
  currentChainId,
  onSwitchNetwork,
  onClose
}) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <AlertTriangle size={24} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: '1.25rem', color: '#ef4444' }}>Wrong Network Detected</h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
          Your BridgeKey wallet is currently connected to <strong>Chain ID {currentChainId ?? 'Unknown'}</strong>.
          EigenMinds requires <strong>{MST_TESTNET_CONFIG.networkName} (Chain ID: {MST_TESTNET_CONFIG.chainIdDecimal})</strong>.
        </p>

        <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <div style={{ marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Required Network Settings:</div>
          <div><strong>Network Name:</strong> {MST_TESTNET_CONFIG.networkName}</div>
          <div><strong>RPC URL:</strong> <code>{MST_TESTNET_CONFIG.rpcUrl}</code></div>
          <div><strong>Chain ID:</strong> {MST_TESTNET_CONFIG.chainIdDecimal} (Hex: {MST_TESTNET_CONFIG.chainIdHex})</div>
          <div><strong>Currency Symbol:</strong> {MST_TESTNET_CONFIG.currencySymbol}</div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
          >
            Dismiss
          </button>
          <button
            onClick={onSwitchNetwork}
            style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', border: 'none', color: '#fff', fontWeight: 600, padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} />
            Switch to MST Testnet
          </button>
        </div>
      </div>
    </div>
  );
};
