import { Router } from 'express';
import { getAgents, discoverAgents } from '../controllers/agentController';
import { createJob, getJobById } from '../controllers/jobController';
import { createAgreement, getAgreementById } from '../controllers/escrowController';
import { submitScreening, verifyScreening } from '../controllers/screeningController';
import { syntheticResumesSeed } from '../data/syntheticResumes';
import { BlockchainService } from '../services/blockchain/blockchainService';

const router = Router();

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
router.get('/agreements/:agreementId', getAgreementById);

// Screening API
router.post('/screening/submit', submitScreening);
router.post('/screening/verify', verifyScreening);

export default router;
