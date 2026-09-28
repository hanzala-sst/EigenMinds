import { IAgent } from '../types/agent';

export const seedAgents: IAgent[] = [
  {
    agentId: 'AGENT-RECRUITER-01',
    name: 'TalentScout Recruiter Agent',
    role: 'RECRUITER',
    description: 'Autonomous hiring manager agent responsible for job specification matching, screening agent discovery, and MST escrow settlement.',
    walletAddress: '0x1111111111111111111111111111111111111111', // Synthetic public address
    capabilities: ['job_posting', 'agent_discovery', 'contract_negotiation', 'escrow_funding'],
    pricePerTask: 0,
    currency: 'MSTC',
    rating: 5.0,
    status: 'ACTIVE'
  },
  {
    agentId: 'AGENT-SCREENER-ALPHA',
    name: 'Screening Agent Alpha (MERN Specialist)',
    role: 'SCREENER',
    description: 'Specialized screening agent focused on Node.js, Express, MongoDB, and MERN stack candidate evaluations with high-precision scoring.',
    walletAddress: '0x8fc62396f95b2212CF10E78EC695B8F55872dA16', // Team-controlled public seller wallet address for live demo settlement
    capabilities: ['resume_screening', 'skill_matching', 'experience_filtering', 'candidate_ranking'],
    pricePerTask: 1.0, // 1.0 MSTC
    currency: 'MSTC',
    rating: 4.9,
    status: 'ACTIVE'
  },
  {
    agentId: 'AGENT-SCREENER-BETA',
    name: 'Screening Agent Beta (General Engineering)',
    role: 'SCREENER',
    description: 'General engineering screening agent for full-stack and cloud backend roles across Python, Go, and Node.js ecosystems.',
    walletAddress: '0x3333333333333333333333333333333333333333', // Synthetic public seller address
    capabilities: ['resume_screening', 'broad_skill_matching', 'code_portfolio_analysis'],
    pricePerTask: 1.5, // 1.5 MSTC
    currency: 'MSTC',
    rating: 4.7,
    status: 'ACTIVE'
  }
];
