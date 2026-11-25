/**
 * @file gapAnalyzer.ts
 * Pure deterministic skill-gap analysis engine.
 * Categorizes a role's required skills into three mutually exclusive buckets:
 * Matched (VERIFIED), Developing (DEVELOPING), and Missing (UNVERIFIED or NOT_FOUND).
 * Prepares radar chart data for target vs current competency levels.
 */

import { CareerRole, RequiredSkill } from '../data/roles';
import { SkillVerificationRecord } from './verifier';
import { SKILLS_MAP } from '../data/skills';

export interface GapAnalysisSkillItem {
  skillId: string;
  skillName: string;
  importance: 'core' | 'supporting';
  whyItMatters: string;
  status: 'VERIFIED' | 'DEVELOPING' | 'UNVERIFIED' | 'NOT_FOUND';
  score?: number;
  evidenceLabel: string;
  reason: string;
}

export interface RadarPoint {
  skill: string;
  required: number; // 100 for core, 80 for supporting
  current: number;  // 100 for verified, 50 for developing, 25 for unverified, 0 for not found (or actual test score)
}

export interface RoleGapAnalysis {
  roleId: string;
  roleName: string;
  matched: GapAnalysisSkillItem[];   // VERIFIED
  developing: GapAnalysisSkillItem[]; // DEVELOPING
  missing: GapAnalysisSkillItem[];   // UNVERIFIED or NOT_FOUND
  radarData: RadarPoint[];
  totalRequired: number;
}

/**
 * Analyzes skill gaps for a specified career role against a user's verified skills map.
 * Invariant: Every required skill is placed into exactly one of three mutually exclusive buckets.
 *
 * @param role Career role definition
 * @param verifiedSkillsMap Map of skillId to SkillVerificationRecord
 * @returns Partitioned gap analysis with radar chart points
 */
export function analyzeSkillGap(
  role: CareerRole,
  verifiedSkillsMap: Map<string, SkillVerificationRecord>
): RoleGapAnalysis {
  const matched: GapAnalysisSkillItem[] = [];
  const developing: GapAnalysisSkillItem[] = [];
  const missing: GapAnalysisSkillItem[] = [];
  const radarData: RadarPoint[] = [];

  for (const req of role.requiredSkills) {
    const verified = verifiedSkillsMap.get(req.skillId);
    const skillDef = SKILLS_MAP.get(req.skillId);
    const skillName = skillDef ? skillDef.name : req.skillId;

    const status = verified ? verified.status : 'NOT_FOUND';
    const score = verified?.score;
    const evidenceLabel = verified ? verified.evidenceLabel : 'No evidence';
    const reason = verified
      ? verified.reason
      : `${skillName}: no evidence yet. It isn’t on your resume and hasn’t been assessed.`;

    const item: GapAnalysisSkillItem = {
      skillId: req.skillId,
      skillName,
      importance: req.importance,
      whyItMatters: req.whyItMatters,
      status,
      score,
      evidenceLabel,
      reason,
    };

    if (status === 'VERIFIED') {
      matched.push(item);
    } else if (status === 'DEVELOPING') {
      developing.push(item);
    } else {
      missing.push(item);
    }

    // Compute radar values
    const requiredLevel = req.importance === 'core' ? 100 : 80;
    let currentLevel = 0;
    if (status === 'VERIFIED') {
      currentLevel = score !== undefined ? Math.max(75, score) : 85;
    } else if (status === 'DEVELOPING') {
      currentLevel = score !== undefined ? score : 50;
    } else if (status === 'UNVERIFIED') {
      currentLevel = 25;
    } else {
      currentLevel = 0;
    }

    radarData.push({
      skill: skillName,
      required: requiredLevel,
      current: currentLevel,
    });
  }

  return {
    roleId: role.id,
    roleName: role.name,
    matched,
    developing,
    missing,
    radarData,
    totalRequired: role.requiredSkills.length,
  };
}
