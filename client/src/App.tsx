import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { JobRequirementForm } from './components/JobRequirementForm';
import { AgentDiscovery } from './components/AgentDiscovery';
import { AgreementPanel } from './components/AgreementPanel';
import { EscrowPanel } from './components/EscrowPanel';
import { ResumeBatchView } from './components/ResumeBatchView';
import { ScreeningView } from './components/ScreeningView';
import { VerificationPanel } from './components/VerificationPanel';
import { NetworkModal } from './components/NetworkModal';
import { WalletService, IWalletState } from './services/walletService';
import { Briefcase, Search, FileText, Lock, Users, Cpu, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [walletState, setWalletState] = useState<IWalletState>({
    address: null,
    chainId: null,
    balanceMSTC: '0.0',
    isConnected: false,
    isCorrectNetwork: true,
    error: null
  });

  const [showNetworkModal, setShowNetworkModal] = useState(false);

  // Workflow State Machine
  // 1: Job Spec, 2: Agent Discovery, 3: Agreement, 4: Escrow, 5: Resumes, 6: Screening, 7: Verification
  const [activeStep, setActiveStep] = useState<number>(1);
  const [jobRequirement, setJobRequirement] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [agreement, setAgreement] = useState<any>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [screeningTask, setScreeningTask] = useState<any>(null);

  // Auto-check wallet on mount
  useEffect(() => {
    if (WalletService.isProviderAvailable()) {
      WalletService.listenForAccountChanges((accounts) => {
        if (accounts && accounts.length > 0) {
          handleConnectWallet();
        } else {
          setWalletState({
            address: null,
            chainId: null,
            balanceMSTC: '0.0',
            isConnected: false,
            isCorrectNetwork: true,
            error: null
          });
        }
      });

      WalletService.listenForChainChanges(() => {
        handleConnectWallet();
      });
    }
  }, []);

  const handleConnectWallet = async () => {
    try {
      const state = await WalletService.connectWallet();
      setWalletState(state);
      if (!state.isCorrectNetwork) {
        setShowNetworkModal(true);
      }
    } catch (err: any) {
      console.warn('[App] Wallet connection prompt:', err.message);
      setWalletState((prev) => ({
        ...prev,
        error: err.message || 'Failed to connect BridgeKey wallet.'
      }));
      alert(err.message || 'BridgeKey browser wallet extension not detected or connection rejected.');
    }
  };

  const handleSwitchNetwork = async () => {
    const success = await WalletService.switchToMSTTestnet();
    if (success) {
      setShowNetworkModal(false);
      handleConnectWallet();
    }
  };

  const handleJobCreated = (job: any) => {
    setJobRequirement(job);
    setActiveStep(2);
  };

  const handleSelectAgent = (agent: any) => {
    setSelectedAgent(agent);
    setActiveStep(3);
  };

  const handleAgreementCreated = (newAgreement: any) => {
    setAgreement(newAgreement);
    setActiveStep(4);
  };

  const handleEscrowFunded = (txHash: string, contractAddress: string, numericId: number, recoveredAgreement?: any) => {
    setAgreement((prev: any) => ({
      ...prev,
      // If a full recovered agreement was returned, merge its fields (agreementId, sellerWallet, etc.)
      ...(recoveredAgreement ? recoveredAgreement : {}),
      status: 'FUNDED',
      fundingTxHash: txHash.startsWith('RESUMED-') ? (prev?.fundingTxHash || null) : txHash,
      contractAddress: contractAddress,
      numericId: numericId
    }));
    setActiveStep(5);
  };

  const handleContinueToScreening = (batchResumes: any[]) => {
    setResumes(batchResumes);
    setActiveStep(6);
  };

  const handleScreeningCompleted = (task: any) => {
    setScreeningTask(task);
    setActiveStep(7);
  };

  const handleResetWorkflow = () => {
    setActiveStep(1);
    setJobRequirement(null);
    setSelectedAgent(null);
    setAgreement(null);
    setResumes([]);
    setScreeningTask(null);
  };

  const stepperItems = [
    { step: 1, label: 'Role Spec', icon: Briefcase },
    { step: 2, label: 'Discovery', icon: Search },
    { step: 3, label: 'Agreement', icon: FileText },
    { step: 4, label: 'MST Escrow', icon: Lock },
    { step: 5, label: 'Resumes', icon: Users },
    { step: 6, label: 'Screening', icon: Cpu },
    { step: 7, label: 'Settlement', icon: ShieldCheck }
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      <Header
        walletState={walletState}
        onConnectWallet={handleConnectWallet}
        onSwitchNetwork={() => setShowNetworkModal(true)}
      />

      {/* Workflow Stepper */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '700px', gap: '0.5rem' }}>
          {stepperItems.map((item) => {
            const Icon = item.icon;
            const isDone = activeStep > item.step;
            const isCurrent = activeStep === item.step;

            return (
              <div
                key={item.step}
                onClick={() => {
                  if (item.step < activeStep) setActiveStep(item.step);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isCurrent
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))'
                    : 'transparent',
                  border: `1px solid ${isCurrent ? 'var(--accent-cyan)' : isDone ? 'rgba(16, 185, 129, 0.4)' : 'transparent'}`,
                  cursor: item.step <= activeStep ? 'pointer' : 'default',
                  opacity: item.step <= activeStep ? 1 : 0.4,
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isDone
                      ? 'var(--accent-emerald)'
                      : isCurrent
                      ? 'var(--accent-cyan)'
                      : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDone || isCurrent ? '#000' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}
                >
                  {isDone ? <CheckCircle2 size={14} color="#000" /> : <Icon size={14} />}
                </div>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--accent-cyan)' : isDone ? 'var(--accent-emerald)' : 'var(--text-secondary)'
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main View Router */}
      <main>
        {activeStep === 1 && (
          <JobRequirementForm onJobCreated={handleJobCreated} />
        )}

        {activeStep === 2 && (
          <AgentDiscovery
            jobRequirement={jobRequirement}
            onSelectAgent={handleSelectAgent}
          />
        )}

        {activeStep === 3 && (
          <AgreementPanel
            jobRequirement={jobRequirement}
            selectedAgent={selectedAgent}
            walletState={walletState}
            onAgreementCreated={handleAgreementCreated}
          />
        )}

        {activeStep === 4 && (
          <EscrowPanel
            agreement={agreement}
            selectedAgent={selectedAgent}
            walletState={walletState}
            onConnectWallet={handleConnectWallet}
            onEscrowFunded={handleEscrowFunded}
          />
        )}

        {activeStep === 5 && (
          <ResumeBatchView onContinueToScreening={handleContinueToScreening} />
        )}

        {activeStep === 6 && (
          <ScreeningView
            agreement={agreement}
            jobRequirement={jobRequirement}
            onScreeningCompleted={handleScreeningCompleted}
          />
        )}

        {activeStep === 7 && (
          <VerificationPanel
            screeningTask={screeningTask}
            agreement={agreement}
            selectedAgent={selectedAgent}
            walletState={walletState}
            onWorkflowComplete={handleResetWorkflow}
          />
        )}
      </main>

      {/* Network Switch Modal */}
      {showNetworkModal && (
        <NetworkModal
          currentChainId={walletState.chainId}
          onSwitchNetwork={handleSwitchNetwork}
          onClose={() => setShowNetworkModal(false)}
        />
      )}
    </div>
  );
}
