import { SyntheticResume } from '../../types/resume';
import { IScreeningAssessmentResult, IVerificationCheckResult } from '../../types/screening';

/**
 * Off-Chain Verification Engine
 * Validates Screening Agent assessment reports against 10 strict rules
 * BEFORE any on-chain MST payment release can be triggered.
 */
export class VerificationEngine {
  public static verifyTaskOutput(
    taskId: string,
    submittedResumes: SyntheticResume[],
    assessment: IScreeningAssessmentResult | null | undefined
  ): IVerificationCheckResult {
    const issues: string[] = [];
    const checks = {
      complete: false,
      schemaValid: false,
      scoresValid: false,
      allCandidatesEvaluated: false
    };

    // Rule 1: Task ID exists and assessment is present
    if (!taskId) {
      issues.push('Task ID is missing or invalid.');
    }
    if (!assessment) {
      issues.push('Screening assessment result is missing or null.');
      return { verified: false, checks, issues };
    }

    // Rule 2: Evaluated count matches input count
    if (assessment.evaluatedCount !== submittedResumes.length) {
      issues.push(
        `Evaluated candidate count (${assessment.evaluatedCount}) does not match submitted resume count (${submittedResumes.length}).`
      );
    } else {
      checks.complete = true;
    }

    // Rule 3, 4, 5, 6, 7, 8: Schema & Score Validation
    const submittedIds = new Set(submittedResumes.map((r) => r.candidateId));
    const evaluatedIds = new Set<string>();
    let schemaValid = true;
    let scoresValid = true;

    if (!Array.isArray(assessment.rankings)) {
      issues.push('Assessment rankings must be an array.');
      schemaValid = false;
    } else {
      assessment.rankings.forEach((candidateEval, idx) => {
        // Rule 3: Valid candidate ID
        if (!candidateEval.candidateId) {
          issues.push(`Candidate at index ${idx} is missing candidateId.`);
          schemaValid = false;
        } else {
          // Rule 4: No duplicate candidate IDs
          if (evaluatedIds.has(candidateEval.candidateId)) {
            issues.push(`Duplicate candidateId '${candidateEval.candidateId}' found in evaluation.`);
            schemaValid = false;
          }
          evaluatedIds.add(candidateEval.candidateId);
        }

        // Rule 5: Match score in range [0, 100]
        if (
          typeof candidateEval.matchScore !== 'number' ||
          candidateEval.matchScore < 0 ||
          candidateEval.matchScore > 100
        ) {
          issues.push(
            `Candidate '${candidateEval.candidateId}' has invalid match score: ${candidateEval.matchScore}. Must be between 0 and 100.`
          );
          scoresValid = false;
        }

        // Rule 6: Valid Recommendation enum
        if (!['HIRE', 'CONSIDER', 'REJECT'].includes(candidateEval.recommendation)) {
          issues.push(
            `Candidate '${candidateEval.candidateId}' has invalid recommendation: '${candidateEval.recommendation}'. Must be HIRE, CONSIDER, or REJECT.`
          );
          schemaValid = false;
        }

        // Rule 7: Required fields exist
        if (!candidateEval.candidateName || !Array.isArray(candidateEval.keyStrengths)) {
          issues.push(`Candidate '${candidateEval.candidateId}' is missing required output fields.`);
          schemaValid = false;
        }

        // Rule 8: Missing skills structurally valid
        if (!Array.isArray(candidateEval.missingSkills)) {
          issues.push(`Candidate '${candidateEval.candidateId}' missingSkills must be an array.`);
          schemaValid = false;
        }
      });
    }

    checks.schemaValid = schemaValid;
    checks.scoresValid = scoresValid;

    // Rule 9 & 10: Every submitted resume was evaluated
    let allEvaluated = true;
    submittedIds.forEach((id) => {
      if (!evaluatedIds.has(id)) {
        issues.push(`Submitted candidate '${id}' was not evaluated by Screening Agent.`);
        allEvaluated = false;
      }
    });

    checks.allCandidatesEvaluated = allEvaluated;

    const verified =
      checks.complete && checks.schemaValid && checks.scoresValid && checks.allCandidatesEvaluated && issues.length === 0;

    return {
      verified,
      checks,
      issues
    };
  }
}
