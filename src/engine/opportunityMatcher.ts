/**
 * @file opportunityMatcher.ts
 * Pure deterministic internship and job opportunity matching engine.
 * Combines weighted skill match (70%) and TF-IDF document cosine similarity (30%).
 */

import { OPPORTUNITY_WEIGHTS, SkillStatus, IMPORTANCE_WEIGHT, STATUS_CREDIT } from '../config/scoring';
import { OpportunityListing } from '../data/sampleOpportunities';
import { SkillVerificationRecord } from './verifier';
import { SKILLS_MAP } from '../data/skills';
import { fitTfIdf, transformDocument, computeCosineSimilarity } from './tfidf';

export interface OpportunityMatchResult {
  opportunity: OpportunityListing;
  opportunityScore: number; // 0 - 100
  skillMatch: number;        // 0 - 100
  textSimilarity: number;    // 0 - 1 (or 0 - 100 display)
  textSimilarityPercent: number; // 0 - 100
  matchedSkills: string[];
  missingSkills: { skillName: string; status: SkillStatus }[];
  verifiedCount: number;
  developingCount: number;
  notFoundCount: number;
  totalRequired: number;
  whyThisMatch: string;
}

/**
 * Builds the candidate document representation for TF-IDF.
 * Formula:
 *   VERIFIED skill names × 2
 *   DEVELOPING skill names × 1
 *   Target role title × 1
 *
 * @param verifiedSkillsMap Map of candidate verified skill records
 * @param targetRoleTitle Optional title of user's chosen target role
 * @returns Candidate document string
 */
export function buildCandidateDocument(
  verifiedSkillsMap: Map<string, SkillVerificationRecord>,
  targetRoleTitle?: string
): string {
  const parts: string[] = [];

  if (targetRoleTitle) {
    parts.push(targetRoleTitle);
  }

  for (const record of verifiedSkillsMap.values()) {
    if (record.status === 'VERIFIED') {
      // ×2 weighting
      parts.push(record.skillName, record.skillName);
    } else if (record.status === 'DEVELOPING') {
      // ×1 weighting
      parts.push(record.skillName);
    }
  }

  return parts.join(' ');
}

/**
 * Builds the opportunity document representation for TF-IDF.
 * Formula:
 *   Title × 2
 *   Required skill names × 2
 *   Description × 1
 *
 * @param opp Opportunity listing
 * @returns Opportunity document string
 */
export function buildOpportunityDocument(opp: OpportunityListing): string {
  const parts: string[] = [];

  // Title × 2
  parts.push(opp.title, opp.title);

  // Required skill names × 2
  for (const req of opp.requiredSkills) {
    const name = SKILLS_MAP.get(req.skillId)?.name || req.skillId;
    parts.push(name, name);
  }

  // Description
  parts.push(opp.description);

  return parts.join(' ');
}

/**
 * Computes skill match for an opportunity listing.
 * Uses shared formula: skillMatch = ( Σ(weight * credit) / Σ(weight) ) * 100
 *
 * @param opp Opportunity listing
 * @param verifiedSkillsMap Map of candidate verified skill records
 * @returns Object with score and skill status breakdowns
 */
export function computeOpportunitySkillMatch(
  opp: OpportunityListing,
  verifiedSkillsMap: Map<string, SkillVerificationRecord>
): {
  skillMatch: number;
  matchedSkills: string[];
  missingSkills: { skillName: string; status: SkillStatus }[];
  verifiedCount: number;
  developingCount: number;
  notFoundCount: number;
  totalRequired: number;
} {
  const totalRequired = opp.requiredSkills.length;
  if (totalRequired === 0) {
    return {
      skillMatch: 100,
      matchedSkills: [],
      missingSkills: [],
      verifiedCount: 0,
      developingCount: 0,
      notFoundCount: 0,
      totalRequired: 0,
    };
  }

  let totalWeight = 0;
  let weightedCreditSum = 0;
  let verifiedCount = 0;
  let developingCount = 0;
  let notFoundCount = 0;
  const matchedSkills: string[] = [];
  const missingSkills: { skillName: string; status: SkillStatus }[] = [];

  for (const req of opp.requiredSkills) {
    const weight = IMPORTANCE_WEIGHT[req.importance] || 1;
    totalWeight += weight;

    const record = verifiedSkillsMap.get(req.skillId);
    const status: SkillStatus = record ? record.status : 'NOT_FOUND';
    const credit = STATUS_CREDIT[status] ?? 0;
    const skillName = SKILLS_MAP.get(req.skillId)?.name || req.skillId;

    weightedCreditSum += weight * credit;

    if (status === 'VERIFIED') {
      verifiedCount++;
      matchedSkills.push(skillName);
    } else {
      if (status === 'DEVELOPING') {
        developingCount++;
      } else {
        notFoundCount++;
      }
      missingSkills.push({ skillName, status });
    }
  }

  const fraction = totalWeight > 0 ? weightedCreditSum / totalWeight : 0;
  const skillMatch = Math.round(fraction * 1000) / 10; // e.g. 70.0

  return {
    skillMatch,
    matchedSkills,
    missingSkills,
    verifiedCount,
    developingCount,
    notFoundCount,
    totalRequired,
  };
}

/**
 * Matches opportunities against a candidate's verified profile.
 * Formula:
 *   opportunityScore = 0.70 * skillMatch + 0.30 * textSimilarityPercent
 *   where textSimilarityPercent = textSimilarity * 100
 *
 * @param opportunities Active opportunity listings
 * @param verifiedSkillsMap Map of candidate verified skill records
 * @param targetRoleTitle Optional target role title
 * @returns Ranked matched opportunities with arithmetic explanations
 */
export function matchOpportunities(
  opportunities: OpportunityListing[],
  verifiedSkillsMap: Map<string, SkillVerificationRecord>,
  targetRoleTitle?: string
): OpportunityMatchResult[] {
  if (opportunities.length === 0) return [];

  // Build corpus: candidate document + all active opportunity documents
  const candidateDoc = buildCandidateDocument(verifiedSkillsMap, targetRoleTitle);
  const oppDocs = opportunities.map(buildOpportunityDocument);
  const corpus = [candidateDoc, ...oppDocs];

  // Fit TF-IDF model on corpus
  const tfidfModel = fitTfIdf(corpus);
  const candidateVector = transformDocument(candidateDoc, tfidfModel);

  const results: OpportunityMatchResult[] = [];

  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i];
    const oppVector = transformDocument(oppDocs[i], tfidfModel);
    const textSimilarity = computeCosineSimilarity(candidateVector, oppVector);
    const textSimilarityPercent = Math.round(textSimilarity * 100);

    const matchStats = computeOpportunitySkillMatch(opp, verifiedSkillsMap);
    const skillMatch = matchStats.skillMatch;

    // opportunityScore = 0.70 * skillMatch + 0.30 * textSimilarityPercent
    const skillPortion = OPPORTUNITY_WEIGHTS.skillMatch * skillMatch;
    const textPortion = OPPORTUNITY_WEIGHTS.textSimilarity * textSimilarityPercent;
    const finalScore = Math.round(skillPortion + textPortion);

    const whyThisMatch = `Skill match ${skillMatch}% (${matchStats.verifiedCount} verified, ${matchStats.developingCount} developing, ${matchStats.notFoundCount} not found of ${matchStats.totalRequired} required) → 0.70 × ${skillMatch} = ${skillPortion.toFixed(1)}; text similarity ${textSimilarityPercent}% → 0.30 × ${textSimilarityPercent} = ${textPortion.toFixed(1)}; final ${finalScore}%.`;

    results.push({
      opportunity: opp,
      opportunityScore: finalScore,
      skillMatch,
      textSimilarity,
      textSimilarityPercent,
      matchedSkills: matchStats.matchedSkills,
      missingSkills: matchStats.missingSkills,
      verifiedCount: matchStats.verifiedCount,
      developingCount: matchStats.developingCount,
      notFoundCount: matchStats.notFoundCount,
      totalRequired: matchStats.totalRequired,
      whyThisMatch,
    });
  }

  // Sort descending by opportunityScore
  results.sort((a, b) => b.opportunityScore - a.opportunityScore);

  return results;
}
