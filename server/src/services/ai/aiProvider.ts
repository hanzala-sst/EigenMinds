import { IJobRequirement } from '../../types/job';
import { SyntheticResume } from '../../types/resume';
import { IScreeningAssessmentResult } from '../../types/screening';
import { DeterministicScreeningEngine } from '../screening/screeningEngine';

export interface IAIProvider {
  generateStructuredScreening(
    job: IJobRequirement,
    resumes: SyntheticResume[]
  ): Promise<IScreeningAssessmentResult>;
}

/**
 * Modular AI Provider with Deterministic Fallback Engine.
 * Does NOT require an API key to run locally.
 */
export class ServiceAIProvider implements IAIProvider {
  public async generateStructuredScreening(
    job: IJobRequirement,
    resumes: SyntheticResume[]
  ): Promise<IScreeningAssessmentResult> {
    const screeningMode = process.env.SCREENING_MODE || 'deterministic';
    const hasApiKey = Boolean(
      process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY
    );

    if (screeningMode === 'llm' && hasApiKey) {
      try {
        // Optional LLM enhancement route
        // If an API key is available, attempt structured LLM query, fallback to deterministic on error
        return await this.executeLLMScreening(job, resumes);
      } catch (error) {
        console.warn('[AIProvider] LLM execution failed or not configured, falling back to Deterministic Engine:', error);
        return DeterministicScreeningEngine.evaluateCandidates(job, resumes);
      }
    }

    // Default & Fallback: Deterministic Screening Engine
    return DeterministicScreeningEngine.evaluateCandidates(job, resumes);
  }

  private async executeLLMScreening(
    job: IJobRequirement,
    resumes: SyntheticResume[]
  ): Promise<IScreeningAssessmentResult> {
    // If external AI key is provided, we can call OpenAI/Gemini structured outputs.
    // For local fallback safety, return deterministic result.
    return DeterministicScreeningEngine.evaluateCandidates(job, resumes);
  }
}
