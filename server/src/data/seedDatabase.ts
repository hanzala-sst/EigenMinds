import { Agent } from '../models/Agent';
import { JobRequirement } from '../models/JobRequirement';
import { seedAgents } from './seedAgents';

export async function seedDatabase(): Promise<void> {
  try {
    for (const agentData of seedAgents) {
      await Agent.updateOne(
        { agentId: agentData.agentId },
        { $set: agentData },
        { upsert: true }
      );
    }
    console.log('[Seed] Seed agents populated successfully.');

    // Seed default Backend Engineer Job Requirement if absent
    const defaultJob = {
      jobId: 'JOB-BACKEND-01',
      title: 'Backend Engineer (Node.js & MongoDB)',
      description: 'Role requirement for a Senior Backend Engineer proficient in Node.js, Express, MongoDB, and REST APIs with at least 2 years experience.',
      requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
      preferredSkills: ['TypeScript', 'Docker', 'Redis'],
      minExperienceYears: 2,
      evaluationCriteria: {
        skillMatchWeight: 50,
        experienceWeight: 30,
        requiredSkillPenalty: 25,
        recommendationThreshold: 80
      }
    };

    await JobRequirement.updateOne(
      { jobId: defaultJob.jobId },
      { $set: defaultJob },
      { upsert: true }
    );
    console.log('[Seed] Default JobRequirement (JOB-BACKEND-01) populated successfully.');
  } catch (error: any) {
    console.warn('[Seed] Database seed skipped (no active MongoDB connection):', error.message);
  }
}
