/**
 * @file AssessmentPage.tsx
 * Complete assessment module:
 * 1. Setup: skill selection (pre-selected from resume + target role), max 8 skills, time estimate.
 * 2. Player: sticky header, keyboard shortcuts (1-4, arrows), review flag, sessionStorage answers, confirmation modal.
 * 3. Results: overall ring, per-skill bars with 60% threshold, before/after status callouts, question review with explanations.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/common/Feedback';
import { ScoreRing, ScoreBar, SkillChip } from '../components/common/SharedComponents';
import { SKILLS_TAXONOMY, SkillDefinition } from '../data/skills';
import { CAREER_ROLES_MAP } from '../data/roles';
import { VERIFY_THRESHOLD, MAX_SKILLS_PER_ATTEMPT, QUESTIONS_PER_SKILL } from '../config/scoring';
import {
  Sparkles,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Flag,
  HelpCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface QuestionClient {
  id: string;
  skillId: string;
  difficulty: string;
  text: string;
  options: [string, string, string, string];
}

interface QuestionReview {
  questionId: string;
  skillId: string;
  difficulty: string;
  text: string;
  options: [string, string, string, string];
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export function AssessmentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, resume, recordAssessmentResult, verifiedSkillsMap } = useApp();
  const { showToast } = useToast();

  // Mode: 'setup' | 'playing' | 'results'
  const [mode, setMode] = useState<'setup' | 'playing' | 'results'>('setup');

  // Pre-selection logic: skills in resume + required skills of target role (assessable only)
  const assessableSkills = useMemo(() => {
    return SKILLS_TAXONOMY.filter((s) => s.assessable);
  }, []);

  const assessableIdsSet = useMemo(() => {
    return new Set(assessableSkills.map((s) => s.id));
  }, [assessableSkills]);

  // Selected skills for setup
  const [selectedSkills, setSelectedSkills] = useState<string[]>(() => {
    const preselected = location.state?.preselectedSkillId;
    if (preselected && assessableIdsSet.has(preselected)) {
      return [preselected];
    }

    const defaultIds: string[] = [];
    // 1. Resume skills
    if (resume) {
      for (const item of resume.detectedSkills) {
        if (!item.removedByUser && assessableIdsSet.has(item.skillId)) {
          if (!defaultIds.includes(item.skillId)) defaultIds.push(item.skillId);
        }
      }
    }
    // 2. Target role required skills
    const targetRole = CAREER_ROLES_MAP.get(profile.targetRoleId);
    if (targetRole) {
      for (const req of targetRole.requiredSkills) {
        if (assessableIdsSet.has(req.skillId) && !defaultIds.includes(req.skillId)) {
          defaultIds.push(req.skillId);
        }
      }
    }
    return defaultIds.slice(0, 4); // Default to first 4
  });

  // Player state
  const [attemptId, setAttemptId] = useState<string>('');
  const [questions, setQuestions] = useState<QuestionClient[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    try {
      const saved = sessionStorage.getItem('skillpath_current_answers');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Results state
  const [resultsData, setResultsData] = useState<{
    perSkill: Record<string, { correct: number; total: number; percent: number; isAssessed: boolean }>;
    overallPercent: number;
    totalCorrect: number;
    totalDrawn: number;
    reviews: QuestionReview[];
    beforeStatuses: Record<string, string>;
  } | null>(null);

  // Save answers to sessionStorage
  useEffect(() => {
    if (mode === 'playing') {
      sessionStorage.setItem('skillpath_current_answers', JSON.stringify(answers));
    }
  }, [answers, mode]);

  // Keyboard navigation shortcuts (1-4 for options, left/right for nav)
  useEffect(() => {
    if (mode !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal) return;

      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const optIdx = parseInt(e.key, 10) - 1;
        setAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }));
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentIndex, questions, showSubmitModal]);

  // Toggle skill selection in setup
  const toggleSkill = (id: string) => {
    if (selectedSkills.includes(id)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== id));
    } else {
      if (selectedSkills.length >= MAX_SKILLS_PER_ATTEMPT) {
        showToast(`Maximum ${MAX_SKILLS_PER_ATTEMPT} skills allowed per assessment attempt`, 'info');
        return;
      }
      setSelectedSkills([...selectedSkills, id]);
    }
  };

  // Launch assessment attempt via server API
  const handleStartAssessment = async () => {
    if (selectedSkills.length === 0) {
      showToast('Please select at least 1 skill to verify', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = 'demo-token'; // Authenticated token or demo header
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skillIds: selectedSkills }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to start assessment', 'error');
        return;
      }

      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setAnswers({});
      setFlagged(new Set());
      sessionStorage.removeItem('skillpath_current_answers');
      setMode('playing');
    } catch (err) {
      console.error(err);
      showToast('Error connecting to assessment server', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit attempt to server for grading
  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    setShowSubmitModal(false);

    // Snapshot before statuses
    const beforeStatuses: Record<string, string> = {};
    for (const skillId of selectedSkills) {
      const rec = verifiedSkillsMap.get(skillId);
      beforeStatuses[skillId] = rec ? rec.status : 'UNVERIFIED';
    }

    try {
      const token = 'demo-token';
      const payloadAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedIndex: answers[q.id] !== undefined ? answers[q.id] : null,
      }));

      const res = await fetch(`/api/assessments/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: payloadAnswers }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Submission error', 'error');
        return;
      }

      // Record in AppContext so all screens immediately react!
      recordAssessmentResult(data.perSkill);

      setResultsData({
        perSkill: data.perSkill,
        overallPercent: data.overallPercent,
        totalCorrect: data.totalCorrect,
        totalDrawn: data.totalDrawn,
        reviews: data.reviews,
        beforeStatuses,
      });

      sessionStorage.removeItem('skillpath_current_answers');
      setMode('results');
      showToast('Assessment submitted and verified!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to submit assessment to server', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unanswered count
  const unansweredCount = useMemo(() => {
    let count = 0;
    for (const q of questions) {
      if (answers[q.id] === undefined) count++;
    }
    return count;
  }, [questions, answers]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* MODE 1: SETUP */}
      {/* ------------------------------------------------------------- */}
      {mode === 'setup' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-main font-heading">Assessment Setup</h2>
              <p className="text-xs text-sub">
                Select up to {MAX_SKILLS_PER_ATTEMPT} skills to verify. Each skill draws {QUESTIONS_PER_SKILL} questions across Beginner, Intermediate, and Advanced difficulties.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-accent bg-raised px-3 py-1.5 rounded-xl border border-app shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>Est. {selectedSkills.length * 2} minutes</span>
            </div>
          </div>

          {/* Skill Selection Tiles */}
          <div className="card-elevated p-6 bg-surface border-app space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-app">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Select Skills ({selectedSkills.length} / {MAX_SKILLS_PER_ATTEMPT})
              </span>
              <span className="text-xs text-brand-accent font-medium">
                {selectedSkills.length * QUESTIONS_PER_SKILL} total questions
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {assessableSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill.id);
                const currentStatus = verifiedSkillsMap.get(skill.id)?.status || 'NOT_FOUND';

                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand bg-brand/10 dark:bg-brand/15 ring-1 ring-brand/30'
                        : 'border-app bg-raised hover:border-brand/40'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-main">{skill.name}</div>
                      <div className="text-[10px] text-muted">{skill.category}</div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-sub">
                        {currentStatus === 'VERIFIED' ? (
                          <span className="text-emerald-500 font-bold">✓ Verified</span>
                        ) : currentStatus === 'DEVELOPING' ? (
                          <span className="text-amber-500">Developing</span>
                        ) : (
                          <span className="text-muted">Unverified</span>
                        )}
                      </span>
                      <span className="text-xs font-bold text-brand-accent">
                        {isSelected ? '✓' : '+'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start CTA */}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={selectedSkills.length === 0 || isSubmitting}
              onClick={handleStartAssessment}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-white font-semibold text-xs hover:bg-brand-hover disabled:opacity-50 shadow-md transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Drawing questions...' : `Start Assessment (${selectedSkills.length} skills)`}</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 2: PLAYER */}
      {/* ------------------------------------------------------------- */}
      {mode === 'playing' && questions.length > 0 && (
        <div className="space-y-6">
          {/* Sticky Player Header */}
          <div className="card-elevated p-4 bg-surface border-app sticky top-18 z-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold font-mono text-brand-accent">
                Q {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-xs font-bold text-main px-2.5 py-0.5 rounded-full bg-raised border border-app uppercase">
                {questions[currentIndex].skillId.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-semibold text-muted px-2 py-0.5 rounded bg-raised border border-app">
                {questions[currentIndex].difficulty}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const qId = questions[currentIndex].id;
                  setFlagged((prev) => {
                    const next = new Set(prev);
                    if (next.has(qId)) next.delete(qId);
                    else next.add(qId);
                    return next;
                  });
                }}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  flagged.has(questions[currentIndex].id)
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : 'bg-raised text-sub border-app hover:text-main'
                }`}
                title="Flag for review"
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Review</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover shadow-sm"
              >
                Submit Attempt
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-raised rounded-full overflow-hidden border border-app">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="card-elevated p-6 sm:p-8 bg-surface border-app space-y-6">
            <h3 className="text-lg sm:text-xl font-bold text-main font-heading leading-snug">
              {questions[currentIndex].text}
            </h3>

            {/* Option Tiles (Keyboard 1 - 4) */}
            <div className="space-y-3">
              {questions[currentIndex].options.map((opt, optIdx) => {
                const currentAnswer = answers[questions[currentIndex].id];
                const isSelected = currentAnswer === optIdx;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => {
                      setAnswers((prev) => ({
                        ...prev,
                        [questions[currentIndex].id]: optIdx,
                      }));
                    }}
                    className={`w-full p-4 rounded-xl border text-left font-medium text-xs sm:text-sm flex items-start gap-3 transition-all ${
                      isSelected
                        ? 'border-brand bg-brand/10 dark:bg-brand/15 text-main ring-1 ring-brand/40 shadow-sm'
                        : 'border-app bg-raised hover:bg-surface text-sub hover:text-main'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
                        isSelected
                          ? 'bg-brand text-white border-brand'
                          : 'bg-surface text-muted border-app'
                      }`}
                    >
                      {optIdx + 1}
                    </span>
                    <span className="flex-1 leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-muted flex items-center gap-1.5 pt-2">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Keyboard hints: Press 1–4 to pick options, ← / → to navigate. Answers persist on refresh.</span>
            </div>
          </div>

          {/* Question Navigator Grid & Controls */}
          <div className="card-elevated p-4 bg-surface border-app flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="px-3 py-1.5 rounded-xl border border-app bg-raised text-sub hover:text-main disabled:opacity-30 text-xs font-semibold flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="px-3 py-1.5 rounded-xl border border-app bg-raised text-sub hover:text-main disabled:opacity-30 text-xs font-semibold flex items-center gap-1"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick navigator dots */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                const isFlag = flagged.has(q.id);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? 'ring-2 ring-brand bg-brand text-white'
                        : isFlag
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                        : isAnswered
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : 'bg-raised text-muted border border-app'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confirmation Submission Modal */}
          {showSubmitModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)} />
              <div className="relative w-full max-w-md bg-surface border border-app rounded-2xl p-6 shadow-2xl space-y-4 z-10 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-main">Ready to Submit?</h3>
                    <p className="text-xs text-sub">
                      {unansweredCount > 0 ? (
                        <span className="text-amber-500 font-semibold">
                          You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}. Unanswered questions count as incorrect.
                        </span>
                      ) : (
                        'All questions answered. Ready to verify scores.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-xl border border-app text-xs font-semibold text-sub hover:bg-raised"
                  >
                    Return to Questions
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitAssessment}
                    className="px-5 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover shadow-sm"
                  >
                    {isSubmitting ? 'Grading on server...' : 'Submit & Grade'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 3: RESULTS */}
      {/* ------------------------------------------------------------- */}
      {mode === 'results' && resultsData && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-main font-heading">Assessment Results</h2>
              <p className="text-xs text-sub">
                Server grading complete. Review score breakdowns, status transitions, and answer explanations below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode('setup')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-app bg-surface text-brand-accent hover:bg-raised text-xs font-semibold transition-colors shrink-0 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Verify More Skills</span>
            </button>
          </div>

          {/* Overall Score & Status Changes Callout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 card-elevated p-6 bg-surface border-app flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Overall Attempt Score</span>
              <ScoreRing score={resultsData.overallPercent} size={112} strokeWidth={10} />
              <div className="text-xs text-sub">
                {resultsData.totalCorrect} of {resultsData.totalDrawn} questions correct
              </div>
            </div>

            {/* Status Transitions Callout */}
            <div className="md:col-span-8 card-elevated p-6 bg-surface border-app space-y-4">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Verification Status Changes</span>
              <div className="space-y-3">
                {Object.entries(resultsData.perSkill).map(([skillId, stat]) => {
                  const isVerified = stat.percent >= VERIFY_THRESHOLD;
                  const before = resultsData.beforeStatuses[skillId] || 'UNVERIFIED';
                  const after = isVerified ? 'VERIFIED' : 'DEVELOPING';

                  return (
                    <div
                      key={skillId}
                      className="p-3.5 rounded-xl bg-raised border border-app flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-sm text-main capitalize">{skillId.replace('_', ' ')}</div>
                        <div className="text-xs text-sub flex items-center gap-1.5 mt-0.5">
                          <span>{before}</span>
                          <span>→</span>
                          <strong className={isVerified ? 'text-emerald-500' : 'text-amber-500'}>
                            {after}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-28">
                          <ScoreBar score={stat.percent} threshold={VERIFY_THRESHOLD} />
                        </div>
                        <span className="text-xs font-bold text-main tabular-nums">{stat.percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question-by-Question Review with Explanations */}
          <div className="card-elevated p-6 bg-surface border-app space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-app">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-accent" />
                <h3 className="text-sm font-bold text-main">Full Question Review & Explanations</h3>
              </div>
              <span className="text-xs text-muted">{resultsData.reviews.length} questions</span>
            </div>

            <div className="space-y-4">
              {resultsData.reviews.map((rev, idx) => (
                <div
                  key={rev.questionId}
                  className={`p-4 rounded-xl border text-xs space-y-3 ${
                    rev.isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-main">Question {idx + 1} ({rev.difficulty})</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        rev.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {rev.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-main">{rev.text}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rev.options.map((opt, oIdx) => {
                      const isChosen = rev.selectedIndex === oIdx;
                      const isKey = rev.correctIndex === oIdx;

                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                            isKey
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold'
                              : isChosen && !isKey
                              ? 'border-red-500/40 bg-red-500/10 text-red-300'
                              : 'border-app bg-raised text-sub'
                          }`}
                        >
                          <span>{opt}</span>
                          {isKey && <span className="text-[10px] font-bold">Key Answer</span>}
                          {isChosen && !isKey && <span className="text-[10px] font-bold">Your Choice</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Plain-language explanation */}
                  <div className="pt-2 border-t border-app/40 text-sub leading-relaxed">
                    <strong className="text-main">Explanation: </strong>
                    {rev.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
