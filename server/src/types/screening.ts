import { SyntheticResume } from './resume';

export type CandidateRecommendation = 'HIRE' | 'CONSIDER' | 'REJECT';

export interface ICandidateEvaluation {
  candidateId: string;
  candidateName: string;
  matchScore: number;
  recommendation: CandidateRecommendation;
  keyStrengths: string[];
  missingSkills: string[];
  experienceAssessment: string;
}

export interface IScreeningAssessmentResult {
  evaluatedCount: number;
  rankings: ICandidateEvaluation[];
  summary: string;
}

export interface IVerificationCheckResult {
  verified: boolean;
  checks: {
    complete: boolean;
    schemaValid: boolean;
    scoresValid: boolean;
    allCandidatesEvaluated: boolean;
  };
  issues: string[];
}

export type ScreeningTaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'VERIFIED' | 'FAILED';

export interface IScreeningTask {
  taskId: string;
  agreementId: string;
  jobId: string;
  screeningAgentId: string;
  resumesCount: number;
  status: ScreeningTaskStatus;
  inputSnapshot: {
    jobTitle: string;
    requiredSkills: string[];
    resumes: SyntheticResume[];
  };
  assessmentResult?: IScreeningAssessmentResult;
  verificationResult?: IVerificationCheckResult;
  createdAt?: Date;
  completedAt?: Date;
  updatedAt?: Date;
}
