import { Router } from 'express';
import { getAgents, discoverAgents } from '../controllers/agentController';
import { createJob, getJobById } from '../controllers/jobController';
import { createAgreement, getAgreementById } from '../controllers/escrowController';
import { submitScreening, verifyScreening } from '../controllers/screeningController';
import { syntheticResumesSeed } from '../data/syntheticResumes';
import { BlockchainService } from '../services/blockchain/blockchainService';
import { ethers } from 'ethers';

const router = Router();

// Read-only on-chain agreement status — no wallet, no transaction
const CHAIN_RPC = 'https://testnetrpc.mstblockchain.com';
const CONTRACT_ADDRESS = '0x50D079035D538C69e65aa6e4F928Cd57cc13AbFA';
const GET_AGREEMENT_ABI = [
  'function getAgreement(uint256 agreementId) external view returns (address recruiter, address seller, uint256 amount, uint8 status)'
];
const ON_CHAIN_STATUSES = ['None', 'Funded', 'Released', 'Refunded'];

// Module-level shared singleton provider and contract instance
const sharedProvider = new ethers.JsonRpcProvider(CHAIN_RPC);
const sharedContract = new ethers.Contract(CONTRACT_ADDRESS, GET_AGREEMENT_ABI, sharedProvider);
const RPC_TIMEOUT_MS = 8000;

async function fetchAgreementWithTimeout(numericId: number, timeoutMs = RPC_TIMEOUT_MS) {
  const fetchPromise = sharedContract.getAgreement(BigInt(numericId));
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('RPC_TIMEOUT')), timeoutMs);
  });
  try {
    const res = await Promise.race([fetchPromise, timeoutPromise]);
    clearTimeout(timer!);
    return res as any;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

router.get('/blockchain/agreement/:numericId', async (req, res) => {
  try {
    const numericId = Number(req.params.numericId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      res.status(400).json({ success: false, message: 'Invalid numericId — must be a positive integer.' });
      return;
    }
    const ag = await fetchAgreementWithTimeout(numericId);
    const statusLabel = ON_CHAIN_STATUSES[ag.status] || String(ag.status);
    res.json({
      success: true,
      numericId,
      contractAddress: CONTRACT_ADDRESS,
      recruiter: ag.recruiter,
      seller: ag.seller,
      amountMSTC: parseFloat(ethers.formatEther(ag.amount)),
      onChainStatus: statusLabel,
      isFunded: statusLabel === 'Funded',
      isReleased: statusLabel === 'Released',
      isRefunded: statusLabel === 'Refunded'
    });
  } catch (err: any) {
    if (err.message === 'RPC_TIMEOUT') {
      res.status(504).json({
        success: false,
        stateUnknown: true,
        message: 'On-chain verification timed out after 8s. State is unknown.'
      });
      return;
    }
    res.status(500).json({
      success: false,
      stateUnknown: true,
      message: `RPC error: ${err.message}`
    });
  }
});

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EigenMinds Off-Chain Backend',
    phase: 'Phase 2 - Off-Chain Foundation',
    timestamp: new Date().toISOString(),
    blockchainStatus: BlockchainService.getStatus()
  });
});

// Seed Synthetic Resumes Endpoint
router.get('/resumes/seed', (req, res) => {
  res.json({
    success: true,
    count: syntheticResumesSeed.length,
    resumes: syntheticResumesSeed
  });
});

// Agents API
router.get('/agents', getAgents);
router.post('/agents/discover', discoverAgents);

// Jobs API
router.post('/jobs', createJob);
router.get('/jobs/:jobId', getJobById);

// Agreements API
router.post('/agreements', createAgreement);

/**
 * POST /api/agreements/recover
 * Body: { numericId: number }
 * Read-only RPC check → upsert canonical off-chain agreement record → return agreement.
 * agreementId format: AGR-{numericId}-DEMO
 * No wallet, no signing, no transaction.
 */
router.post('/agreements/recover', async (req, res) => {
  try {
    const { numericId } = req.body;
    const numId = Number(numericId);
    if (!numId || !Number.isInteger(numId) || numId <= 0) {
      res.status(400).json({ success: false, message: 'numericId must be a positive integer.' });
      return;
    }

    // 1. Read on-chain state with shared provider & timeout
    let ag: any;
    try {
      ag = await fetchAgreementWithTimeout(numId);
    } catch (rpcErr: any) {
      if (rpcErr.message === 'RPC_TIMEOUT') {
        res.status(504).json({ success: false, message: 'On-chain recovery verification timed out after 8s.' });
        return;
      }
      res.status(500).json({ success: false, message: `On-chain recovery RPC error: ${rpcErr.message}` });
      return;
    }
    const statusLabel = ON_CHAIN_STATUSES[ag.status] || String(ag.status);

    if (statusLabel === 'None') {
      res.status(404).json({ success: false, message: `No on-chain agreement found for ID ${numId}.` });
      return;
    }
    if (!['Funded', 'Released'].includes(statusLabel)) {
      res.status(400).json({
        success: false,
        message: `Agreement ${numId} is not Funded — on-chain status is: ${statusLabel}. Only FUNDED agreements can be recovered.`
      });
      return;
    }

    // 2. Deterministic off-chain ID
    const { EscrowAgreement } = await import('../models/EscrowAgreement');
    const canonicalId = `AGR-${numId}-DEMO`;
    const amountMSTC = parseFloat(ethers.formatEther(ag.amount));

    // 3. Upsert: find existing or create
    let agreement: any = null;
    try {
      agreement = await EscrowAgreement.findOne({ agreementId: canonicalId }).lean();
    } catch {}

    if (!agreement) {
      // Also check by onChainEscrowId
      try {
        agreement = await EscrowAgreement.findOne({ onChainEscrowId: numId }).lean();
      } catch {}
    }

    if (!agreement) {
      // Create canonical recovery record
      const newData = {
        agreementId: canonicalId,
        jobId: 'JOB-BACKEND-01',
        recruiterAgentId: 'AGENT-RECRUITER-01',
        screeningAgentId: 'AGENT-SCREENER-ALPHA',
        recruiterWallet: ag.recruiter,
        sellerWallet: ag.seller,
        amountMSTC,
        status: statusLabel === 'Funded' ? 'FUNDED' : 'RELEASED',
        onChainEscrowId: numId,
        contractAddress: CONTRACT_ADDRESS,
        fundingTxHash: null,
        releaseTxHash: null,
        refundTxHash: null
      };
      try {
        const doc = new EscrowAgreement(newData);
        agreement = (await doc.save()).toObject();
      } catch {
        // In-memory fallback
        agreement = newData;
      }
    } else {
      // Ensure numericId and status are current
      try {
        await EscrowAgreement.updateOne(
          { agreementId: (agreement as any).agreementId || canonicalId },
          { $set: { onChainEscrowId: numId, status: statusLabel === 'Funded' ? 'FUNDED' : 'RELEASED' } }
        );
        (agreement as any).onChainEscrowId = numId;
        (agreement as any).status = statusLabel === 'Funded' ? 'FUNDED' : 'RELEASED';
      } catch {}
    }

    res.json({
      success: true,
      message: `Agreement ${canonicalId} recovered from on-chain state. Status: ${statusLabel}.`,
      agreement: {
        ...(agreement as any),
        agreementId: canonicalId,
        numericId: numId,
        onChainStatus: statusLabel,
        isFunded: statusLabel === 'Funded'
      },
      onChainStatus: statusLabel,
      isFunded: statusLabel === 'Funded'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Recovery error: ${err.message}` });
  }
});

router.get('/agreements/:agreementId', getAgreementById);

// Screening API
router.post('/screening/submit', submitScreening);
router.post('/screening/verify', verifyScreening);

export default router;
