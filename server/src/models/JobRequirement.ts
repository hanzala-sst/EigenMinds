import mongoose, { Schema, Document } from 'mongoose';
import { IJobRequirement } from '../types/job';

export interface IJobRequirementDocument extends Omit<IJobRequirement, 'createdAt' | 'updatedAt'>, Document {}

const JobRequirementSchema: Schema = new Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: [{ type: String, required: true }],
    preferredSkills: [{ type: String }],
    minExperienceYears: { type: Number, required: true, default: 0 },
    evaluationCriteria: {
      skillMatchWeight: { type: Number, default: 50 },
      experienceWeight: { type: Number, default: 30 },
      requiredSkillPenalty: { type: Number, default: 25 },
      recommendationThreshold: { type: Number, default: 80 }
    }
  },
  { timestamps: true }
);

export const JobRequirement = mongoose.model<IJobRequirementDocument>('JobRequirement', JobRequirementSchema);
