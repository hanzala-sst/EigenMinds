import { IJobRequirement } from '../../types/job';
import { SyntheticResume } from '../../types/resume';
import { IScreeningAssessmentResult } from '../../types/screening';
import { ServiceAIProvider } from '../ai/aiProvider';

export class ScreeningAgentService {
  private static aiProvider = new ServiceAIProvider();

  public static async screenCandidates(
    job: IJobRequirement,
    resumes: SyntheticResume[]
  ): Promise<IScreeningAssessmentResult> {
    if (!resumes || resumes.length === 0) {
      return {
        evaluatedCount: 0,
        rankings: [],
        summary: 'No resumes provided for screening.'
      };
    }

    return await this.aiProvider.generateStructuredScreening(job, resumes);
  }
}
