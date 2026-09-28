import { Request, Response } from 'express';
import { ScreeningTask } from '../models/ScreeningTask';
import { EscrowAgreement } from '../models/EscrowAgreement';
import { JobRequirement } from '../models/JobRequirement';
import { ScreeningAgentService } from '../services/agents/ScreeningAgentService';
import { VerificationEngine } from '../services/verification/verificationEngine';
import { syntheticResumesSeed } from '../data/syntheticResumes';
import { IScreeningTask } from '../types/screening';

// In-memory fallback
const inMemoryTasks = new Map<string, IScreeningTask>();

export async function submitScreening(req: Request, res: Response): Promise<void> {
  try {
    const { agreementId, jobId, screeningAgentId, syntheticResumes } = req.body;

    if (!agreementId || !jobId || !screeningAgentId) {
      res.status(400).json({
        success: false,
        message: 'agreementId, jobId, and screeningAgentId are required.'
      });
      return;
    }

    const resumesToEvaluate = (Array.isArray(syntheticResumes) && syntheticResumes.length > 0)
      ? syntheticResumes
      : syntheticResumesSeed;

    // Fetch Job details
    let jobDetails: any = null;
    try {
      jobDetails = await JobRequirement.findOne({ jobId }).lean();
    } catch {}

    if (!jobDetails) {
      jobDetails = {
        jobId,
        title: 'Backend Engineer (Node.js & MongoDB)',
        requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
        preferredSkills: ['TypeScript', 'Docker'],
        minExperienceYears: 2
      };
    }

    const taskId = `TASK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Execute Screening Agent evaluation
    const assessmentResult = await ScreeningAgentService.screenCandidates(jobDetails, resumesToEvaluate);

    const taskData: IScreeningTask = {
      taskId,
      agreementId,
      jobId,
      screeningAgentId,
      resumesCount: resumesToEvaluate.length,
      status: 'COMPLETED',
      inputSnapshot: {
        jobTitle: jobDetails.title,
        requiredSkills: jobDetails.requiredSkills,
        resumes: resumesToEvaluate
      },
      assessmentResult,
      completedAt: new Date()
    };

    try {
      const newTask = new ScreeningTask(taskData);
      await newTask.save();
    } catch {
      inMemoryTasks.set(taskId, taskData);
    }

    res.status(201).json({
      success: true,
      message: 'Screening task completed successfully.',
      task: taskData
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function verifyScreening(req: Request, res: Response): Promise<void> {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      res.status(400).json({ success: false, message: 'taskId is required.' });
      return;
    }

    let task: IScreeningTask | null = null;
    try {
      task = (await ScreeningTask.findOne({ taskId }).lean()) as unknown as IScreeningTask;
    } catch {}

    if (!task && inMemoryTasks.has(taskId)) {
      task = inMemoryTasks.get(taskId)!;
    }

    if (!task) {
      res.status(404).json({ success: false, message: `Screening task '${taskId}' not found.` });
      return;
    }

    // Run Verification Engine
    const verificationResult = VerificationEngine.verifyTaskOutput(
      task.taskId,
      task.inputSnapshot.resumes,
      task.assessmentResult
    );

    task.verificationResult = verificationResult;
    task.status = verificationResult.verified ? 'VERIFIED' : 'FAILED';

    try {
      await ScreeningTask.updateOne(
        { taskId },
        { $set: { verificationResult, status: task.status } }
      );
      if (verificationResult.verified) {
        await EscrowAgreement.updateOne(
          { agreementId: task.agreementId },
          { $set: { status: 'VERIFIED' } }
        );
      }
    } catch {
      inMemoryTasks.set(taskId, task);
    }

    res.json({
      success: true,
      verified: verificationResult.verified,
      message: verificationResult.verified
        ? 'Screening result verified successfully off-chain. Marked ready for settlement.'
        : 'Verification failed.',
      task,
      verificationResult
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
