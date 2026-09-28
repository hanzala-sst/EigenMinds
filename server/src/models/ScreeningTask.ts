import mongoose, { Schema, Document } from 'mongoose';
import { IScreeningTask } from '../types/screening';

export interface IScreeningTaskDocument extends Omit<IScreeningTask, 'createdAt' | 'completedAt' | 'updatedAt'>, Document {}

const ScreeningTaskSchema: Schema = new Schema(
  {
    taskId: { type: String, required: true, unique: true, index: true },
    agreementId: { type: String, required: true },
    jobId: { type: String, required: true },
    screeningAgentId: { type: String, required: true },
    resumesCount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'VERIFIED', 'FAILED'],
      default: 'PENDING'
    },
    inputSnapshot: { type: Schema.Types.Mixed, required: true },
    assessmentResult: { type: Schema.Types.Mixed, default: null },
    verificationResult: { type: Schema.Types.Mixed, default: null },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const ScreeningTask = mongoose.model<IScreeningTaskDocument>('ScreeningTask', ScreeningTaskSchema);
