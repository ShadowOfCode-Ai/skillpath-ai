/**
 * @file assessmentScorer.ts
 * Pure deterministic assessment scoring and proficiency categorization.
 */

import { MIN_QUESTIONS_PER_SKILL, LEVEL_BANDS } from '../config/scoring';

export interface SkillScoreSummary {
  skillId: string;
  correct: number;
  total: number;
  percent: number;
  isAssessed: boolean; // Must have at least MIN_QUESTIONS_PER_SKILL questions drawn
}

export interface AssessmentGradingResult {
  perSkill: Record<string, SkillScoreSummary>;
  totalCorrect: number;
  totalDrawn: number;
  overallPercent: number;
}

/**
 * Grades an assessment attempt.
 * Formulas:
 *   skillPercent = (correct / totalDrawn) * 100
 *   overallPercent = (totalCorrect / totalDrawn) * 100
 *   isAssessed = totalDrawn >= MIN_QUESTIONS_PER_SKILL (2)
 *
 * @param answers Array of recorded answers with questionId and correct boolean
 * @param questionSkillMap Map from questionId to skillId
 * @returns Complete grading breakdown
 */
export function scoreAssessment(
  answers: { questionId: string; correct: boolean }[],
  questionSkillMap: Record<string, string>
): AssessmentGradingResult {
  const counts: Record<string, { correct: number; total: number }> = {};

  let totalCorrect = 0;
  const totalDrawn = answers.length;

  for (const ans of answers) {
    const skillId = questionSkillMap[ans.questionId];
    if (!skillId) continue;

    if (!counts[skillId]) {
      counts[skillId] = { correct: 0, total: 0 };
    }
    counts[skillId].total += 1;
    if (ans.correct) {
      counts[skillId].correct += 1;
      totalCorrect += 1;
    }
  }

  const perSkill: Record<string, SkillScoreSummary> = {};
  for (const [skillId, stats] of Object.entries(counts)) {
    const percent = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    perSkill[skillId] = {
      skillId,
      correct: stats.correct,
      total: stats.total,
      percent,
      isAssessed: stats.total >= MIN_QUESTIONS_PER_SKILL,
    };
  }

  const overallPercent = totalDrawn > 0 ? Math.round((totalCorrect / totalDrawn) * 100) : 0;

  return {
    perSkill,
    totalCorrect,
    totalDrawn,
    overallPercent,
  };
}

/**
 * Derives overall assessed proficiency level from average skill percentages.
 * Formula:
 *   averagePercent = sum(skillPercent) / count(assessedSkills)
 *   averagePercent < 40  -> "Beginner"
 *   40 <= averagePercent < 70 -> "Intermediate"
 *   averagePercent >= 70 -> "Advanced"
 *
 * @param skillPercentages Array of valid percentage scores (0 to 100)
 * @returns Assessed proficiency level string, or null if no assessed skills
 */
export function deriveAssessedLevel(
  skillPercentages: number[]
): 'Beginner' | 'Intermediate' | 'Advanced' | null {
  if (!skillPercentages || skillPercentages.length === 0) return null;

  const validScores = skillPercentages.filter((s) => typeof s === 'number' && !isNaN(s));
  if (validScores.length === 0) return null;

  const sum = validScores.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / validScores.length;

  if (avg < LEVEL_BANDS.BEGINNER_MAX) return 'Beginner';
  if (avg < LEVEL_BANDS.INTERMEDIATE_MAX) return 'Intermediate';
  return 'Advanced';
}
