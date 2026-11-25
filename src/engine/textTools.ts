/**
 * @file textTools.ts
 * Pure deterministic text processing tools for resume normalization, section detection,
 * contact signal parsing, and tokenization.
 */

/**
 * Normalizes text by lowercasing and replacing non-alphanumeric separators with single spaces.
 * Preserves specific characters like '+', '#', '.', and '-' for technical terms.
 * Formula: text.toLowerCase().replace(/[^a-z0-9+#.-]+/g, ' ').trim()
 * @param text The input raw string
 * @returns Clean normalized string
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Calculates word count from a text string.
 * Formula: words = text.trim().split(/\s+/).filter(Boolean).length
 * @param text Raw or normalized string
 * @returns Number of words
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Detects presence of standard resume sections.
 * Checks for Education, Skills, Projects, Experience, and Certifications.
 * @param text Raw text of the resume
 * @returns Array of section detection statuses
 */
export function detectSections(text: string): { section: string; found: boolean }[] {
  const sections = [
    { section: 'Education', pattern: /\b(education|academics|academic background|degree|university|college|school)\b/i },
    { section: 'Skills', pattern: /\b(skills|technical skills|technologies|proficiencies|competencies|tools)\b/i },
    { section: 'Projects', pattern: /\b(projects|academic projects|personal projects|key projects)\b/i },
    { section: 'Experience', pattern: /\b(experience|work experience|employment|internship|internships|work history)\b/i },
    { section: 'Certifications', pattern: /\b(certifications|certificates|licenses|accreditations|honors)\b/i },
  ];

  return sections.map((sec) => ({
    section: sec.section,
    found: sec.pattern.test(text || ''),
  }));
}

/**
 * Extracts contact signals such as email, phone numbers, and profile links.
 * Uses strict regular expressions with no network calls.
 * @param text Raw text of the resume
 * @returns Extracted contact signals
 */
export function extractContactSignals(text: string): {
  email?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
} {
  const result: { email?: string; phone?: string; github?: string; linkedin?: string } = {};
  if (!text) return result;

  // Email pattern
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.email = emailMatch[0];

  // Phone pattern (handles international and domestic formats)
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 10) {
    result.phone = phoneMatch[0].trim();
  }

  // GitHub pattern
  const ghMatch = text.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
  if (ghMatch) result.github = `https://github.com/${ghMatch[1]}`;

  // LinkedIn pattern
  const liMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (liMatch) result.linkedin = `https://linkedin.com/in/${liMatch[1]}`;

  return result;
}

/**
 * Tokenizes text into lowercase words and n-grams.
 * Formula: tokens = text.toLowerCase().match(/\b[a-z0-9+#.-]+\b/g)
 * @param text The input text
 * @returns Array of word tokens
 */
export function tokenizeWords(text: string): string[] {
  if (!text) return [];
  const matches = text.toLowerCase().match(/[a-z0-9+#.-]+/g);
  return matches || [];
}
