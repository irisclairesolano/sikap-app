import {
  evaluateDoleOffer,
  getEffectiveWorkdays,
  DOLE_DAILY_MINIMUM,
} from '../../src/utils/doleWage';
import { getRateUnitLabel } from '../../src/utils/rateUnit';
import { en } from '../../src/locales/en';

describe('DOLE Region V Wage Evaluation & Rate Unit Label Helpers (Audit S-01 & S-05)', () => {
  const t = (key: keyof typeof en) => en[key];

  describe('getRateUnitLabel (Audit S-01)', () => {
    it('prioritizes job.rate_unit over legacy duration_type so daily jobs do not render as per project', () => {
      expect(getRateUnitLabel({ rate_unit: 'per_day', duration_type: 'project-based' }, t)).toBe(
        'per day',
      );

      expect(getRateUnitLabel({ rate_unit: 'per_hour', duration_type: 'project-based' }, t)).toBe(
        'per hour',
      );

      expect(getRateUnitLabel({ rate_unit: 'per_project', duration_type: 'daily' }, t)).toBe(
        'per project',
      );
    });

    it('falls back to duration_type when rate_unit is omitted', () => {
      expect(getRateUnitLabel({ duration_type: 'daily' }, t)).toBe('per day');
      expect(getRateUnitLabel({ duration_type: 'fixed' }, t)).toBe('per project');
    });
  });

  describe('getEffectiveWorkdays & evaluateDoleOffer (Audit S-05)', () => {
    it('evaluates 1-day or unspecified duration offers directly against ₱455/day', () => {
      expect(getEffectiveWorkdays(undefined, undefined)).toBe(1);
      const meets = evaluateDoleOffer({ amount: 455 });
      expect(meets.meetsBaseline).toBe(true);
      expect(meets.dailyEquivalent).toBe(455);

      const below = evaluateDoleOffer({ amount: 400 });
      expect(below.meetsBaseline).toBe(false);
      expect(below.dailyEquivalent).toBe(400);
    });

    it('flags ₱1,200 total for a 3-day job (₱400/day) as below the ₱455/day DOLE baseline', () => {
      const result = evaluateDoleOffer({
        amount: 1200,
        duration: 3,
        durationUnit: 'Days',
      });

      expect(result.workdays).toBe(3);
      expect(result.dailyEquivalent).toBe(400);
      expect(result.requiredTotal).toBe(3 * DOLE_DAILY_MINIMUM);
      expect(result.meetsBaseline).toBe(false);
    });

    it('marks ₱1,365 total for a 3-day job (₱455/day) as meeting the DOLE baseline', () => {
      const result = evaluateDoleOffer({
        amount: 1365,
        duration: 3,
        durationUnit: 'Days',
      });

      expect(result.workdays).toBe(3);
      expect(result.dailyEquivalent).toBe(455);
      expect(result.meetsBaseline).toBe(true);
    });

    it('converts hourly durations (e.g. 4 Hours = 0.5 workdays) when evaluating total offer', () => {
      const result = evaluateDoleOffer({
        amount: 250,
        duration: 4,
        durationUnit: 'Hours',
      });

      expect(result.workdays).toBe(0.5);
      expect(result.dailyEquivalent).toBe(500);
      expect(result.meetsBaseline).toBe(true);
    });
  });
});
