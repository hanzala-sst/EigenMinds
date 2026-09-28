export interface IEvaluationCriteria {
  skillMatchWeight: number;      // e.g. 50%
  experienceWeight: number;      // e.g. 30%
  requiredSkillPenalty: number;  // e.g. -25 per missing required skill
  recommendationThreshold: number; // e.g. 80 for HIRE, 50 for CONSIDER
}

export interface IJobRequirement {
  jobId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minExperienceYears: number;
  evaluationCriteria: IEvaluationCriteria;
  createdAt?: Date;
  updatedAt?: Date;
}
