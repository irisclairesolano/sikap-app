export const DOLE_DAILY_MINIMUM = 455;
export const DOLE_HOURLY_MINIMUM = 56.88;

export interface DoleEvaluationInput {
  amount: number | string | null | undefined;
  duration?: number | string | null;
  durationUnit?: string | null;
}

export interface DoleEvaluationResult {
  valid: boolean;
  amount: number;
  workdays: number;
  dailyEquivalent: number;
  requiredTotal: number;
  meetsBaseline: boolean;
}

/**
 * Normalizes a job's duration + duration_unit into 8-hour workdays,
 * matching PostJobScreen.tsx and sikap-backend JobPost.php conversions:
 * - Hours: duration / 8
 * - Days: duration
 * - Weeks: duration * 5 (40 hrs)
 * - Months: duration * 20 (160 hrs)
 * Defaults to 1 workday when duration is unspecified.
 */
export function getEffectiveWorkdays(
  duration?: number | string | null,
  durationUnit?: string | null,
): number {
  let numVal: number | null = null;
  let parsedUnit = (durationUnit || '').toLowerCase().trim();

  if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
    numVal = duration;
  } else if (typeof duration === 'string' && duration.trim() !== '') {
    const match = duration.trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
    if (match) {
      numVal = parseFloat(match[1]);
      if (!parsedUnit && match[2]) {
        parsedUnit = match[2].toLowerCase().trim();
      }
    }
  }

  if (!numVal || isNaN(numVal) || numVal <= 0 || parsedUnit === 'none') {
    return 1;
  }

  if (parsedUnit.includes('hour') || parsedUnit === 'hr' || parsedUnit === 'hrs') {
    return numVal / 8;
  }
  if (parsedUnit.includes('week') || parsedUnit === 'wk' || parsedUnit === 'wks') {
    return numVal * 5;
  }
  if (parsedUnit.includes('month') || parsedUnit === 'mo' || parsedUnit === 'mos') {
    return numVal * 20;
  }

  // Default to days
  return numVal;
}

/**
 * Evaluates a total offer amount against the DOLE Region V ₱455/day baseline,
 * accounting for multi-day or hourly job durations (fixes Audit S-05).
 */
export function evaluateDoleOffer(input: DoleEvaluationInput): DoleEvaluationResult {
  const numericAmount =
    typeof input.amount === 'number'
      ? input.amount
      : typeof input.amount === 'string'
        ? parseFloat(input.amount)
        : NaN;

  const workdays = getEffectiveWorkdays(input.duration, input.durationUnit);
  const requiredTotal = Math.round(DOLE_DAILY_MINIMUM * workdays * 100) / 100;

  if (isNaN(numericAmount) || numericAmount <= 0) {
    return {
      valid: false,
      amount: 0,
      workdays,
      dailyEquivalent: 0,
      requiredTotal,
      meetsBaseline: false,
    };
  }

  const dailyEquivalent = Math.round((numericAmount / workdays) * 100) / 100;
  const meetsBaseline = numericAmount + 1e-6 >= DOLE_DAILY_MINIMUM * workdays;

  return {
    valid: true,
    amount: numericAmount,
    workdays,
    dailyEquivalent,
    requiredTotal,
    meetsBaseline,
  };
}
