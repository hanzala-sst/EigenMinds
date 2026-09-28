export interface SyntheticResume {
  candidateId: string;
  name: string;
  skills: string[];
  experienceYears: number;
  summary: string;
  projects?: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  education?: string;
}
