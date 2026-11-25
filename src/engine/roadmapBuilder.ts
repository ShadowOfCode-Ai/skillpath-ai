/**
 * @file roadmapBuilder.ts
 * Pure deterministic personalized learning roadmap engine.
 * Generates ordered milestones based on prerequisites, importance, and current verification status,
 * followed by two standard capstone closing steps.
 */

import { CareerRole, RequiredSkill } from '../data/roles';
import { SkillVerificationRecord } from './verifier';
import { SKILLS_MAP, SkillDefinition } from '../data/skills';
import { SkillStatus } from '../config/scoring';

export type StepProgressStatus = 'not_started' | 'in_progress' | 'done';

export interface RoadmapStep {
  id: string; // skillId or closing step id
  isClosingStep: boolean;
  stepNumber: number;
  title: string;
  skillId?: string;
  category?: string;
  importance?: 'core' | 'supporting';
  whyItMatters: string;
  currentStatus?: SkillStatus;
  currentScore?: number;
  topicsToLearn: string[];
  practiceProject: string;
  effortWeeks: number;
  effortLabel: string;
  progressStatus: StepProgressStatus;
  docUrl?: string;
}

export interface CareerRoadmap {
  roleId: string;
  roleName: string;
  steps: RoadmapStep[];
  totalSteps: number;
  completedSteps: number;
  progressPercent: number; // completed / total * 100
}

/**
 * Builds an ordered roadmap for a career role based on unverified skills.
 * Ordering rules:
 *   1. Topological dependency: If Skill A is a prerequisite for Skill B, Skill A must appear before Skill B.
 *   2. Importance: Core skills before Supporting skills.
 *   3. Current status: DEVELOPING before UNVERIFIED before NOT_FOUND.
 *   4. Appends two closing steps:
 *      - "Build a portfolio project for this role"
 *      - "Re-verify your skills"
 *
 * @param role The target or selected career role
 * @param verifiedSkillsMap Map of candidate's verified skills
 * @param savedProgress Progress statuses stored in Firestore for each step
 * @returns Fully structured and ordered career roadmap
 */
export function buildRoadmap(
  role: CareerRole,
  verifiedSkillsMap: Map<string, SkillVerificationRecord>,
  savedProgress: Record<string, StepProgressStatus> = {}
): CareerRoadmap {
  // Step 1: Filter to required skills that are NOT VERIFIED
  const unverifiedReqs = role.requiredSkills.filter((req) => {
    const record = verifiedSkillsMap.get(req.skillId);
    return !record || record.status !== 'VERIFIED';
  });

  // Collect skill details
  const skillItems = unverifiedReqs.map((req) => {
    const skillDef = SKILLS_MAP.get(req.skillId);
    const record = verifiedSkillsMap.get(req.skillId);
    const status: SkillStatus = record ? record.status : 'NOT_FOUND';
    return {
      req,
      def: skillDef,
      status,
      score: record?.score,
    };
  });

  // Status priority: DEVELOPING (1), UNVERIFIED (2), NOT_FOUND (3)
  const statusRank: Record<SkillStatus, number> = {
    DEVELOPING: 1,
    UNVERIFIED: 2,
    NOT_FOUND: 3,
    VERIFIED: 4,
  };

  // Sort with stable comparison: prerequisites first, then core before supporting, then status rank
  skillItems.sort((a, b) => {
    // Check if a is prereq for b
    if (b.def && b.def.prerequisites.includes(a.req.skillId)) return -1;
    if (a.def && a.def.prerequisites.includes(b.req.skillId)) return 1;

    // Core before supporting
    const weightA = a.req.importance === 'core' ? 2 : 1;
    const weightB = b.req.importance === 'core' ? 2 : 1;
    if (weightB !== weightA) return weightB - weightA;

    // Status priority
    const sA = statusRank[a.status] || 3;
    const sB = statusRank[b.status] || 3;
    if (sA !== sB) return sA - sB;

    return a.req.skillId.localeCompare(b.req.skillId);
  });

  const steps: RoadmapStep[] = [];
  let stepCounter = 1;

  for (const item of skillItems) {
    const skillDef = item.def;
    const skillName = skillDef ? skillDef.name : item.req.skillId;
    const stepId = `step-${item.req.skillId}`;
    const progressStatus = savedProgress[stepId] || savedProgress[item.req.skillId] || 'not_started';
    const effortWeeks = skillDef ? skillDef.effortWeeks : 2;

    steps.push({
      id: stepId,
      skillId: item.req.skillId,
      isClosingStep: false,
      stepNumber: stepCounter++,
      title: `Master & Verify: ${skillName}`,
      category: skillDef?.category || 'Technical',
      importance: item.req.importance,
      whyItMatters: item.req.whyItMatters,
      currentStatus: item.status,
      currentScore: item.score,
      topicsToLearn: skillDef ? skillDef.learn : ['Core Concepts', 'Practical Application'],
      practiceProject: skillDef ? skillDef.practice : `Build a focused portfolio project applying ${skillName}.`,
      effortWeeks,
      effortLabel: `~${effortWeeks} ${effortWeeks === 1 ? 'week' : 'weeks'} (estimate)`,
      progressStatus,
    });
  }

  // Append Closing Step 1: Portfolio Project
  const capstoneProgress = savedProgress['step-capstone-project'] || 'not_started';
  steps.push({
    id: 'step-capstone-project',
    isClosingStep: true,
    stepNumber: stepCounter++,
    title: `Build a portfolio project for ${role.name}`,
    whyItMatters: `Synthesizes the core and supporting competencies of the ${role.name} role into an end-to-end demonstrable showcase for technical recruiters.`,
    topicsToLearn: [
      'Problem Scoping & Architecture',
      'Git Version Control & Documentation',
      'Automated Testing & Edge Cases',
      'Production Deployment & Readme Breakdown',
    ],
    practiceProject: `Develop an end-to-end ${role.name} showcase repository integrating at least 3 required skills with automated tests and a live deployment demo.`,
    effortWeeks: 3,
    effortLabel: '~3 weeks (estimate)',
    progressStatus: capstoneProgress,
  });

  // Append Closing Step 2: Re-verify Skills
  const reverifyProgress = savedProgress['step-reverify-skills'] || 'not_started';
  steps.push({
    id: 'step-reverify-skills',
    isClosingStep: true,
    stepNumber: stepCounter++,
    title: 'Re-verify your skills',
    whyItMatters: 'Take the SkillPath AI assessment attempt for all newly acquired skills to officially transition their status to VERIFIED.',
    topicsToLearn: ['Targeted Review', 'Mock Timed Assessments', 'Formula & Code Syntax Walkthrough'],
    practiceProject: 'Attempt the SkillPath assessment module for your developing and unverified skills to reach 60%+ threshold.',
    effortWeeks: 1,
    effortLabel: '~1 week (estimate)',
    progressStatus: reverifyProgress,
  });

  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.progressStatus === 'done').length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return {
    roleId: role.id,
    roleName: role.name,
    steps,
    totalSteps,
    completedSteps,
    progressPercent,
  };
}
