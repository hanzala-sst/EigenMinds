import mongoose, { Schema, Document } from 'mongoose';
import { IEscrowAgreement } from '../types/escrow';

export interface IEscrowAgreementDocument extends Omit<IEscrowAgreement, 'createdAt' | 'updatedAt'>, Document {}

const EscrowAgreementSchema: Schema = new Schema(
  {
    agreementId: { type: String, required: true, unique: true, index: true },
    jobId: { type: String, required: true },
    recruiterAgentId: { type: String, required: true },
    screeningAgentId: { type: String, required: true },
    recruiterWallet: { type: String, required: true },
    sellerWallet: { type: String, required: true },
    amountMSTC: { type: Number, required: true },
    status: {
      type: String,
      enum: ['CREATED', 'FUNDED', 'IN_PROGRESS', 'VERIFIED', 'RELEASED', 'REFUNDED'],
      default: 'CREATED'
    },
    onChainEscrowId: { type: Schema.Types.Mixed, default: null },
    contractAddress: { type: String, default: null },
    fundingTxHash: { type: String, default: null },
    releaseTxHash: { type: String, default: null },
    refundTxHash: { type: String, default: null }
  },
  { timestamps: true }
);

export const EscrowAgreement = mongoose.model<IEscrowAgreementDocument>('EscrowAgreement', EscrowAgreementSchema);
