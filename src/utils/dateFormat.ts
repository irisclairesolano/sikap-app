/**
 * Date formatting and parsing helpers for Date of Birth inputs.
 */

/**
 * Formats raw digit input into MM/DD/YYYY format with automatic slashes.
 * Strips non-digits, keeps at most 8 digits, and inserts '/' after the 2nd and 4th digits.
 */
export function formatBirthDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Converts a Date object or YYYY-MM-DD string into MM/DD/YYYY string.
 */
export function formatDateToMMDDYYYY(date: Date | string | null | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format
    const ymdMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      return `${m}/${d}/${y}`;
    }
    // If already in MM/DD/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return date;
    }
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '';
    date = parsed;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

export interface ParseBirthDateResult {
  isValid: boolean;
  date?: Date;
  formattedYMD?: string;
  error?: string;
}

/**
 * Parses and validates a MM/DD/YYYY date string.
 * - Must be exactly 10 characters (MM/DD/YYYY).
 * - Must represent a real calendar date (checks leap years, valid days per month).
 * - Year must be >= 1900.
 * - Date must not be in the future.
 * - Constructs Date at noon local time (12:00:00) to avoid timezone boundary shifts.
 * - Builds formatted YYYY-MM-DD string directly from local parts.
 */
export function parseBirthDateInput(text: string): ParseBirthDateResult {
  if (!text || text.length !== 10) {
    return { isValid: false, error: 'Enter a valid date of birth (MM/DD/YYYY).' };
  }

  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return { isValid: false, error: 'Enter a valid date of birth (MM/DD/YYYY).' };
  }

  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (year < 1900) {
    return { isValid: false, error: 'Enter a valid date of birth (MM/DD/YYYY).' };
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { isValid: false, error: 'Enter a valid date of birth (MM/DD/YYYY).' };
  }

  // Construct date at noon local time
  const parsedDate = new Date(year, month - 1, day, 12, 0, 0);

  // Validate that the date didn't roll over (e.g. Feb 31 -> Mar 3)
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return { isValid: false, error: 'Enter a valid date of birth (MM/DD/YYYY).' };
  }

  const now = new Date();
  if (parsedDate > now) {
    return { isValid: false, error: 'Enter a valid date of birth (MM/DD/YYYY).' };
  }

  const formattedYMD = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    isValid: true,
    date: parsedDate,
    formattedYMD,
  };
}

/**
 * Calculates age in full years from a birth Date.
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
}
