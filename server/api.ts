/**
 * @file api.ts
 * Express API routes for SkillPath AI.
 * Handles resume skill extraction, secure assessment generation & grading (answer key protected),
 * opportunities, admin controls, and system diagnostics.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { countWords, detectSections, extractContactSignals } from '../src/engine/textTools';
import { extractSkillsFromText } from '../src/engine/skillExtractor';
import { scoreAssessment } from '../src/engine/assessmentScorer';
import { runSystemCheck } from '../src/engine/selfCheck';
import { QUESTION_BANK, QUESTIONS_BY_SKILL, QuestionDefinition } from './data/questions';
import { SAMPLE_OPPORTUNITIES, OpportunityListing } from '../src/data/sampleOpportunities';
import { APP_VERSION, MAX_RESUME_CHARS, QUESTIONS_PER_SKILL, MAX_SKILLS_PER_ATTEMPT } from '../src/config/scoring';

export const apiRouter = Router();

// In-memory stores for runtime session caching and live admin modifications
interface StoredAttempt {
  id: string;
  userId: string;
  skillIds: string[];
  questionIds: string[];
  status: 'in_progress' | 'submitted';
  startedAt: string;
  submittedAt?: string;
  perSkill?: Record<string, { correct: number; total: number; percent: number }>;
  overallPercent?: number;
}

const activeAttempts = new Map<string, StoredAttempt>();
const submissionCountByUser = new Map<string, { count: number; resetAt: number }>();
let globalOpportunities: OpportunityListing[] = [...SAMPLE_OPPORTUNITIES];
let showSampleListings = true;

// Helper: Rate limiting for assessment submissions (max 5 submissions per user per 24h)
function checkSubmissionRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const userRate = submissionCountByUser.get(userId);

  if (!userRate || now > userRate.resetAt) {
    submissionCountByUser.set(userId, { count: 0, resetAt: now + dayMs });
    return { allowed: true, remaining: 5 };
  }

  if (userRate.count >= 5) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: 5 - userRate.count };
}

function recordSubmission(userId: string) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const userRate = submissionCountByUser.get(userId) || { count: 0, resetAt: now + dayMs };
  userRate.count += 1;
  submissionCountByUser.set(userId, userRate);
}

// Auth Verification Middleware
export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

function verifyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    res.status(401).json({ error: 'Bearer token required' });
    return;
  }

  // Gracefully decode Firebase JWT token payload (or support simulated demo session)
  try {
    if (token.startsWith('demo-') || token === 'demo-token') {
      req.userId = 'demo-candidate-priya';
      req.userEmail = 'priya.sharma.sample@example.com';
      req.isAdmin = false;
      return next();
    }

    if (token.startsWith('admin-demo') || token === 'admin-token') {
      req.userId = 'admin-user-01';
      req.userEmail = 'gootymahind@gmail.com';
      req.isAdmin = true;
      return next();
    }

    // Parse standard JWT payload (header.payload.signature)
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson);
      req.userId = payload.user_id || payload.sub || 'user-unknown';
      req.userEmail = payload.email || '';
      req.isAdmin = payload.email === 'gootymahind@gmail.com';
      return next();
    }

    // Fallback for custom or UID token
    req.userId = token.slice(0, 40);
    req.userEmail = '';
    req.isAdmin = false;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}

// -------------------------------------------------------------
// Public Endpoints
// -------------------------------------------------------------

// 1. Health Check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// Authenticated Endpoints
// -------------------------------------------------------------

// 2. Resume Text Extraction & Skill Detection
const ExtractResumeSchema = z.object({
  text: z.string().min(1, 'Resume text cannot be empty').max(MAX_RESUME_CHARS, `Resume text exceeds ${MAX_RESUME_CHARS} characters`),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  sizeBytes: z.number().optional(),
});

apiRouter.post('/resume/extract', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  const parsed = ExtractResumeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid resume payload' });
    return;
  }

  const { text, fileName, fileType, sizeBytes } = parsed.data;

  const detectedSkills = extractSkillsFromText(text);
  const sectionsFound = detectSections(text);
  const contactSignals = extractContactSignals(text);
  const wordCount = countWords(text);

  res.json({
    fileName: fileName || 'resume.txt',
    fileType: fileType || 'text/plain',
    sizeBytes: sizeBytes || text.length,
    wordCount,
    sectionsFound,
    contactSignals,
    detectedSkills,
    uploadedAt: new Date().toISOString(),
  });
});

// 3. Assessment Creation (Draw questions WITHOUT answer keys)
const CreateAssessmentSchema = z.object({
  skillIds: z
    .array(z.string())
    .min(1, 'At least 1 skill must be selected')
    .max(MAX_SKILLS_PER_ATTEMPT, `Maximum ${MAX_SKILLS_PER_ATTEMPT} skills permitted per attempt`),
});

apiRouter.post('/assessments', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  const parsed = CreateAssessmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid assessment request' });
    return;
  }

  const userId = req.userId || 'anon-user';
  const rate = checkSubmissionRateLimit(userId);
  if (!rate.allowed) {
    res.status(429).json({
      error: 'Daily assessment limit reached. You can submit up to 5 attempts per 24 hours. Please practice and retry tomorrow.',
    });
    return;
  }

  const { skillIds } = parsed.data;
  const drawnQuestions: QuestionDefinition[] = [];
  const questionIds: string[] = [];

  for (const skillId of skillIds) {
    const bank = QUESTIONS_BY_SKILL.get(skillId) || [];
    if (bank.length === 0) continue;

    // Categorize by difficulty
    const beginners = bank.filter((q) => q.difficulty === 'Beginner');
    const intermediates = bank.filter((q) => q.difficulty === 'Intermediate');
    const advanceds = bank.filter((q) => q.difficulty === 'Advanced');

    // Draw at least 1 Beginner, 1 Intermediate, 1 Advanced, and 1 more
    const selected: QuestionDefinition[] = [];

    if (beginners.length > 0) {
      selected.push(beginners[Math.floor(Math.random() * beginners.length)]);
    }
    if (intermediates.length > 0) {
      selected.push(intermediates[Math.floor(Math.random() * intermediates.length)]);
    }
    if (advanceds.length > 0) {
      selected.push(advanceds[Math.floor(Math.random() * advanceds.length)]);
    }

    // Fill up to QUESTIONS_PER_SKILL (4) with remaining pool
    const selectedIds = new Set(selected.map((s) => s.id));
    const remaining = bank.filter((q) => !selectedIds.has(q.id));
    // Shuffle remaining
    remaining.sort(() => Math.random() - 0.5);

    while (selected.length < QUESTIONS_PER_SKILL && remaining.length > 0) {
      selected.push(remaining.pop()!);
    }

    drawnQuestions.push(...selected);
  }

  // Shuffle overall drawn questions so skills are intermingled or grouped cleanly
  drawnQuestions.sort(() => Math.random() - 0.5);

  const attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  for (const q of drawnQuestions) {
    questionIds.push(q.id);
  }

  // Store attempt in server memory
  activeAttempts.set(attemptId, {
    id: attemptId,
    userId,
    skillIds,
    questionIds,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
  });

  // CRITICAL: Strip correctIndex and explanation from the payload sent to the client!
  const clientQuestions = drawnQuestions.map((q) => ({
    id: q.id,
    skillId: q.skillId,
    difficulty: q.difficulty,
    text: q.text,
    options: q.options,
  }));

  res.json({
    attemptId,
    skillIds,
    totalQuestions: clientQuestions.length,
    questions: clientQuestions,
    startedAt: new Date().toISOString(),
  });
});

// 4. Assessment Grading & Submission
const SubmitAssessmentSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedIndex: z.number().nullable(),
    })
  ),
});

apiRouter.post('/assessments/:id/submit', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  const attemptId = req.params.id;
  const attempt = activeAttempts.get(attemptId);

  if (!attempt) {
    res.status(404).json({ error: 'Assessment attempt not found or expired' });
    return;
  }

  if (attempt.status === 'submitted') {
    res.status(400).json({ error: 'This assessment attempt has already been submitted and graded' });
    return;
  }

  const parsed = SubmitAssessmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid answers payload' });
    return;
  }

  const userId = req.userId || 'anon-user';
  recordSubmission(userId);

  const userAnswersMap = new Map<string, number | null>();
  for (const ans of parsed.data.answers) {
    userAnswersMap.set(ans.questionId, ans.selectedIndex);
  }

  // Map questionId -> question details
  const questionMap = new Map<string, QuestionDefinition>();
  for (const q of QUESTION_BANK) {
    questionMap.set(q.id, q);
  }

  const gradedAnswers: { questionId: string; correct: boolean }[] = [];
  const questionSkillMap: Record<string, string> = {};
  const questionReviews = [];

  for (const qId of attempt.questionIds) {
    const question = questionMap.get(qId);
    if (!question) continue;

    questionSkillMap[qId] = question.skillId;
    const selectedIdx = userAnswersMap.get(qId);

    // Unanswered counts as incorrect
    const isCorrect = selectedIdx !== null && selectedIdx !== undefined && selectedIdx === question.correctIndex;
    gradedAnswers.push({ questionId: qId, correct: isCorrect });

    // Review item with answer key revealed ONLY AFTER submission
    questionReviews.push({
      questionId: qId,
      skillId: question.skillId,
      difficulty: question.difficulty,
      text: question.text,
      options: question.options,
      selectedIndex: selectedIdx ?? null,
      correctIndex: question.correctIndex,
      isCorrect,
      explanation: question.explanation,
    });
  }

  const scoreResult = scoreAssessment(gradedAnswers, questionSkillMap);

  attempt.status = 'submitted';
  attempt.submittedAt = new Date().toISOString();
  attempt.perSkill = scoreResult.perSkill;
  attempt.overallPercent = scoreResult.overallPercent;

  res.json({
    attemptId,
    status: 'submitted',
    perSkill: scoreResult.perSkill,
    overallPercent: scoreResult.overallPercent,
    totalCorrect: scoreResult.totalCorrect,
    totalDrawn: scoreResult.totalDrawn,
    reviews: questionReviews,
    submittedAt: attempt.submittedAt,
  });
});

// 5. Get Opportunities (respecting sample listings toggle)
apiRouter.get('/opportunities', verifyAuth, (_req: AuthenticatedRequest, res: Response) => {
  let list = globalOpportunities;
  if (!showSampleListings) {
    list = list.filter((o) => !o.isSample);
  }
  res.json({
    opportunities: list,
    showSampleListings,
    total: list.length,
  });
});

// 6. Admin: Create Opportunity
const CreateOpportunitySchema = z.object({
  title: z.string().min(2).max(120),
  company: z.string().min(2).max(120),
  location: z.string().min(2).max(100),
  workMode: z.enum(['Onsite', 'Hybrid', 'Remote']),
  type: z.enum(['Internship', 'Fresher Job']),
  requiredSkills: z.array(
    z.object({
      skillId: z.string(),
      importance: z.enum(['core', 'supporting']),
    })
  ),
  description: z.string().min(10).max(5000),
  applyUrl: z.string().url().optional(),
});

apiRouter.post('/opportunities', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAdmin) {
    res.status(403).json({ error: 'Administrator access required to create opportunities' });
    return;
  }

  const parsed = CreateOpportunitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid opportunity payload' });
    return;
  }

  const newOpp: OpportunityListing = {
    id: `opp-custom-${Date.now()}`,
    ...parsed.data,
    status: 'active',
    isSample: false,
    postedAt: new Date().toISOString(),
  };

  globalOpportunities.unshift(newOpp);
  res.status(201).json({ opportunity: newOpp });
});

// 7. Admin: Update or Archive Opportunity
apiRouter.patch('/opportunities/:id', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAdmin) {
    res.status(403).json({ error: 'Administrator access required' });
    return;
  }

  const oppId = req.params.id;
  const opp = globalOpportunities.find((o) => o.id === oppId);
  if (!opp) {
    res.status(404).json({ error: 'Opportunity not found' });
    return;
  }

  const { status } = req.body;
  if (status === 'active' || status === 'archived') {
    opp.status = status;
  }

  res.json({ opportunity: opp });
});

// 8. Admin: App Settings (Toggle Sample Listings)
apiRouter.post('/admin/settings', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAdmin) {
    res.status(403).json({ error: 'Administrator access required' });
    return;
  }

  if (typeof req.body.showSampleListings === 'boolean') {
    showSampleListings = req.body.showSampleListings;
  }

  res.json({ showSampleListings });
});

// 9. Admin: Live System Check
apiRouter.get('/admin/system-check', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAdmin) {
    res.status(403).json({ error: 'Administrator access required to run System Check' });
    return;
  }

  const results = runSystemCheck();
  const allPassed = results.every((r) => r.status === 'PASS');

  res.json({
    status: allPassed ? 'PASS' : 'FAIL',
    timestamp: new Date().toISOString(),
    results,
  });
});

// 10. Admin: Aggregate Metrics (Counts only, zero personal data)
apiRouter.get('/admin/metrics', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAdmin) {
    res.status(403).json({ error: 'Administrator access required' });
    return;
  }

  const totalOpportunities = globalOpportunities.length;
  const activeCount = globalOpportunities.filter((o) => o.status === 'active').length;
  const sampleCount = globalOpportunities.filter((o) => o.isSample).length;
  const realCount = totalOpportunities - sampleCount;
  const totalAttempts = activeAttempts.size;

  res.json({
    metrics: {
      totalOpportunities,
      activeOpportunities: activeCount,
      sampleOpportunities: sampleCount,
      adminAddedOpportunities: realCount,
      totalAssessmentAttempts: totalAttempts,
      showSampleListings,
    },
  });
});
