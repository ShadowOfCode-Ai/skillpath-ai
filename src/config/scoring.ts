/**
 * @file scoring.ts
 * Central scoring configuration and tunable parameters for SkillPath AI.
 * Every scoring formula in the product references these exact constants.
 */

export const VERIFY_THRESHOLD = 60; // Assessment score threshold to achieve VERIFIED status (>= 60%)
export const MIN_QUESTIONS_PER_SKILL = 2; // Minimum questions drawn for a skill to count as assessed
export const QUESTIONS_PER_SKILL = 4; // Number of questions drawn per skill in an assessment attempt
export const MAX_SKILLS_PER_ATTEMPT = 8; // Maximum skills allowed per assessment attempt

export const STATUS_CREDIT = {
  VERIFIED: 1.0,
  DEVELOPING: 0.5,
  UNVERIFIED: 0.25,
  NOT_FOUND: 0.0,
} as const;

export type SkillStatus = keyof typeof STATUS_CREDIT;

export const IMPORTANCE_WEIGHT = {
  core: 2,
  supporting: 1,
} as const;

export type SkillImportance = keyof typeof IMPORTANCE_WEIGHT;

export const CAREER_WEIGHTS = {
  skillMatch: 0.7,
  assessmentConfidence: 0.3,
} as const;

export const OPPORTUNITY_WEIGHTS = {
  skillMatch: 0.7,
  textSimilarity: 0.3,
} as const;

export const PROVISIONAL_COVERAGE = 0.4; // Below 40% evidence coverage is labeled "Provisional"

export const LEVEL_BANDS = {
  BEGINNER_MAX: 40, // < 40% -> Beginner
  INTERMEDIATE_MAX: 70, // 40% - 69% -> Intermediate; >= 70% -> Advanced
} as const;

export const MAX_RESUME_CHARS = 60000;
export const MAX_FILE_MB = 5;

export const APP_VERSION = '2.0.0';
