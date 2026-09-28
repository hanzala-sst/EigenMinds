import { Request, Response } from 'express';
import { Agent } from '../models/Agent';
import { seedAgents } from '../data/seedAgents';
import { RecruiterAgentService } from '../services/agents/RecruiterAgentService';
import { IJobRequirement } from '../types/job';

export async function getAgents(req: Request, res: Response): Promise<void> {
  try {
    const agents = await Agent.find().lean();
    if (agents.length > 0) {
      res.json({ success: true, count: agents.length, agents });
      return;
    }
  } catch {
    // Fallback
  }

  res.json({
    success: true,
    count: seedAgents.length,
    agents: seedAgents,
    source: 'in-memory-seed'
  });
}

export async function discoverAgents(req: Request, res: Response): Promise<void> {
  try {
    const jobRequirement: IJobRequirement = req.body;

    if (!jobRequirement || !jobRequirement.requiredSkills) {
      res.status(400).json({
        success: false,
        message: 'Invalid job requirement. requiredSkills array is required.'
      });
      return;
    }

    const discoveryResults = await RecruiterAgentService.findScreeningAgents(jobRequirement);
    const selectedAgent = RecruiterAgentService.selectScreeningAgent(discoveryResults);

    res.json({
      success: true,
      count: discoveryResults.length,
      agents: discoveryResults,
      recommendedAgent: selectedAgent
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
