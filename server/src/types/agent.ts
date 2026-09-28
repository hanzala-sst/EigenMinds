export type AgentRole = 'RECRUITER' | 'SCREENER';

export interface IAgent {
  agentId: string;
  name: string;
  role: AgentRole;
  description: string;
  walletAddress: string; // PUBLIC address only
  capabilities: string[];
  pricePerTask: number; // in MSTC
  currency: string;     // default "MSTC"
  rating: number;
  status: 'ACTIVE' | 'INACTIVE';
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
