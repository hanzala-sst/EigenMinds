import { SyntheticResume } from '../../types/resume';
import { IJobRequirement } from '../../types/job';
import { ICandidateEvaluation, IScreeningAssessmentResult } from '../../types/screening';

/**
 * Deterministic Baseline Screening Engine
 * 
 * Scoring Formula:
 * - Base score: 100 points
 * - Required Skill Penalty: -25 points per missing required skill
 * - Experience Penalty: -15 points per year below job minimum requirement
 * - Preferred Skill Bonus: +5 points per matched preferred skill
 * - Final Score bounded strictly to [0, 100]
 * 
 * Recommendation Thresholds:
 * - Score >= 80 -> HIRE
 * - Score 50 to 79 -> CONSIDER
 * - Score < 50 -> REJECT
 */
export class DeterministicScreeningEngine {
  public static evaluateCandidates(
    job: IJobRequirement,
    resumes: SyntheticResume[]
  ): IScreeningAssessmentResult {
    const rankings: ICandidateEvaluation[] = resumes.map((resume) =>
      this.evaluateSingleCandidate(job, resume)
    );

    // Sort descending by matchScore
    rankings.sort((a, b) => b.matchScore - a.matchScore);

    const hireCount = rankings.filter((r) => r.recommendation === 'HIRE').length;
    const considerCount = rankings.filter((r) => r.recommendation === 'CONSIDER').length;

    const summary = `${resumes.length} candidate(s) evaluated against role '${job.title}'. ` +
      `${hireCount} recommended for HIRE, ${considerCount} for CONSIDERation.`;

    return {
      evaluatedCount: resumes.length,
      rankings,
      summary
    };
  }

  public static evaluateSingleCandidate(
    job: IJobRequirement,
    resume: SyntheticResume
  ): ICandidateEvaluation {
    const candidateSkillsLower = resume.skills.map((s) => s.toLowerCase());
    const requiredSkillsLower = job.requiredSkills.map((s) => s.toLowerCase());
    const preferredSkillsLower = (job.preferredSkills || []).map((s) => s.toLowerCase());

    const keyStrengths: string[] = [];
    const missingSkills: string[] = [];

    // 1. Check Required Skills
    let matchedRequiredCount = 0;
    job.requiredSkills.forEach((reqSkill) => {
      if (candidateSkillsLower.includes(reqSkill.toLowerCase())) {
        matchedRequiredCount++;
      } else {
        missingSkills.push(reqSkill);
      }
    });

    if (matchedRequiredCount > 0) {
      keyStrengths.push(
        `Matched ${matchedRequiredCount}/${job.requiredSkills.length} required skills (${job.requiredSkills.filter(s => candidateSkillsLower.includes(s.toLowerCase())).join(', ')})`
      );
    }

    // 2. Check Preferred Skills
    let matchedPreferredCount = 0;
    (job.preferredSkills || []).forEach((prefSkill) => {
      if (candidateSkillsLower.includes(prefSkill.toLowerCase())) {
        matchedPreferredCount++;
      }
    });

    if (matchedPreferredCount > 0) {
      keyStrengths.push(`Bonus: Matched ${matchedPreferredCount} preferred skill(s)`);
    }

    // 3. Experience Check
    let experienceAssessment = '';
    const minExp = job.minExperienceYears;
    const candExp = resume.experienceYears;

    if (candExp >= minExp) {
      experienceAssessment = `${candExp} year(s) meets or exceeds minimum requirement of ${minExp} year(s).`;
      keyStrengths.push(`Experience: ${candExp} yrs meets required ${minExp} yrs`);
    } else {
      const expDiff = minExp - candExp;
      experienceAssessment = `${candExp} year(s) is ${expDiff} year(s) below minimum requirement of ${minExp} year(s).`;
    }

    // 4. Calculate Score
    let score = 100;

    // Penalty for missing required skills
    const missingReqCount = missingSkills.length;
    const penaltyPerMissingSkill = job.evaluationCriteria?.requiredSkillPenalty ?? 25;
    score -= missingReqCount * penaltyPerMissingSkill;

    // Penalty for insufficient experience
    if (candExp < minExp) {
      const expShortfall = minExp - candExp;
      score -= expShortfall * 15;
    }

    // Bonus for preferred skills
    score += matchedPreferredCount * 5;

    // Bound score between 0 and 100
    const finalScore = Math.min(100, Math.max(0, Math.round(score)));

    // 5. Determine Recommendation
    const hireThreshold = job.evaluationCriteria?.recommendationThreshold ?? 80;
    let recommendation: 'HIRE' | 'CONSIDER' | 'REJECT';

    if (finalScore >= hireThreshold) {
      recommendation = 'HIRE';
    } else if (finalScore >= 50) {
      recommendation = 'CONSIDER';
    } else {
      recommendation = 'REJECT';
    }

    return {
      candidateId: resume.candidateId,
      candidateName: resume.name,
      matchScore: finalScore,
      recommendation,
      keyStrengths,
      missingSkills,
      experienceAssessment
    };
  }
}
