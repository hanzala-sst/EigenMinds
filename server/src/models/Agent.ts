import mongoose, { Schema, Document } from 'mongoose';
import { IAgent } from '../types/agent';

export interface IAgentDocument extends Omit<IAgent, 'createdAt' | 'updatedAt'>, Document {}

const AgentSchema: Schema = new Schema(
  {
    agentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['RECRUITER', 'SCREENER'] },
    description: { type: String, required: true },
    walletAddress: { type: String, required: true }, // PUBLIC wallet address only
    capabilities: [{ type: String }],
    pricePerTask: { type: Number, required: true, default: 1.0 },
    currency: { type: String, default: 'MSTC' },
    rating: { type: Number, default: 5.0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const Agent = mongoose.model<IAgentDocument>('Agent', AgentSchema);
