const MONTH_NAMES_SHORT = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

/**
 * Parses a month-year string such as "Jan 2024", "November 2026", or "2024-01"
 * into a comparable integer (`year * 12 + monthIndex`), or null if unparseable.
 */
function parseMonthYearScore(raw?: string | null): number | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  const textMatch = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (textMatch) {
    const mIdx = MONTH_NAMES_SHORT.indexOf(textMatch[1].toLowerCase().slice(0, 3));
    const year = parseInt(textMatch[2], 10);
    if (mIdx >= 0 && !isNaN(year)) {
      return year * 12 + mIdx;
    }
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    if (!isNaN(year) && month >= 0 && month <= 11) {
      return year * 12 + month;
    }
  }

  return null;
}

function getExperienceSortKeys(exp: any): {
  isCurrent: boolean;
  endScore: number;
  startScore: number;
  recencyScore: number;
} {
  const durationStr = String(exp?.duration || '');
  const isCurrent = Boolean(exp?.is_current) || /\b(present|kasalukuyan)\b/i.test(durationStr);

  let startScore = parseMonthYearScore(exp?.start_date);
  let endScore = parseMonthYearScore(exp?.end_date);

  // Fallback: extract "MMM YYYY" tokens from formatted duration (e.g. "Jan 2022 – Dec 2024 (3 yrs)")
  if (startScore === null || (!isCurrent && endScore === null)) {
    const matches = durationStr.match(/[A-Za-z]{3,9}\s+\d{4}/g);
    if (matches && matches.length > 0) {
      if (startScore === null) {
        startScore = parseMonthYearScore(matches[0]);
      }
      if (!isCurrent && endScore === null && matches.length > 1) {
        endScore = parseMonthYearScore(matches[1]);
      }
    }
  }

  const now = new Date();
  const currentMonthScore = now.getFullYear() * 12 + now.getMonth();

  const resolvedEndScore = isCurrent ? currentMonthScore + 1000 : (endScore ?? startScore ?? -1);
  const resolvedStartScore = startScore ?? -1;

  // Newly created optimistic items use negative timestamps (-Date.now()); treat them as newest
  let recencyScore = 0;
  if (exp?.created_at) {
    const t = new Date(exp.created_at).getTime();
    if (!isNaN(t)) recencyScore = t;
  } else if (typeof exp?.id === 'number') {
    recencyScore = exp.id < 0 ? Number.MAX_SAFE_INTEGER : exp.id;
  }

  return {
    isCurrent,
    endScore: resolvedEndScore,
    startScore: resolvedStartScore,
    recencyScore,
  };
}

/**
 * Sorts work experiences with the newest/current roles on top and older ones at the bottom.
 */
export function sortWorkExperiences<T>(experiences: T[] | null | undefined): T[] {
  if (!Array.isArray(experiences) || experiences.length === 0) return [];
  return [...experiences].sort((a, b) => {
    const ka = getExperienceSortKeys(a);
    const kb = getExperienceSortKeys(b);

    if (ka.isCurrent !== kb.isCurrent) {
      return kb.isCurrent ? 1 : -1;
    }
    if (ka.endScore !== kb.endScore) {
      return kb.endScore - ka.endScore;
    }
    if (ka.startScore !== kb.startScore) {
      return kb.startScore - ka.startScore;
    }
    return kb.recencyScore - ka.recencyScore;
  });
}
