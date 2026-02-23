import logger from '../utils/logger.js';

/**
 * ATS (Applicant Tracking System) Scoring Pipeline.
 *
 * Scores a resume JSON on four dimensions (0-100 each):
 *   • skills, experience, summary, structure
 *
 * Designed to be swappable with an LLM-based scorer.
 */

const WEIGHTS = {
  skills: 0.3,
  experience: 0.3,
  summary: 0.15,
  structure: 0.25,
} as const;

export interface AtsScoreResult {
  total: number;
  breakdown: {
    skills: number;
    experience: number;
    summary: number;
    structure: number;
  };
}

interface ResumeSkill {
  name?: string;
}

interface ResumeExperience {
  title?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  end?: string;
  bullets?: string[];
  highlights?: string[];
  description?: string | string[];
  location?: string;
}

interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  objective?: string;
  professionalSummary?: string;
  skills?: (string | ResumeSkill)[];
  experience?: ResumeExperience[];
  workExperience?: ResumeExperience[];
  education?: unknown[];
  certifications?: unknown[];
  certificates?: unknown[];
  projects?: unknown[];
  [key: string]: unknown;
}

function scoreSkills(data: ResumeData): number {
  const skills = data.skills ?? [];
  if (!Array.isArray(skills) || skills.length === 0) return 0;

  const normalised = skills
    .map((s) => (typeof s === 'string' ? s : (s as ResumeSkill)?.name))
    .filter(Boolean);
  const count = normalised.length;

  if (count >= 12) return 100;
  if (count >= 8) return 85;
  if (count >= 5) return 70;
  if (count >= 3) return 50;
  return 30;
}

function scoreExperience(data: ResumeData): number {
  const experience = data.experience ?? data.workExperience ?? [];
  if (!Array.isArray(experience) || experience.length === 0) return 0;

  let score = 0;

  score += Math.min(experience.length * 15, 45);

  const totalBullets = experience.reduce((sum: number, role: ResumeExperience) => {
    const bullets = role.bullets ?? role.highlights ?? role.description ?? [];
    return sum + (Array.isArray(bullets) ? bullets.length : bullets ? 1 : 0);
  }, 0);
  score += Math.min(totalBullets * 5, 35);

  const mostRecent = experience[0];
  if (mostRecent) {
    const endDate = mostRecent.endDate ?? mostRecent.end;
    if (!endDate || endDate.toLowerCase() === 'present') {
      score += 20;
    } else {
      const yearsAgo = (Date.now() - new Date(endDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (yearsAgo <= 2) score += 15;
      else if (yearsAgo <= 5) score += 10;
    }
  }

  return Math.min(score, 100);
}

function scoreSummary(data: ResumeData): number {
  const summary = data.summary ?? data.objective ?? data.professionalSummary ?? '';
  if (!summary) return 0;

  const wordCount = summary.trim().split(/\s+/).length;

  if (wordCount >= 40 && wordCount <= 80) return 100;
  if (wordCount >= 25) return 80;
  if (wordCount >= 15) return 60;
  if (wordCount >= 5) return 35;
  return 15;
}

function scoreStructure(data: ResumeData): number {
  const sections: string[] = [
    'name',
    'email',
    'phone',
    'summary',
    'objective',
    'professionalSummary',
    'skills',
    'experience',
    'workExperience',
    'education',
    'certifications',
    'certificates',
    'projects',
  ];

  const present = sections.filter((key) => {
    const val = data[key];
    if (val === undefined || val === null) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  }).length;

  const ratio = present / 8;
  return Math.min(Math.round(ratio * 100), 100);
}

/**
 * Score resume data and return breakdown + total.
 */
export function computeAtsScore(resumeData: ResumeData): AtsScoreResult {
  const breakdown = {
    skills: scoreSkills(resumeData),
    experience: scoreExperience(resumeData),
    summary: scoreSummary(resumeData),
    structure: scoreStructure(resumeData),
  };

  const total = Math.round(
    breakdown.skills * WEIGHTS.skills +
      breakdown.experience * WEIGHTS.experience +
      breakdown.summary * WEIGHTS.summary +
      breakdown.structure * WEIGHTS.structure,
  );

  logger.debug('ATS score computed', { total, breakdown });

  return { total, breakdown };
}
