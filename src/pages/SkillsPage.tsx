/**
 * @file SkillsPage.tsx
 * The "Skill Passport" view.
 * Displays summary strip, status tabs, category filters, resume evidence snippets,
 * mini score bars with 60% ticks, status chips, verify/retake actions, and expandable rationales.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SkillChip, ScoreBar } from '../components/common/SharedComponents';
import { SkillStatus, VERIFY_THRESHOLD } from '../config/scoring';
import { SkillCategory } from '../data/skills';
import {
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  Filter,
} from 'lucide-react';

export function SkillsPage() {
  const navigate = useNavigate();
  const { verifiedSkillsList } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | SkillStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  // Summary counts
  const verifiedCount = verifiedSkillsList.filter((s) => s.status === 'VERIFIED').length;
  const developingCount = verifiedSkillsList.filter((s) => s.status === 'DEVELOPING').length;
  const unverifiedCount = verifiedSkillsList.filter((s) => s.status === 'UNVERIFIED').length;
  const totalCount = verifiedSkillsList.length;

  // Filtered skills list
  const filteredSkills = useMemo(() => {
    return verifiedSkillsList.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.skillName.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory) return false;
      }
      return true;
    });
  }, [verifiedSkillsList, statusFilter, categoryFilter, searchQuery]);

  // Categories list
  const categories: SkillCategory[] = [
    'Programming',
    'Data',
    'AI/ML',
    'NLP',
    'Web',
    'Databases',
    'Tools & Cloud',
    'Professional',
  ];

  const handleAction = (skillId: string) => {
    navigate('/assessment', { state: { preselectedSkillId: skillId } });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-main font-heading">Skill Passport</h2>
        <p className="text-xs text-sub">
          Your verified credentials and claimed competencies grounded in objective assessment and resume evidence.
        </p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-elevated p-4 bg-surface border-app">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Tracked</span>
          <div className="text-2xl font-extrabold text-main tabular-nums mt-1">{totalCount}</div>
        </div>
        <div className="card-elevated p-4 bg-emerald-500/5 border-emerald-500/20">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Verified (≥60%)</span>
          <div className="text-2xl font-extrabold text-emerald-500 tabular-nums mt-1">{verifiedCount}</div>
        </div>
        <div className="card-elevated p-4 bg-amber-500/5 border-amber-500/20">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Developing (&lt;60%)</span>
          <div className="text-2xl font-extrabold text-amber-500 tabular-nums mt-1">{developingCount}</div>
        </div>
        <div className="card-elevated p-4 bg-slate-500/5 border-slate-500/20">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unverified Claimed</span>
          <div className="text-2xl font-extrabold text-slate-400 tabular-nums mt-1">{unverifiedCount}</div>
        </div>
      </div>

      {/* Controls: Search, Status Tabs, Category Filter */}
      <div className="card-elevated p-4 bg-surface border-app space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills by name or category..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-app bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2 rounded-xl border border-app bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Skills' },
            { id: 'VERIFIED', label: 'Verified Only' },
            { id: 'DEVELOPING', label: 'Developing' },
            { id: 'UNVERIFIED', label: 'Unverified' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-raised text-sub hover:text-main'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Table (Desktop) / Cards (Mobile) */}
      <div className="card-elevated overflow-hidden bg-surface border-app">
        {filteredSkills.length > 0 ? (
          <div className="divide-y divide-app">
            {filteredSkills.map((item) => {
              const isExpanded = expandedSkillId === item.skillId;
              const hasScore = item.score !== undefined;

              return (
                <div key={item.skillId} className="p-4 sm:p-5 hover:bg-raised/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Skill Info & Chip */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-main">{item.skillName}</span>
                        <span className="text-[10px] text-muted uppercase tracking-wider px-2 py-0.5 rounded-full bg-raised border border-app">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-xs text-sub flex items-center gap-2">
                        <span>Evidence: <strong>{item.evidenceLabel}</strong></span>
                        {item.questionsDrawn && (
                          <span className="text-muted">({item.questionsDrawn} questions drawn)</span>
                        )}
                      </div>
                    </div>

                    {/* Score Bar & Status */}
                    <div className="flex items-center gap-4 sm:w-72 justify-between sm:justify-end">
                      {hasScore ? (
                        <div className="w-32">
                          <ScoreBar score={item.score!} threshold={VERIFY_THRESHOLD} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted">No test taken</span>
                      )}

                      <SkillChip name={item.skillName} status={item.status} score={item.score} />

                      {/* Action Button: Verify or Retake */}
                      {item.category !== 'Professional' && (
                        <button
                          type="button"
                          onClick={() => handleAction(item.skillId)}
                          className="px-3 py-1.5 rounded-xl border border-app bg-raised hover:bg-surface text-brand-accent text-xs font-semibold hover:border-brand/40 shadow-sm transition-all shrink-0"
                        >
                          {item.status === 'VERIFIED' ? 'Retake' : 'Verify'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable "Why this status" */}
                  <div className="mt-3 pt-2 border-t border-app/50 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedSkillId(isExpanded ? null : item.skillId)}
                      className="inline-flex items-center gap-1 text-[11px] text-sub hover:text-brand-accent font-medium focus:outline-none"
                    >
                      <span>Why this status?</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {item.snippet && (
                      <span className="text-[10px] text-muted truncate max-w-xs">
                        Resume snippet: "{item.snippet}"
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5 p-3 rounded-xl bg-raised border border-app text-xs text-sub leading-relaxed space-y-1 animate-fadeIn">
                      <p><strong>Rationale:</strong> {item.reason}</p>
                      {item.snippet && (
                        <p className="text-muted text-[11px]">
                          <strong>Visible Resume Evidence:</strong> "{item.snippet}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-muted space-y-2">
            <Award className="w-8 h-8 mx-auto text-sub opacity-40 mb-1" />
            <p className="text-sm font-semibold text-main">No skills match the current filters</p>
            <p>Upload your resume or reset your category and status selections.</p>
          </div>
        )}
      </div>
    </div>
  );
}
