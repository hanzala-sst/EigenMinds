import { Request, Response } from 'express';
import { EscrowAgreement } from '../models/EscrowAgreement';
import { IEscrowAgreement } from '../types/escrow';
import { BlockchainService } from '../services/blockchain/blockchainService';

// In-memory fallback map
const inMemoryAgreements = new Map<string, IEscrowAgreement>();

export async function createAgreement(req: Request, res: Response): Promise<void> {
  try {
    const { jobId, recruiterAgentId, screeningAgentId, recruiterWallet, sellerWallet, amountMSTC } = req.body;

    if (!jobId || !screeningAgentId || !recruiterWallet || !sellerWallet || !amountMSTC) {
      res.status(400).json({
        success: false,
        message: 'jobId, screeningAgentId, recruiterWallet, sellerWallet, and amountMSTC are required.'
      });
      return;
    }

    const agreementId = `AGREE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const agreementData: IEscrowAgreement = {
      agreementId,
      jobId,
      recruiterAgentId: recruiterAgentId || 'AGENT-RECRUITER-01',
      screeningAgentId,
      recruiterWallet,
      sellerWallet,
      amountMSTC,
      status: 'CREATED',
      onChainEscrowId: null,
      contractAddress: null,
      fundingTxHash: null,
      releaseTxHash: null,
      refundTxHash: null
    };

    try {
      const newAgreement = new EscrowAgreement(agreementData);
      await newAgreement.save();
    } catch {
      inMemoryAgreements.set(agreementId, agreementData);
    }

    res.status(201).json({
      success: true,
      message: 'EscrowAgreement created off-chain. Status: CREATED.',
      agreement: agreementData,
      blockchainStatus: BlockchainService.getStatus()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAgreementById(req: Request, res: Response): Promise<void> {
  try {
    const agreementId = typeof req.params.agreementId === 'string' ? req.params.agreementId : String(req.params.agreementId);
    let agreement: IEscrowAgreement | null = null;

    try {
      agreement = (await EscrowAgreement.findOne({ agreementId }).lean()) as unknown as IEscrowAgreement;
    } catch {
      // Fallback
    }

    if (!agreement && inMemoryAgreements.has(agreementId)) {
      agreement = inMemoryAgreements.get(agreementId)!;
    }

    if (!agreement) {
      res.status(404).json({ success: false, message: `Agreement '${agreementId}' not found.` });
      return;
    }

    const blockchainStatus = BlockchainService.getStatus();

    res.json({
      success: true,
      agreement,
      blockchain: {
        status: agreement.fundingTxHash ? 'FUNDED' : 'NOT_FUNDED',
        contractConfigured: blockchainStatus.configured,
        details: blockchainStatus
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
