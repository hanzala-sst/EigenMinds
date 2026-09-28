import { Request, Response } from 'express';
import { JobRequirement } from '../models/JobRequirement';
import { IJobRequirement } from '../types/job';

// In-memory fallback store if MongoDB is offline
const inMemoryJobsMap = new Map<string, IJobRequirement>();

export async function createJob(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, requiredSkills, preferredSkills, minExperienceYears, evaluationCriteria } = req.body;

    if (!title || !requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Title and non-empty requiredSkills array are required.'
      });
      return;
    }

    const jobId = `JOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const jobData: IJobRequirement = {
      jobId,
      title,
      description: description || `Requirement for ${title}`,
      requiredSkills,
      preferredSkills: preferredSkills || [],
      minExperienceYears: minExperienceYears || 0,
      evaluationCriteria: evaluationCriteria || {
        skillMatchWeight: 50,
        experienceWeight: 30,
        requiredSkillPenalty: 25,
        recommendationThreshold: 80
      }
    };

    try {
      const newJob = new JobRequirement(jobData);
      await newJob.save();
    } catch {
      inMemoryJobsMap.set(jobId, jobData);
    }

    res.status(201).json({
      success: true,
      message: 'JobRequirement created successfully.',
      job: jobData
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getJobById(req: Request, res: Response): Promise<void> {
  try {
    const jobId = typeof req.params.jobId === 'string' ? req.params.jobId : String(req.params.jobId);

    try {
      const job = await JobRequirement.findOne({ jobId }).lean();
      if (job) {
        res.json({ success: true, job });
        return;
      }
    } catch {
      // Fallback
    }

    if (inMemoryJobsMap.has(jobId)) {
      res.json({ success: true, job: inMemoryJobsMap.get(jobId) });
      return;
    }

    // Default seeded job fallback
    if (jobId === 'JOB-BACKEND-01') {
      const defaultJob: IJobRequirement = {
        jobId: 'JOB-BACKEND-01',
        title: 'Backend Engineer (Node.js & MongoDB)',
        description: 'Role requirement for a Senior Backend Engineer proficient in Node.js, Express, MongoDB, and REST APIs.',
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
      res.json({ success: true, job: defaultJob });
      return;
    }

    res.status(404).json({ success: false, message: `Job with ID '${jobId}' not found.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
