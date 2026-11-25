/**
 * @file careerRanker.ts
 * Pure deterministic career ranking engine.
 * Computes skillMatch, assessmentConfidence, evidenceCoverage, careerScore,
 * tie-breaking, and formula breakdowns for every career role.
 */

import {
  STATUS_CREDIT,
  IMPORTANCE_WEIGHT,
  CAREER_WEIGHTS,
  PROVISIONAL_COVERAGE,
  SkillStatus,
} from '../config/scoring';
import { CareerRole, RequiredSkill } from '../data/roles';
import { SkillVerificationRecord } from './verifier';
import { SKILLS_MAP } from '../data/skills';

export interface CareerRecommendation {
  roleId: string;
  roleName: string;
  summary: string;
  rank: number;
  careerScore: number; // 0 - 100
  skillMatch: number;  // 0 - 100
  assessmentConfidence: number; // 0 - 100
  evidenceCoverage: number; // 0.0 - 1.0
  isProvisional: boolean; // evidenceCoverage < 0.4
  verifiedCount: number;
  totalRequired: number;
  matchedSkills: string[];
  topGaps: { skillName: string; importance: string; status: SkillStatus }[];
  formulaBreakdown: string;
  isTargetRole?: boolean;
}

/**
 * Calculates skill match percentage for a set of required skills.
 * Formula:
 *   skillMatch = ( Σ(weight_i * credit_i) / Σ(weight_i) ) * 100
 * where:
 *   credit: VERIFIED = 1.0, DEVELOPING = 0.5, UNVERIFIED = 0.25, NOT_FOUND = 0.0
 *   weight: core = 2, supporting = 1
 *
 * Test fixture: five core skills required, four VERIFIED and one NOT_FOUND:
 *   weights = 2*5 = 10, credits = (4*1.0 + 1*0)*2 = 8 -> 8 / 10 = 80%.
 *
 * @param requiredSkills Array of required skills with importance
 * @param verifiedSkillsMap Map of verified skill records
 * @returns Skill match score as a percentage between 0 and 100
 */
export function calculateSkillMatch(
  requiredSkills: RequiredSkill[],
  verifiedSkillsMap: Map<string, SkillVerificationRecord>
): number {
  if (!requiredSkills || requiredSkills.length === 0) return 0;

  let totalWeight = 0;
  let weightedCreditSum = 0;

  for (const req of requiredSkills) {
    const weight = IMPORTANCE_WEIGHT[req.importance] || 1;
    totalWeight += weight;

    const record = verifiedSkillsMap.get(req.skillId);
    const status: SkillStatus = record ? record.status : 'NOT_FOUND';
    const credit = STATUS_CREDIT[status] ?? 0;

    weightedCreditSum += weight * credit;
  }

  if (totalWeight === 0) return 0;
  const matchFraction = weightedCreditSum / totalWeight;
  return Math.round(matchFraction * 1000) / 10; // 1 decimal place, e.g. 80.0
}

/**
 * Calculates assessment confidence for a role.
 * Formula:
 *   assessmentConfidence = ( Σ(weight_i * score_i) / Σ(weight_i) ) for assessed required skills
 *   If no required skills have been assessed, assessmentConfidence = 0.
 *
 * @param requiredSkills Array of required skills with importance
 * @param verifiedSkillsMap Map of verified skill records
 * @returns Weighted assessment score percentage (0 to 100)
 */
export function calculateAssessmentConfidence(
  requiredSkills: RequiredSkill[],
  verifiedSkillsMap: Map<string, SkillVerificationRecord>
): number {
  let totalAssessedWeight = 0;
  let weightedScoreSum = 0;

  for (const req of requiredSkills) {
    const record = verifiedSkillsMap.get(req.skillId);
    if (record && record.score !== undefined && (record.status === 'VERIFIED' || record.status === 'DEVELOPING')) {
      const weight = IMPORTANCE_WEIGHT[req.importance] || 1;
      totalAssessedWeight += weight;
      weightedScoreSum += weight * record.score;
    }
  }

  if (totalAssessedWeight === 0) return 0;
  return Math.round((weightedScoreSum / totalAssessedWeight) * 10) / 10;
}

/**
 * Ranks all career roles against a candidate's verified skills profile.
 * Formula:
 *   careerScore = 0.70 * skillMatch + 0.30 * assessmentConfidence
 *   evidenceCoverage = assessedRequiredSkills / totalRequiredSkills
 *
 * Ties are broken deterministically by:
 *   1. Number of VERIFIED skills (descending)
 *   2. Role name alphabetically (ascending)
 *
 * @param roles Array of all career roles
 * @param verifiedSkillsMap Map of verified skill records
 * @param targetRoleId User's chosen target role ID
 * @returns Ranked career recommendations
 */
export function rankCareerRoles(
  roles: CareerRole[],
  verifiedSkillsMap: Map<string, SkillVerificationRecord>,
  targetRoleId?: string
): CareerRecommendation[] {
  const recommendations: CareerRecommendation[] = [];

  for (const role of roles) {
    const totalRequired = role.requiredSkills.length;
    let assessedCount = 0;
    let verifiedCount = 0;
    const matchedSkills: string[] = [];
    const missingCandidates: { skillName: string; importance: string; status: SkillStatus; weight: number }[] = [];

    for (const req of role.requiredSkills) {
      const record = verifiedSkillsMap.get(req.skillId);
      const skillName = SKILLS_MAP.get(req.skillId)?.name || req.skillId;
      const status: SkillStatus = record ? record.status : 'NOT_FOUND';

      if (record && record.score !== undefined && (status === 'VERIFIED' || status === 'DEVELOPING')) {
        assessedCount += 1;
      }

      if (status === 'VERIFIED') {
        verifiedCount += 1;
        matchedSkills.push(skillName);
      } else {
        missingCandidates.push({
          skillName,
          importance: req.importance,
          status,
          weight: IMPORTANCE_WEIGHT[req.importance] || 1,
        });
      }
    }

    const skillMatch = calculateSkillMatch(role.requiredSkills, verifiedSkillsMap);
    const assessmentConfidence = calculateAssessmentConfidence(role.requiredSkills, verifiedSkillsMap);

    // careerScore = 0.70 * skillMatch + 0.30 * assessmentConfidence
    const careerScoreRaw =
      CAREER_WEIGHTS.skillMatch * skillMatch + CAREER_WEIGHTS.assessmentConfidence * assessmentConfidence;
    const careerScore = Math.round(careerScoreRaw);

    const evidenceCoverage = totalRequired > 0 ? Math.round((assessedCount / totalRequired) * 100) / 100 : 0;
    const isProvisional = evidenceCoverage < PROVISIONAL_COVERAGE;

    // Top 2 gaps by weight (core first)
    missingCandidates.sort((a, b) => b.weight - a.weight);
    const topGaps = missingCandidates.slice(0, 2).map((g) => ({
      skillName: g.skillName,
      importance: g.importance,
      status: g.status,
    }));

    const formulaBreakdown = `0.70 × ${skillMatch.toFixed(1)}% + 0.30 × ${assessmentConfidence.toFixed(1)}% = ${careerScore}%`;

    recommendations.push({
      roleId: role.id,
      roleName: role.name,
      summary: role.summary,
      rank: 0, // Assigned after sorting
      careerScore,
      skillMatch,
      assessmentConfidence,
      evidenceCoverage,
      isProvisional,
      verifiedCount,
      totalRequired,
      matchedSkills,
      topGaps,
      formulaBreakdown,
      isTargetRole: role.id === targetRoleId,
    });
  }

  // Deterministic sorting: careerScore descending, then verifiedCount descending, then roleName ascending
  recommendations.sort((a, b) => {
    if (b.careerScore !== a.careerScore) return b.careerScore - a.careerScore;
    if (b.verifiedCount !== a.verifiedCount) return b.verifiedCount - a.verifiedCount;
    return a.roleName.localeCompare(b.roleName);
  });

  // Assign 1-based ranks
  recommendations.forEach((rec, idx) => {
    rec.rank = idx + 1;
  });

  return recommendations;
}
