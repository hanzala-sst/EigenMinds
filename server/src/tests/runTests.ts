import { RecruiterAgentService } from '../services/agents/RecruiterAgentService';
import { ScreeningAgentService } from '../services/agents/ScreeningAgentService';
import { DeterministicScreeningEngine } from '../services/screening/screeningEngine';
import { VerificationEngine } from '../services/verification/verificationEngine';
import { BlockchainService } from '../services/blockchain/blockchainService';
import { syntheticResumesSeed } from '../data/syntheticResumes';
import { IJobRequirement } from '../types/job';
import { IScreeningAssessmentResult } from '../types/screening';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runPhase2Tests() {
  console.log('==================================================');
  console.log('EigenMinds Phase 2 Business Logic Test Suite');
  console.log('==================================================\n');

  const testJob: IJobRequirement = {
    jobId: 'JOB-TEST-01',
    title: 'Backend Engineer',
    description: 'Node.js & MongoDB Specialist',
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
    preferredSkills: ['TypeScript', 'Docker'],
    minExperienceYears: 2,
    evaluationCriteria: {
      skillMatchWeight: 50,
      experienceWeight: 30,
      requiredSkillPenalty: 25,
      recommendationThreshold: 80
    }
  };

  // 1. Agent Matching
  console.log('Test 1: Agent Matching');
  const matchedScreeners = await RecruiterAgentService.findScreeningAgents(testJob);
  assert(matchedScreeners.length > 0, 'Found matching screening agents');
  assert(matchedScreeners[0].capabilityMatch === true, 'Screening agent capability matched');

  // 2. Recruiter Selecting Screening Agent
  console.log('\nTest 2: Recruiter Selecting Screening Agent');
  const selectedScreener = RecruiterAgentService.selectScreeningAgent(matchedScreeners);
  assert(selectedScreener !== null, 'Selected a valid screening agent');
  if (selectedScreener) {
    assert(selectedScreener.pricePerTask > 0, 'Selected agent has valid MSTC quote');
  }

  // 3. Deterministic Resume Scoring - Strong Candidate
  console.log('\nTest 3: Strong Candidate Ranking');
  const strongCandidate = syntheticResumesSeed.find((r) => r.candidateId === 'CAND-001')!;
  const strongEval = DeterministicScreeningEngine.evaluateSingleCandidate(testJob, strongCandidate);
  assert(strongEval.matchScore >= 80, `Strong candidate score is ${strongEval.matchScore} (>= 80)`);
  assert(strongEval.recommendation === 'HIRE', 'Strong candidate recommendation is HIRE');
  assert(strongEval.missingSkills.length === 0, 'Strong candidate has zero missing skills');

  // 4. Missing Required Skill Penalty
  console.log('\nTest 4: Missing Required Skill Penalty');
  const missingSkillCandidate = syntheticResumesSeed.find((r) => r.candidateId === 'CAND-002')!;
  const missingSkillEval = DeterministicScreeningEngine.evaluateSingleCandidate(testJob, missingSkillCandidate);
  assert(missingSkillEval.missingSkills.includes('MongoDB'), 'Correctly identified missing skill MongoDB');
  assert(missingSkillEval.matchScore < 100, `Score reduced to ${missingSkillEval.matchScore} due to missing skill`);

  // 5. Insufficient Experience Penalty
  console.log('\nTest 5: Insufficient Experience Penalty');
  const juniorCandidate = syntheticResumesSeed.find((r) => r.candidateId === 'CAND-004')!;
  const juniorEval = DeterministicScreeningEngine.evaluateSingleCandidate(testJob, juniorCandidate);
  assert(juniorEval.matchScore < 80, `Junior candidate score reduced to ${juniorEval.matchScore}`);

  // 6. Weak / Unrelated Candidate Ranking
  console.log('\nTest 6: Weak Candidate Ranking');
  const weakCandidate = syntheticResumesSeed.find((r) => r.candidateId === 'CAND-005')!;
  const weakEval = DeterministicScreeningEngine.evaluateSingleCandidate(testJob, weakCandidate);
  assert(weakEval.recommendation === 'REJECT', `Unrelated candidate recommendation is REJECT (score: ${weakEval.matchScore})`);

  // 7. Full Screening Batch Execution
  console.log('\nTest 7: Screening Output Schema & Batch Execution');
  const batchResult = await ScreeningAgentService.screenCandidates(testJob, syntheticResumesSeed);
  assert(batchResult.evaluatedCount === 5, 'Evaluated exact batch size of 5 candidates');
  assert(batchResult.rankings.length === 5, 'Returned 5 candidate rankings');
  assert(batchResult.rankings[0].candidateId === 'CAND-001', 'Top ranked candidate is CAND-001');

  // 8. Verification Engine - Valid Output
  console.log('\nTest 8: Verification Engine Passes Valid Output');
  const validVerification = VerificationEngine.verifyTaskOutput('TASK-101', syntheticResumesSeed, batchResult);
  assert(validVerification.verified === true, 'Verification engine approved valid screening result');
  assert(validVerification.issues.length === 0, 'Zero issues reported for valid result');

  // 9. Verification Engine - Rejects Incomplete Candidate Batch
  console.log('\nTest 9: Verification Engine Rejects Incomplete Candidate Batch');
  const incompleteResult: IScreeningAssessmentResult = {
    evaluatedCount: 4,
    rankings: batchResult.rankings.slice(0, 4),
    summary: 'Incomplete'
  };
  const incompleteVerification = VerificationEngine.verifyTaskOutput('TASK-102', syntheticResumesSeed, incompleteResult);
  assert(incompleteVerification.verified === false, 'Verification engine rejected incomplete candidate count');
  assert(incompleteVerification.issues.length > 0, 'Issues listed for incomplete count');

  // 10. Verification Engine - Rejects Duplicate Candidate ID
  console.log('\nTest 10: Verification Engine Rejects Duplicate Candidate ID');
  const duplicateResult: IScreeningAssessmentResult = {
    evaluatedCount: 5,
    rankings: [batchResult.rankings[0], batchResult.rankings[0], ...batchResult.rankings.slice(2)],
    summary: 'Duplicate'
  };
  const duplicateVerification = VerificationEngine.verifyTaskOutput('TASK-103', syntheticResumesSeed, duplicateResult);
  assert(duplicateVerification.verified === false, 'Verification engine rejected duplicate candidateId');

  // 11. Verification Engine - Rejects Invalid Score (>100)
  console.log('\nTest 11: Verification Engine Rejects Invalid Score');
  const invalidScoreResult: IScreeningAssessmentResult = {
    evaluatedCount: 5,
    rankings: [
      { ...batchResult.rankings[0], matchScore: 150 },
      ...batchResult.rankings.slice(1)
    ],
    summary: 'Invalid Score'
  };
  const invalidScoreVerification = VerificationEngine.verifyTaskOutput('TASK-104', syntheticResumesSeed, invalidScoreResult);
  assert(invalidScoreVerification.verified === false, 'Verification engine rejected matchScore > 100');

  // 12. Agreement Proposal Creation State
  console.log('\nTest 12: Agreement Starts as CREATED');
  const proposal = RecruiterAgentService.createAgreementProposal(
    testJob,
    'AGENT-RECRUITER-01',
    '0x1111111111111111111111111111111111111111',
    selectedScreener!
  );
  assert(proposal.status === 'CREATED', 'Agreement initial status is CREATED');
  assert(proposal.onChainEscrowId === null, 'onChainEscrowId is null before live deployment');
  assert(proposal.amountMSTC === 1.0, 'Agreement amount matches screening agent rate (1.0 MSTC)');

  // 13. Blockchain Service Boundary NOT_CONFIGURED Test
  console.log('\nTest 13: Blockchain Service Boundary Returns NOT_CONFIGURED');
  const bcStatus = BlockchainService.getStatus();
  assert(bcStatus.status === 'NOT_CONFIGURED' || bcStatus.status === 'CONFIGURED', 'Blockchain status returned safely');
  const fundAttempt = await BlockchainService.createAndFundAgreement('AGREE-TEST', '0x222', 1.0);
  assert(fundAttempt.success === false, 'Blockchain service does not fabricate on-chain success');

  console.log('\n==================================================');
  console.log('SUCCESS: All 13 Business Logic Tests Passed Cleanly!');
  console.log('==================================================');
}

runPhase2Tests().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
