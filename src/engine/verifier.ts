/**
 * @file verifier.ts
 * Pure deterministic skill verification engine.
 * Computes the 4 exact statuses (VERIFIED, DEVELOPING, UNVERIFIED, NOT_FOUND) and plain-language reasons.
 */

import { VERIFY_THRESHOLD, SkillStatus } from '../config/scoring';
import { SKILLS_MAP } from '../data/skills';

export type EvidenceType =
  | 'Resume + assessment'
  | 'Assessment only'
  | 'Resume only'
  | 'Added by you'
  | 'No evidence';

export interface SkillVerificationRecord {
  skillId: string;
  skillName: string;
  category: string;
  status: SkillStatus;
  score?: number; // Latest assessment score percent (0-100)
  questionsDrawn?: number;
  claimedInResume: boolean;
  manualClaim: boolean;
  snippet?: string;
  evidenceLabel: EvidenceType;
  reason: string;
}

/**
 * Derives verification status and plain-language reason for a skill based on claimed and assessed evidence.
 * Formulas:
 *   If assessed and score >= VERIFY_THRESHOLD (60%):
 *     status = VERIFIED
 *     evidenceLabel = claimedInResume ? "Resume + assessment" : "Assessment only"
 *   Else if assessed and score < VERIFY_THRESHOLD (60%):
 *     status = DEVELOPING
 *     evidenceLabel = claimedInResume ? "Resume + assessment" : "Assessment only"
 *   Else if claimed (resume or manual):
 *     status = UNVERIFIED
 *     evidenceLabel = manualClaim ? "Added by you" : "Resume only"
 *   Else:
 *     status = NOT_FOUND
 *     evidenceLabel = "No evidence"
 *
 * @param skillId Identifier of the skill
 * @param claimedInResume True if detected in extracted resume text
 * @param manualClaim True if manually added by user from taxonomy
 * @param assessmentLatest Latest assessment record if available
 * @param snippet Resume context snippet
 * @returns Complete verified skill record with human-readable rationale
 */
export function verifySkill(
  skillId: string,
  claimedInResume: boolean,
  manualClaim: boolean,
  assessmentLatest?: { percent: number; total: number; isAssessed: boolean },
  snippet?: string
): SkillVerificationRecord {
  const skill = SKILLS_MAP.get(skillId);
  const skillName = skill ? skill.name : skillId;
  const category = skill ? skill.category : 'General';

  // Professional skills are non-assessable by definition (resume-only, never verified)
  const isProfessional = skill ? skill.category === 'Professional' : false;

  let status: SkillStatus = 'NOT_FOUND';
  let evidenceLabel: EvidenceType = 'No evidence';
  let reason = '';

  const hasAssessment = Boolean(assessmentLatest && assessmentLatest.isAssessed);
  const score = hasAssessment && assessmentLatest ? assessmentLatest.percent : undefined;
  const drawn = hasAssessment && assessmentLatest ? assessmentLatest.total : undefined;

  if (isProfessional) {
    if (claimedInResume || manualClaim) {
      status = 'UNVERIFIED';
      evidenceLabel = manualClaim ? 'Added by you' : 'Resume only';
      reason = `${skillName} is a professional skill listed on your profile. Professional skills are observed from experience and cannot be verified through multiple-choice assessments.`;
    } else {
      status = 'NOT_FOUND';
      evidenceLabel = 'No evidence';
      reason = `${skillName}: no evidence found yet. It does not appear in your resume or profile.`;
    }
    return {
      skillId,
      skillName,
      category,
      status,
      score,
      questionsDrawn: drawn,
      claimedInResume,
      manualClaim,
      snippet,
      evidenceLabel,
      reason,
    };
  }

  if (hasAssessment && score !== undefined && drawn !== undefined) {
    if (score >= VERIFY_THRESHOLD) {
      status = 'VERIFIED';
      evidenceLabel = claimedInResume ? 'Resume + assessment' : 'Assessment only';
      if (claimedInResume) {
        reason = `${skillName} is Verified: it appears in your resume and you scored ${score}% on ${drawn} questions (threshold ${VERIFY_THRESHOLD}%).`;
      } else {
        reason = `${skillName} is Verified: you demonstrated mastery by scoring ${score}% on ${drawn} assessment questions (threshold ${VERIFY_THRESHOLD}%).`;
      }
    } else {
      status = 'DEVELOPING';
      evidenceLabel = claimedInResume ? 'Resume + assessment' : 'Assessment only';
      if (claimedInResume) {
        reason = `${skillName} is Developing: it’s on your resume, but your ${score}% assessment score is below the ${VERIFY_THRESHOLD}% threshold.`;
      } else {
        reason = `${skillName} is Developing: you scored ${score}% on ${drawn} questions, which is below the ${VERIFY_THRESHOLD}% verification threshold.`;
      }
    }
  } else if (claimedInResume || manualClaim) {
    status = 'UNVERIFIED';
    evidenceLabel = manualClaim ? 'Added by you' : 'Resume only';
    if (claimedInResume) {
      reason = `${skillName} is Unverified: it was detected in your resume, but has not yet been verified through an assessment.`;
    } else {
      reason = `${skillName} is Unverified: you added this skill to your profile, but have not yet verified it with an assessment.`;
    }
  } else {
    status = 'NOT_FOUND';
    evidenceLabel = 'No evidence';
    reason = `${skillName}: no evidence yet. It isn’t on your resume and hasn’t been assessed.`;
  }

  return {
    skillId,
    skillName,
    category,
    status,
    score,
    questionsDrawn: drawn,
    claimedInResume,
    manualClaim,
    snippet,
    evidenceLabel,
    reason,
  };
}
