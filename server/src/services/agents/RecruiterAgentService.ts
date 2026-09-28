import { IAgent } from '../../types/agent';
import { IJobRequirement } from '../../types/job';
import { IEscrowAgreement } from '../../types/escrow';
import { Agent } from '../../models/Agent';
import { seedAgents } from '../../data/seedAgents';

export class RecruiterAgentService {
  /**
   * Queries available Screening Agents matching job requirement capabilities.
   */
  public static async findScreeningAgents(job: IJobRequirement): Promise<
    { agent: IAgent; capabilityMatch: boolean; price: number; walletAddress: string; reason: string }[]
  > {
    // Attempt DB query, fallback to seeded agents if DB empty
    let screeners: IAgent[] = [];
    try {
      const dbScreeners = await Agent.find({ role: 'SCREENER', status: 'ACTIVE' }).lean();
      if (dbScreeners.length > 0) {
        screeners = dbScreeners as unknown as IAgent[];
      }
    } catch {
      // Fallback
    }

    if (screeners.length === 0) {
      screeners = seedAgents.filter((a) => a.role === 'SCREENER' && a.status === 'ACTIVE');
    }

    return screeners.map((agent) => {
      const capabilityMatch = agent.capabilities.includes('resume_screening');
      const reason = capabilityMatch
        ? `Specialized in ${agent.capabilities.join(', ')} with ${agent.rating}★ rating.`
        : `General screening capabilities available.`;

      return {
        agent,
        capabilityMatch,
        price: agent.pricePerTask,
        walletAddress: agent.walletAddress,
        reason
      };
    });
  }

  /**
   * Selects best Screening Agent based on capabilities, price, and rating.
   */
  public static selectScreeningAgent(
    options: { agent: IAgent; capabilityMatch: boolean; price: number; walletAddress: string; reason: string }[]
  ): IAgent | null {
    if (options.length === 0) return null;

    // Filter matching screeners
    const matching = options.filter((o) => o.capabilityMatch);
    const pool = matching.length > 0 ? matching : options;

    // Sort by rating descending, then price ascending
    pool.sort((a, b) => b.agent.rating - a.agent.rating || a.price - b.price);

    return pool[0].agent;
  }

  /**
   * Generates an off-chain EscrowAgreement proposal ready for funding.
   */
  public static createAgreementProposal(
    job: IJobRequirement,
    recruiterAgentId: string,
    recruiterWallet: string,
    screeningAgent: IAgent
  ): IEscrowAgreement {
    const agreementId = `AGREE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return {
      agreementId,
      jobId: job.jobId,
      recruiterAgentId,
      screeningAgentId: screeningAgent.agentId,
      recruiterWallet,
      sellerWallet: screeningAgent.walletAddress,
      amountMSTC: screeningAgent.pricePerTask,
      status: 'CREATED',
      onChainEscrowId: null,
      contractAddress: null,
      fundingTxHash: null,
      releaseTxHash: null,
      refundTxHash: null
    };
  }
}
