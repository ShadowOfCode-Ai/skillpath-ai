/**
 * @file explain.ts
 * Pure deterministic explanation builder.
 * Generates human-readable, math-transparent justification copy from real data.
 * Invariant: Never outputs undefined or NaN; cleanly handles empty sets.
 */

import { CareerRecommendation } from './careerRanker';
import { OpportunityMatchResult } from './opportunityMatcher';
import { SkillVerificationRecord } from './verifier';

/**
 * Builds explanation copy for a career recommendation.
 * @param rec Career recommendation result
 * @returns Multi-sentence plain-language rationale
 */
export function explainCareerRecommendation(rec: CareerRecommendation): {
  headline: string;
  evidenceSummary: string;
  gapsSummary: string;
  mathDetail: string;
} {
  const verifiedCount = rec.verifiedCount || 0;
  const totalRequired = rec.totalRequired || 0;
  const coveragePct = Math.round((rec.evidenceCoverage || 0) * 100);

  const headline = `${rec.roleName} matches ${rec.skillMatch}% of required skills with ${rec.careerScore}% overall career fit.`;

  let evidenceSummary = '';
  if (rec.matchedSkills.length > 0) {
    evidenceSummary = `Demonstrated verified proficiency in ${rec.matchedSkills.join(', ')} (${verifiedCount} of ${totalRequired} required skills). Assessment confidence is ${rec.assessmentConfidence}%.`;
  } else {
    evidenceSummary = `No skills for this role have been verified yet. Complete an assessment to demonstrate competence across the ${totalRequired} required skills.`;
  }

  let gapsSummary = '';
  if (rec.topGaps.length > 0) {
    const gapNames = rec.topGaps.map((g) => `${g.skillName} (${g.status.toLowerCase().replace('_', ' ')})`).join(' and ');
    gapsSummary = `Priority development areas: ${gapNames}.`;
  } else {
    gapsSummary = 'All required competencies for this career role are currently satisfied.';
  }

  let mathDetail = rec.formulaBreakdown;
  if (rec.isProvisional) {
    mathDetail += ` (Provisional: only ${coveragePct}% of required skills have assessment evidence. Target at least 40%.)`;
  }

  return {
    headline,
    evidenceSummary,
    gapsSummary,
    mathDetail,
  };
}

/**
 * Builds explanation copy for an opportunity match.
 * @param match Opportunity match result
 * @returns Human-readable justification with formula details
 */
export function explainOpportunityMatch(match: OpportunityMatchResult): {
  summary: string;
  skillsBreakdown: string;
  mathExplanation: string;
} {
  const opp = match.opportunity;
  const summary = `${opp.type} at ${opp.company}: ${match.opportunityScore}% composite alignment based on skills and description profile.`;

  let skillsBreakdown = '';
  if (match.matchedSkills.length > 0) {
    skillsBreakdown = `Matched skills: ${match.matchedSkills.join(', ')}.`;
  } else {
    skillsBreakdown = 'No required skills currently verified.';
  }

  if (match.missingSkills.length > 0) {
    const missingNames = match.missingSkills.slice(0, 3).map((m) => m.skillName).join(', ');
    skillsBreakdown += ` Missing: ${missingNames}.`;
  }

  return {
    summary,
    skillsBreakdown,
    mathExplanation: match.whyThisMatch,
  };
}

/**
 * Formats a score breakdown into a monospace formula string.
 * @param weight1 First component weight (e.g. 0.70)
 * @param val1 First score value (0 - 100)
 * @param weight2 Second component weight (e.g. 0.30)
 * @param val2 Second score value (0 - 100)
 * @returns Safe formatted formula string (e.g., "0.70 × 70.0% + 0.30 × 31.0% = 58%")
 */
export function formatFormulaBreakdown(
  weight1: number,
  val1: number,
  weight2: number,
  val2: number
): string {
  const safeVal1 = isNaN(val1) ? 0 : val1;
  const safeVal2 = isNaN(val2) ? 0 : val2;
  const total = Math.round(weight1 * safeVal1 + weight2 * safeVal2);
  return `${weight1.toFixed(2)} × ${safeVal1.toFixed(1)}% + ${weight2.toFixed(2)} × ${safeVal2.toFixed(1)}% = ${total}%`;
}
