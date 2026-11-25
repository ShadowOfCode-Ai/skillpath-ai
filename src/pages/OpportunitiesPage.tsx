/**
 * @file OpportunitiesPage.tsx
 * Opportunity matcher combining weighted skillMatch and TF-IDF document similarity.
 * Features sample banner, type/location/work-mode filters, minimum match slider,
 * company-initial avatar, bookmarking, and mathematical "Why this match?" breakdown.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/common/Feedback';
import { ScoreRing, SkillChip, FormulaPanel } from '../components/common/SharedComponents';
import { matchOpportunities, OpportunityMatchResult } from '../engine/opportunityMatcher';
import { SAMPLE_OPPORTUNITIES, OpportunityListing } from '../data/sampleOpportunities';
import { CAREER_ROLES_MAP } from '../data/roles';
import {
  Briefcase,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  MapPin,
  Clock,
  Filter,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function OpportunitiesPage() {
  const {
    profile,
    verifiedSkillsMap,
    savedOpportunityIds,
    toggleSaveOpportunity,
    showSampleListings,
  } = useApp();
  const { showToast } = useToast();

  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Internship' | 'Fresher Job'>('ALL');
  const [workModeFilter, setWorkModeFilter] = useState<'ALL' | 'Onsite' | 'Hybrid' | 'Remote'>('ALL');
  const [minMatch, setMinMatch] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'score' | 'title' | 'company'>('score');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const targetRoleDef = CAREER_ROLES_MAP.get(profile.targetRoleId);

  // Compute live opportunity matches
  const allMatches: OpportunityMatchResult[] = useMemo(() => {
    let list = SAMPLE_OPPORTUNITIES;
    if (!showSampleListings) {
      list = list.filter((o) => !o.isSample);
    }
    return matchOpportunities(list, verifiedSkillsMap, targetRoleDef?.name);
  }, [verifiedSkillsMap, targetRoleDef, showSampleListings]);

  // Apply filters
  const filteredMatches = useMemo(() => {
    return allMatches
      .filter((m) => {
        if (typeFilter !== 'ALL' && m.opportunity.type !== typeFilter) return false;
        if (workModeFilter !== 'ALL' && m.opportunity.workMode !== workModeFilter) return false;
        if (m.opportunityScore < minMatch) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'score') return b.opportunityScore - a.opportunityScore;
        if (sortOrder === 'title') return a.opportunity.title.localeCompare(b.opportunity.title);
        return a.opportunity.company.localeCompare(b.opportunity.company);
      });
  }, [allMatches, typeFilter, workModeFilter, minMatch, sortOrder]);

  const hasOnlySamples = allMatches.every((m) => m.opportunity.isSample);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-main font-heading">Matched Opportunities</h2>
        <p className="text-xs text-sub">
          Ranked using deterministic scoring: 70% weighted skill match + 30% TF-IDF description similarity.
        </p>
      </div>

      {/* Sample Vacancy Banner */}
      {hasOnlySamples && showSampleListings && (
        <div className="card-elevated p-4 border-amber-500/30 bg-amber-500/5 flex items-start gap-3 text-xs text-sub leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-main font-semibold">Sample Listings Notice: </strong>
            All current vacancies use fictional company names and sample job descriptions to demonstrate matching math. Real positions can be added by administrators in the Admin Console.
          </div>
        </div>
      )}

      {/* Sticky Filter Bar */}
      <div className="card-elevated p-4 bg-surface border-app space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Control: Internships / Fresher Jobs / All */}
          <div className="inline-flex rounded-xl bg-raised border border-app p-1 text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All Opportunities' },
              { id: 'Internship', label: 'Internships' },
              { id: 'Fresher Job', label: 'Fresher Jobs' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setTypeFilter(btn.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  typeFilter === btn.id ? 'bg-brand text-white shadow-sm' : 'text-sub hover:text-main'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Work Mode Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Mode:</span>
            <select
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-app bg-raised text-main text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Modes</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-app bg-raised text-main text-xs font-semibold focus:outline-none"
            >
              <option value="score">Highest Match Score</option>
              <option value="title">Job Title (A-Z)</option>
              <option value="company">Company Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Minimum Match Slider */}
        <div className="flex items-center gap-4 pt-2 border-t border-app text-xs">
          <span className="text-sub font-medium">Minimum Match:</span>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={minMatch}
            onChange={(e) => setMinMatch(Number(e.target.value))}
            className="flex-1 max-w-xs accent-brand cursor-pointer"
          />
          <span className="font-bold tabular-nums text-main w-12">{minMatch}%+</span>
          <span className="text-muted text-[11px] ml-auto">
            Showing {filteredMatches.length} of {allMatches.length}
          </span>
        </div>
      </div>

      {/* Opportunity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMatches.map((match) => {
          const opp = match.opportunity;
          const isSaved = savedOpportunityIds.has(opp.id);
          const isExpanded = expandedMatchId === opp.id;

          return (
            <div
              key={opp.id}
              className="card-elevated p-6 bg-surface border-app flex flex-col justify-between space-y-4 relative"
            >
              <div>
                {/* Header: Company Initial Avatar + Badges + Bookmark */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-raised border border-app text-main font-bold flex items-center justify-center text-sm shrink-0">
                      {opp.company.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-main truncate font-heading">{opp.title}</h3>
                      <p className="text-xs text-sub truncate">{opp.company}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toggleSaveOpportunity(opp.id);
                      showToast(isSaved ? 'Removed from saved jobs' : 'Saved to your bookmarks!', 'info');
                    }}
                    className={`p-2 rounded-xl border transition-colors ${
                      isSaved
                        ? 'border-brand/40 bg-brand/10 text-brand-accent'
                        : 'border-app bg-raised text-sub hover:text-main'
                    }`}
                    title={isSaved ? 'Unsave opportunity' : 'Save opportunity'}
                    aria-label={isSaved ? 'Unsave opportunity' : 'Save opportunity'}
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>

                {/* Meta details & Sample Badge */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted mb-4">
                  <span className="px-2 py-0.5 rounded bg-raised border border-app font-medium text-sub">
                    {opp.type}
                  </span>
                  <span>•</span>
                  <span>{opp.workMode}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{opp.location}</span>
                  </span>
                  {opp.isSample && (
                    <span className="ml-auto text-[10px] font-semibold text-amber-500 px-2 py-0.5 rounded bg-amber-500/10">
                      Sample listing — not a real vacancy
                    </span>
                  )}
                </div>

                {/* Match Ring & Skills Summary */}
                <div className="flex items-center gap-4 py-2">
                  <ScoreRing score={match.opportunityScore} size={88} strokeWidth={8} label="Alignment" />
                  <div className="space-y-1 text-xs text-sub">
                    <div>
                      Skill Match: <strong className="text-main tabular-nums">{match.skillMatch}%</strong>
                    </div>
                    <div>
                      Text Match: <strong className="text-main tabular-nums">{match.textSimilarityPercent}%</strong>
                    </div>
                    <div className="text-[11px] text-muted">
                      {match.verifiedCount} verified of {match.totalRequired} required skills
                    </div>
                  </div>
                </div>

                {/* Description snippet */}
                <p className="text-xs text-sub leading-relaxed line-clamp-2 mt-2">{opp.description}</p>

                {/* Matched & Missing Chips */}
                <div className="pt-3 space-y-1.5">
                  <div className="flex flex-wrap gap-1">
                    {match.matchedSkills.map((name) => (
                      <span
                        key={name}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium"
                      >
                        ✓ {name}
                      </span>
                    ))}
                    {match.missingSkills.map((m) => (
                      <span
                        key={m.skillName}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium"
                      >
                        ! {m.skillName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Expandable "Why this match?" & Apply */}
              <div className="pt-3 border-t border-app space-y-3">
                <button
                  type="button"
                  onClick={() => setExpandedMatchId(isExpanded ? null : opp.id)}
                  className="w-full flex items-center justify-between text-xs text-sub hover:text-brand-accent font-medium focus:outline-none"
                >
                  <span>Why this match? (Formula Breakdown)</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="p-3 rounded-xl bg-raised border border-app text-xs font-mono text-brand-accent tracking-wide leading-relaxed animate-fadeIn">
                    {match.whyThisMatch}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted">
                    Posted {new Date(opp.postedAt).toLocaleDateString()}
                  </span>
                  {opp.applyUrl ? (
                    <a
                      href={opp.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white font-semibold text-xs hover:bg-brand-hover shadow-sm transition-colors"
                    >
                      <span>Apply</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted font-medium italic">
                      Sample card (No apply URL)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMatches.length === 0 && (
        <div className="card-elevated p-12 text-center text-xs text-muted space-y-2 bg-surface">
          <Briefcase className="w-8 h-8 mx-auto text-sub opacity-40 mb-1" />
          <p className="text-sm font-semibold text-main">No opportunities match the chosen filters</p>
          <p>Try reducing the minimum match percentage or switching the work mode filter.</p>
        </div>
      )}
    </div>
  );
}
