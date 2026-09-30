import {
  formatBirthDateInput,
  parseBirthDateInput,
  formatDateToMMDDYYYY,
  calculateAge,
} from '../../src/utils/dateFormat';

describe('dateFormat utils', () => {
  describe('formatBirthDateInput', () => {
    it('formats typing 01151999 to 01/15/1999', () => {
      expect(formatBirthDateInput('01151999')).toBe('01/15/1999');
    });

    it('formats partial input correctly with slashes', () => {
      expect(formatBirthDateInput('0')).toBe('0');
      expect(formatBirthDateInput('01')).toBe('01');
      expect(formatBirthDateInput('011')).toBe('01/1');
      expect(formatBirthDateInput('0115')).toBe('01/15');
      expect(formatBirthDateInput('01151')).toBe('01/15/1');
      expect(formatBirthDateInput('011519')).toBe('01/15/19');
    });

    it('removes non-digits and truncates to 8 digits (10 chars formatted)', () => {
      expect(formatBirthDateInput('01/15/19991234')).toBe('01/15/1999');
      expect(formatBirthDateInput('abc01-15-1999xyz')).toBe('01/15/1999');
    });
  });

  describe('parseBirthDateInput', () => {
    it('rejects incomplete text', () => {
      expect(parseBirthDateInput('01/15/199').isValid).toBe(false);
      expect(parseBirthDateInput('').isValid).toBe(false);
      expect(parseBirthDateInput('01/15').isValid).toBe(false);
    });

    it('rejects invalid calendar dates like 02/31/2000', () => {
      const res = parseBirthDateInput('02/31/2000');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Enter a valid date of birth (MM/DD/YYYY).');
    });

    it('rejects invalid leap year dates like 02/29/2001', () => {
      expect(parseBirthDateInput('02/29/2001').isValid).toBe(false);
    });

    it('accepts valid leap year date like 02/29/2000', () => {
      const res = parseBirthDateInput('02/29/2000');
      expect(res.isValid).toBe(true);
      expect(res.formattedYMD).toBe('2000-02-29');
    });

    it('rejects dates in the future', () => {
      const futureYear = new Date().getFullYear() + 2;
      const res = parseBirthDateInput(`01/15/${futureYear}`);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Enter a valid date of birth (MM/DD/YYYY).');
    });

    it('rejects years before 1900', () => {
      const res = parseBirthDateInput('01/15/1899');
      expect(res.isValid).toBe(false);
    });

    it('correctly produces YYYY-MM-DD for 01/15/1999 in any timezone (e.g. Asia/Manila)', () => {
      const res = parseBirthDateInput('01/15/1999');
      expect(res.isValid).toBe(true);
      expect(res.formattedYMD).toBe('1999-01-15');
      expect(res.date?.getFullYear()).toBe(1999);
      expect(res.date?.getMonth()).toBe(0);
      expect(res.date?.getDate()).toBe(15);
      expect(res.date?.getHours()).toBe(12);
    });
  });

  describe('formatDateToMMDDYYYY', () => {
    it('formats Date object to MM/DD/YYYY', () => {
      const date = new Date(1999, 0, 15, 12, 0, 0);
      expect(formatDateToMMDDYYYY(date)).toBe('01/15/1999');
    });

    it('converts YYYY-MM-DD string to MM/DD/YYYY', () => {
      expect(formatDateToMMDDYYYY('1999-01-15')).toBe('01/15/1999');
    });

    it('returns MM/DD/YYYY as-is if already formatted', () => {
      expect(formatDateToMMDDYYYY('01/15/1999')).toBe('01/15/1999');
    });
  });

  describe('calculateAge', () => {
    it('calculates full years correctly', () => {
      const birth = new Date(2000, 0, 15);
      const age = calculateAge(birth);
      expect(age).toBeGreaterThanOrEqual(24);
    });
  });
});
