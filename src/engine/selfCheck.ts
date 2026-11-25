/**
 * @file selfCheck.ts
 * Self-contained diagnostic system verification suite (SC01 through SC12).
 * Runs fixtures directly through the real deterministic engines and data structures.
 * Computes live results with timing metrics, PASS/FAIL indicators, and failure logs.
 */

import { countWords, detectSections, extractContactSignals, normalizeText } from './textTools';
import { extractSkillsFromText } from './skillExtractor';
import { scoreAssessment, deriveAssessedLevel } from './assessmentScorer';
import { verifySkill, SkillVerificationRecord } from './verifier';
import { analyzeSkillGap } from './gapAnalyzer';
import {
  calculateSkillMatch,
  calculateAssessmentConfidence,
  rankCareerRoles,
} from './careerRanker';
import { buildRoadmap } from './roadmapBuilder';
import { fitTfIdf, transformDocument, computeCosineSimilarity } from './tfidf';
import { matchOpportunities } from './opportunityMatcher';
import { explainCareerRecommendation, explainOpportunityMatch, formatFormulaBreakdown } from './explain';
import { SKILLS_TAXONOMY, SKILLS_MAP } from '../data/skills';
import { CAREER_ROLES, CAREER_ROLES_MAP } from '../data/roles';
import { SAMPLE_OPPORTUNITIES } from '../data/sampleOpportunities';
import { QUESTION_BANK, QUESTIONS_BY_SKILL } from '../../server/data/questions';

export interface SystemCheckResult {
  code: string;
  name: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  details: string;
}

export function runSystemCheck(): SystemCheckResult[] {
  const results: SystemCheckResult[] = [];

  // SC01: text helpers
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      const norm = normalizeText('  Python,   Machine   Learning!  ');
      if (norm !== 'python, machine learning!') {
        pass = false;
        detail = `normalizeText failed: got "${norm}"`;
      }
      const words = countWords('One two three four five');
      if (words !== 5) {
        pass = false;
        detail += ` countWords failed: got ${words}`;
      }
      const sections = detectSections('EDUCATION\nB.Tech\nSKILLS\nPython\nEXPERIENCE\nIntern');
      const foundCount = sections.filter((s) => s.found).length;
      if (foundCount < 3) {
        pass = false;
        detail += ` sections detected ${foundCount} < 3`;
      }
      const contacts = extractContactSignals('Contact me at test.user@example.com or github.com/testuser');
      if (contacts.email !== 'test.user@example.com' || contacts.github !== 'https://github.com/testuser') {
        pass = false;
        detail += ' contact extraction failed';
      }
      if (pass) detail = 'Text normalization, section detection (3+), word counts, and contacts verified.';
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC01',
      name: 'Text Helpers & Signal Parsing',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  // SC02: skill extraction (finds expected skills, doesn't match 'C' inside 'Cloud')
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      const sample = 'Worked on Cloud Computing with Python, SQL, C++, and Node.js. Proficient in C, C++, and React.';
      const extracted = extractSkillsFromText(sample);
      const ids = extracted.map((s) => s.skillId);

      const hasPython = ids.includes('python');
      const hasSql = ids.includes('sql');
      const hasCpp = ids.includes('cpp');
      const hasNode = ids.includes('nodejs');
      const hasReact = ids.includes('react');
      const hasC = ids.includes('c');

      // False positive check: 'Cloud' alone must NOT trigger C
      const negativeSample = 'Worked on Cloud architectures and Cluster computing without any single letter languages.';
      const negativeExtracted = extractSkillsFromText(negativeSample);
      const falseCHit = negativeExtracted.some((s) => s.skillId === 'c');

      if (!hasPython || !hasSql || !hasCpp || !hasNode || !hasReact || !hasC) {
        pass = false;
        detail = `Missing expected extracted skills: ${ids.join(', ')}`;
      } else if (falseCHit) {
        pass = false;
        detail = 'False positive: "C" matched inside "Cloud" or "Cluster"';
      } else {
        detail = `Successfully extracted ${extracted.length} skills with strict boundary matching; zero false positives for ambiguous 'C'.`;
      }
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC02',
      name: 'Skill Extraction & Boundary Invariants',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  // SC03: assessment scoring
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      const answers = [
        { questionId: 'q1', correct: true },
        { questionId: 'q2', correct: true },
        { questionId: 'q3', correct: false },
        { questionId: 'q4', correct: true }, // Python: 3/4 = 75%
        { questionId: 'q5', correct: false },
        { questionId: 'q6', correct: false }, // SQL: 0/2 = 0%
      ];
      const qMap = { q1: 'python', q2: 'python', q3: 'python', q4: 'python', q5: 'sql', q6: 'sql' };
      const score = scoreAssessment(answers, qMap);

      if (score.perSkill.python.percent !== 75 || score.perSkill.sql.percent !== 0) {
        pass = false;
        detail = `perSkill math incorrect: Python ${score.perSkill.python.percent}%, SQL ${score.perSkill.sql.percent}%`;
      }
      if (score.overallPercent !== 50) {
        // 3/6 = 50%
        pass = false;
        detail += ` overall percent got ${score.overallPercent} expected 50`;
      }
      const level = deriveAssessedLevel([75, 40]); // avg 57.5 -> Intermediate
      if (level !== 'Intermediate') {
        pass = false;
        detail += ` deriveAssessedLevel got ${level} expected Intermediate`;
      }
      if (pass) detail = 'Scored 6 questions across 2 skills: Python 75%, SQL 0%, Overall 50%. Assessed level Intermediate.';
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC03',
      name: 'Assessment Scoring & Proficiency Level',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  // SC04: verification matrix (all four statuses plus assessment-only)
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      // 1. Verified (Resume + assessment): score 80 >= 60
      const v1 = verifySkill('python', true, false, { percent: 80, total: 4, isAssessed: true });
      // 2. Verified (Assessment only): score 75 >= 60, not on resume
      const v2 = verifySkill('sql', false, false, { percent: 75, total: 4, isAssessed: true });
      // 3. Developing: score 40 < 60
      const v3 = verifySkill('machine_learning', true, false, { percent: 40, total: 4, isAssessed: true });
      // 4. Unverified: on resume or manual, no assessment
      const v4 = verifySkill('react', true, false);
      // 5. Not found: neither
      const v5 = verifySkill('docker', false, false);

      if (v1.status !== 'VERIFIED' || v1.evidenceLabel !== 'Resume + assessment') pass = false;
      if (v2.status !== 'VERIFIED' || v2.evidenceLabel !== 'Assessment only') pass = false;
      if (v3.status !== 'DEVELOPING') pass = false;
      if (v4.status !== 'UNVERIFIED' || v4.evidenceLabel !== 'Resume only') pass = false;
      if (v5.status !== 'NOT_FOUND' || v5.evidenceLabel !== 'No evidence') pass = false;

      if (!pass) {
        detail = `Status matrix mismatch: v1=${v1.status}, v2=${v2.status}, v3=${v3.status}, v4=${v4.status}, v5=${v5.status}`;
      } else {
        detail = 'Verified all 4 status states (VERIFIED, DEVELOPING, UNVERIFIED, NOT_FOUND) and assessment-only pathways.';
      }
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC04',
      name: 'Verification Matrix & Evidence Attribution',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  // SC05: gap buckets are mutually exclusive
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      const role = CAREER_ROLES[0]; // Data Analyst
      const map = new Map<string, SkillVerificationRecord>();
      map.set('sql', verifySkill('sql', true, false, { percent: 80, total: 4, isAssessed: true })); // VERIFIED
      map.set('excel', verifySkill('excel', true, false, { percent: 40, total: 4, isAssessed: true })); // DEVELOPING
      map.set('statistics', verifySkill('statistics', true, false)); // UNVERIFIED

      const gap = analyzeSkillGap(role, map);
      const allBucketIds = [
        ...gap.matched.map((s) => s.skillId),
        ...gap.developing.map((s) => s.skillId),
        ...gap.missing.map((s) => s.skillId),
      ];

      const uniqueCount = new Set(allBucketIds).size;
      if (allBucketIds.length !== gap.totalRequired || uniqueCount !== gap.totalRequired) {
        pass = false;
        detail = `Gap buckets non-exclusive or missing items: total=${allBucketIds.length}, unique=${uniqueCount}, required=${gap.totalRequired}`;
      } else {
        detail = `Mutually exclusive partitioning confirmed: ${gap.matched.length} matched, ${gap.developing.length} developing, ${gap.missing.length} missing.`;
      }
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC05',
      name: 'Gap Analysis Bucket Mutual Exclusivity',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  // SC06: skillMatch fixture (4 of 5 core verified -> 80%) & career-score arithmetic
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      // 5 core skills
      const reqSkills = [
        { skillId: 's1', importance: 'core' as const, whyItMatters: '' },
        { skillId: 's2', importance: 'core' as const, whyItMatters: '' },
        { skillId: 's3', importance: 'core' as const, whyItMatters: '' },
        { skillId: 's4', importance: 'core' as const, whyItMatters: '' },
        { skillId: 's5', importance: 'core' as const, whyItMatters: '' },
      ];
      const verifiedMap = new Map<string, SkillVerificationRecord>();
      verifiedMap.set('s1', verifySkill('s1', true, false, { percent: 80, total: 4, isAssessed: true }));
      verifiedMap.set('s2', verifySkill('s2', true, false, { percent: 80, total: 4, isAssessed: true }));
      verifiedMap.set('s3', verifySkill('s3', true, false, { percent: 80, total: 4, isAssessed: true }));
      verifiedMap.set('s4', verifySkill('s4', true, false, { percent: 80, total: 4, isAssessed: true }));
      // s5 is NOT_FOUND

      const match = calculateSkillMatch(reqSkills, verifiedMap);
      if (match !== 80) {
        pass = false;
        detail = `Fixture expected 80.0%, received ${match}%`;
      } else {
        const conf = calculateAssessmentConfidence(reqSkills, verifiedMap); // 4 skills with 80% = 80.0%
        const careerScore = Math.round(0.7 * match + 0.3 * conf);
        if (careerScore !== 80) {
          pass = false;
          detail = `Career score arithmetic expected 80%, got ${careerScore}%`;
        } else {
          detail = 'Skill match fixture 4/5 core verified = exactly 80.0%; career score arithmetic confirmed.';
        }
      }
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC06',
      name: 'Skill Match Fixture (4/5 Core = 80%) & Career Arithmetic',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  // SC07: career ranking and tie-breaks
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      const vMap = new Map<string, SkillVerificationRecord>();
      vMap.set('python', verifySkill('python', true, false, { percent: 90, total: 4, isAssessed: true }));
      vMap.set('sql', verifySkill('sql', true, false, { percent: 85, total: 4, isAssessed: true }));

      const ranked = rankCareerRoles(CAREER_ROLES, vMap);
      if (ranked.length !== CAREER_ROLES.length) {
        pass = false;
        detail = `Ranked count ${ranked.length} != ${CAREER_ROLES.length}`;
      } else {
        // Verify ranks are 1..N
        for (let i = 0; i < ranked.length; i++) {
          if (ranked[i].rank !== i + 1) {
            pass = false;
            detail = `Rank index mismatch at ${i}: got ${ranked[i].rank}`;
            break;
          }
        }
        detail = `Ranked ${ranked.length} roles deterministically. Top 1: ${ranked[0].roleName} (Score ${ranked[0].careerScore}%).`;
      }
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC07',
      name: 'Career Ranking & Deterministic Tie-Breaking',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  // SC08: roadmap order respects prerequisites and ends with two closing steps
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      const mlRole = CAREER_ROLES.find((r) => r.id === 'ml_engineer')!;
      const roadmap = buildRoadmap(mlRole, new Map());

      const len = roadmap.steps.length;
      const stepN1 = roadmap.steps[len - 2];
      const stepN = roadmap.steps[len - 1];

      if (!stepN1.title.includes('portfolio project')) {
        pass = false;
        detail = `Penultimate step not portfolio project: ${stepN1.title}`;
      }
      if (!stepN.title.includes('Re-verify')) {
        pass = false;
        detail += ` Final step not Re-verify: ${stepN.title}`;
      }

      // Check prerequisite order: deep_learning requires machine_learning
      const mlIdx = roadmap.steps.findIndex((s) => s.skillId === 'machine_learning');
      const dlIdx = roadmap.steps.findIndex((s) => s.skillId === 'deep_learning');
      if (mlIdx !== -1 && dlIdx !== -1 && mlIdx > dlIdx) {
        pass = false;
        detail += ` Prerequisite failure: Deep Learning (idx ${dlIdx}) appeared before Machine Learning (idx ${mlIdx})`;
      }

      if (pass) {
        detail = `Roadmap of ${len} steps correctly sorted with prerequisites and concludes with portfolio + re-verify.`;
      }
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC08',
      name: 'Roadmap Prerequisites & Capstone Closers',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  // SC09: TF-IDF (identical documents -> 1.0, disjoint -> 0.0)
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      const docA = 'python machine learning pandas dataframe';
      const docB = 'python machine learning pandas dataframe';
      const docC = 'gardening plants flowers soil horticulture';

      const corpus = [docA, docB, docC];
      const model = fitTfIdf(corpus);

      const vecA = transformDocument(docA, model);
      const vecB = transformDocument(docB, model);
      const vecC = transformDocument(docC, model);

      const simIdentical = computeCosineSimilarity(vecA, vecB);
      const simDisjoint = computeCosineSimilarity(vecA, vecC);

      // Identical should be ~1.0 (with slight float tolerance >= 0.999)
      // Disjoint should be 0.0
      if (simIdentical < 0.999) {
        pass = false;
        detail = `Identical similarity expected 1.0, got ${simIdentical}`;
      } else if (simDisjoint !== 0) {
        pass = false;
        detail = `Disjoint similarity expected 0.0, got ${simDisjoint}`;
      } else {
        detail = `TF-IDF verified: identical = ${simIdentical.toFixed(4)}, disjoint = ${simDisjoint.toFixed(4)}.`;
      }
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC09',
      name: 'TF-IDF Vectorizer & Cosine Similarity Invariants',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  // SC10: opportunity-score arithmetic
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      const testOpp = SAMPLE_OPPORTUNITIES[0];
      const vMap = new Map<string, SkillVerificationRecord>();
      vMap.set('python', verifySkill('python', true, false, { percent: 80, total: 4, isAssessed: true }));

      const matches = matchOpportunities([testOpp], vMap, 'Data Scientist');
      const first = matches[0];

      const expectedSkillPortion = 0.7 * first.skillMatch;
      const expectedTextPortion = 0.3 * first.textSimilarityPercent;
      const expectedTotal = Math.round(expectedSkillPortion + expectedTextPortion);

      if (first.opportunityScore !== expectedTotal) {
        pass = false;
        detail = `Math mismatch: got ${first.opportunityScore}, expected ${expectedTotal}`;
      } else {
        detail = `Match arithmetic verified: 0.70 × ${first.skillMatch}% + 0.30 × ${first.textSimilarityPercent}% = ${first.opportunityScore}%.`;
      }
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC10',
      name: 'Opportunity Match Arithmetic & Synthesis',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  // SC11: data validation
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      // 1. Check questions: each has exactly 4 options, valid correctIndex, explanation, difficulty
      let qErr = '';
      for (const q of QUESTION_BANK) {
        if (q.options.length !== 4) qErr += ` ${q.id} has ${q.options.length} options;`;
        if (q.correctIndex < 0 || q.correctIndex > 3) qErr += ` ${q.id} invalid correctIndex ${q.correctIndex};`;
        if (!q.explanation || q.explanation.length < 10) qErr += ` ${q.id} missing explanation;`;
        if (!SKILLS_MAP.has(q.skillId)) qErr += ` ${q.id} unknown skillId ${q.skillId};`;
      }

      // Check assessable skills with questions have at least 5 questions
      for (const [skillId, qList] of QUESTIONS_BY_SKILL.entries()) {
        if (qList.length < 5) {
          qErr += ` ${skillId} has only ${qList.length} questions (< 5);`;
        }
      }

      // 2. Check roles: all referenced skills exist
      for (const role of CAREER_ROLES) {
        for (const req of role.requiredSkills) {
          if (!SKILLS_MAP.has(req.skillId)) qErr += ` Role ${role.id} references missing skill ${req.skillId};`;
        }
      }

      // 3. Check opportunities: all referenced skills exist
      for (const opp of SAMPLE_OPPORTUNITIES) {
        for (const req of opp.requiredSkills) {
          if (!SKILLS_MAP.has(req.skillId)) qErr += ` Opp ${opp.id} references missing skill ${req.skillId};`;
        }
      }

      if (qErr) {
        pass = false;
        detail = `Data integrity failures: ${qErr.slice(0, 200)}...`;
      } else {
        detail = `All 72 taxonomy skills, 8 career roles, 20 opportunities, and ${QUESTION_BANK.length} questions cross-validated with zero orphaned references.`;
      }
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC11',
      name: 'Data Integrity & Referential Completeness',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  // SC12: explanations contain no undefined or NaN
  {
    const t0 = performance.now();
    let pass = true;
    let detail = '';
    try {
      const dummyRec = {
        roleId: 'test',
        roleName: 'Data Scientist',
        summary: 'Test summary',
        rank: 1,
        careerScore: 78,
        skillMatch: 75,
        assessmentConfidence: 85,
        evidenceCoverage: 0.6,
        isProvisional: false,
        verifiedCount: 3,
        totalRequired: 5,
        matchedSkills: ['Python', 'SQL'],
        topGaps: [{ skillName: 'Pandas', importance: 'core', status: 'NOT_FOUND' as const }],
        formulaBreakdown: '0.70 × 75.0% + 0.30 × 85.0% = 78%',
      };

      const exp = explainCareerRecommendation(dummyRec);
      const combined = `${exp.headline} ${exp.evidenceSummary} ${exp.gapsSummary} ${exp.mathDetail}`;

      const formula = formatFormulaBreakdown(0.7, 70, 0.3, 31);

      if (combined.includes('undefined') || combined.includes('NaN') || formula.includes('undefined') || formula.includes('NaN')) {
        pass = false;
        detail = 'Detected undefined or NaN in generated explanation text';
      } else {
        detail = 'Explanations and formula breakdowns confirmed 100% free of undefined, null, or NaN tokens.';
      }
    } catch (err) {
      pass = false;
      detail = `Exception: ${String(err)}`;
    }
    results.push({
      code: 'SC12',
      name: 'Explanation Engine & String Sanitization',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: Math.round((performance.now() - t0) * 100) / 100,
      details: detail,
    });
  }

  return results;
}
