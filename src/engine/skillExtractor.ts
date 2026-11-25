/**
 * @file skillExtractor.ts
 * Pure deterministic skill extraction using alias dictionary and strict boundary matching.
 * Handles boundary edge cases (C++, C#, .NET, Node.js) and ambiguous tokens (C, R, Go).
 * Extracts visible snippet context (max 120 chars) and count of mentions.
 */

import { SKILLS_TAXONOMY, SkillDefinition } from '../data/skills';

export interface DetectedSkill {
  skillId: string;
  mentions: number;
  snippet: string;
  source: 'resume' | 'manual';
  removedByUser?: boolean;
}

/**
 * Escapes regex characters except those needed for programming languages.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if ambiguous single-letter or short token (C, R, Go) appears in a technical/skills-like context.
 * Invariant: 'C' inside 'Cloud' or 'Class' must NEVER match.
 */
function matchesAmbiguousToken(rawText: string, token: 'C' | 'R' | 'Go'): { match: boolean; snippet: string; count: number } {
  // Must be standalone case-sensitive token surrounded by non-alphanumeric or start/end
  // And surrounded by programming/technical context (e.g., C/C++, Python/C, skills list, programming in C)
  let pattern: RegExp;
  if (token === 'C') {
    // Specifically match C as a programming language: e.g. "C,", "C/", "C++", "C /", "Programming: C", "Languages: ... C", "Proficient in C"
    // Must NOT match inside words like "Cloud", "Company", "Computer", "Certificate", or Roman numerals/grades
    pattern = /(?:(?:programming|languages?|skills|technologies|tools|proficient\s+(?:in|with))[\s\S]{0,40}?\b(C)\b)|(?:\b(C)\b[\s/,\-]+(?:c\+\+|cpp|python|java|assembly))/i;
  } else if (token === 'R') {
    pattern = /(?:(?:programming|languages?|skills|statistical|stats|data|proficient\s+(?:in|with))[\s\S]{0,40}?\b(R)\b)|(?:\b(R)\b[\s/,\-]+(?:python|spss|sas|stata))/i;
  } else {
    // Go language: match "Golang" or "Go" in languages context
    pattern = /(?:(?:programming|languages?|skills|backend|proficient\s+(?:in|with))[\s\S]{0,40}?\b(Go)\b)|(?:\b(Go)\b[\s/,\-]+(?:python|rust|c\+\+|java))/i;
  }

  const match = rawText.match(pattern);
  if (!match) return { match: false, snippet: '', count: 0 };

  const index = match.index || 0;
  const start = Math.max(0, index - 30);
  const end = Math.min(rawText.length, index + 90);
  const snippet = rawText.slice(start, end).replace(/\s+/g, ' ').trim();

  // Count occurrences
  const countRegex = new RegExp(`(?<=[^a-zA-Z0-9]|^)${token}(?=[^a-zA-Z0-9]|$)`, 'g');
  const count = (rawText.match(countRegex) || []).length;

  return { match: true, snippet, count: Math.max(1, count) };
}

/**
 * Extracts skills from text using an alias dictionary with strict token boundaries.
 * Formula:
 * For each skill in taxonomy:
 *   For each alias of skill:
 *     Match alias bounded by (?<=[^a-zA-Z0-9+#.-]|^)alias(?=[^a-zA-Z0-9+#.-]|$)
 * Snippet is generated around the first occurrence up to 120 characters:
 *   start = max(0, index - 40), end = min(length, index + 80)
 *
 * @param text Raw or preprocessed document text
 * @returns Array of DetectedSkill objects
 */
export function extractSkillsFromText(text: string): DetectedSkill[] {
  if (!text || !text.trim()) return [];

  const results: DetectedSkill[] = [];
  const lowerText = text.toLowerCase();

  for (const skill of SKILLS_TAXONOMY) {
    // Special handling for ambiguous tokens C, R, Go
    if (skill.id === 'c') {
      const res = matchesAmbiguousToken(text, 'C');
      if (res.match) {
        results.push({
          skillId: 'c',
          mentions: res.count,
          snippet: res.snippet,
          source: 'resume',
        });
        continue;
      }
    } else if (skill.id === 'r') {
      const res = matchesAmbiguousToken(text, 'R');
      if (res.match) {
        results.push({
          skillId: 'r',
          mentions: res.count,
          snippet: res.snippet,
          source: 'resume',
        });
        continue;
      }
    } else if (skill.id === 'go') {
      const res = matchesAmbiguousToken(text, 'Go');
      if (res.match) {
        results.push({
          skillId: 'go',
          mentions: res.count,
          snippet: res.snippet,
          source: 'resume',
        });
        continue;
      }
    }

    let totalMentions = 0;
    let firstSnippet = '';
    let firstIndex = -1;

    for (const alias of skill.aliases) {
      const lowerAlias = alias.toLowerCase();
      // Strict boundary check: not preceded or followed by alphanumeric characters
      // Special symbols like ++, #, . are handled cleanly
      const escaped = escapeRegex(lowerAlias);
      const regex = new RegExp(`(?<=[^a-z0-9]|^)${escaped}(?=[^a-z0-9]|$)`, 'g');

      let match: RegExpExecArray | null;
      while ((match = regex.exec(lowerText)) !== null) {
        totalMentions++;
        if (firstIndex === -1 || match.index < firstIndex) {
          firstIndex = match.index;
          const start = Math.max(0, match.index - 40);
          const end = Math.min(text.length, match.index + lowerAlias.length + 60);
          firstSnippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
        }
      }
    }

    if (totalMentions > 0) {
      results.push({
        skillId: skill.id,
        mentions: totalMentions,
        snippet: firstSnippet.slice(0, 120),
        source: 'resume',
      });
    }
  }

  return results;
}
