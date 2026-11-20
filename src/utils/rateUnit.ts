import { TranslationKey } from '../locales/en';

export interface RateUnitJobLike {
  rate_unit?: string | null;
  duration_type?: string | null;
}

/**
 * Returns the localized rate-unit label for a job posting, prioritizing `rate_unit`
 * consistently across JobCard, JobDetailsScreen, and ApplyScreen (fixes Audit S-01).
 */
export function getRateUnitLabel(
  job: RateUnitJobLike | null | undefined,
  t: (key: TranslationKey) => string,
): string {
  const rateUnit = job?.rate_unit?.toLowerCase().trim();
  if (rateUnit === 'per_hour' || rateUnit === 'hourly' || rateUnit === '/hr') {
    return t('per_hour');
  }
  if (rateUnit === 'per_project' || rateUnit === 'fixed' || rateUnit === 'project') {
    return t('fixed_per_project');
  }
  if (rateUnit === 'per_day' || rateUnit === 'daily' || rateUnit === '/day') {
    return t('per_day');
  }

  // Fallback to legacy duration_type only when rate_unit is absent
  const durationType = job?.duration_type?.toLowerCase().trim();
  if (durationType === 'per_project' || durationType === 'fixed' || durationType === 'project') {
    return t('fixed_per_project');
  }
  if (durationType === 'per_hour' || durationType === 'hourly') {
    return t('per_hour');
  }

  return t('per_day');
}
