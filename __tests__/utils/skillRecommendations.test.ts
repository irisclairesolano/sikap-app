import { Skill } from '../../src/api/skills';
import { getAutocompleteSkills, getRecommendedSkills } from '../../src/utils/skillRecommendations';

const SAMPLE_SKILLS: Skill[] = [
  { id: 1, name: 'Carpentry & Cabinet Making', category: 'Construction' },
  { id: 2, name: 'Plumbing & Pipe Fitting', category: 'Construction' },
  { id: 3, name: 'Electrical Wiring & Installation', category: 'Construction' },
  { id: 4, name: 'House Painting & Varnishing', category: 'Construction' },
  { id: 5, name: 'Laundry & Ironing', category: 'Domestic' },
  { id: 6, name: 'Nanny & Babysitting', category: 'Domestic' },
  { id: 7, name: 'Therapeutic Massage (Hilot)', category: 'Wellness' },
  { id: 8, name: 'Aircon Cleaning & Repair', category: 'Repair' },
];

describe('skillRecommendations', () => {
  it('ranks prefix matches above substring matches and supports Tagalog synonyms', () => {
    const paintMatches = getAutocompleteSkills('paint', SAMPLE_SKILLS, []);
    expect(paintMatches[0]?.name).toBe('House Painting & Varnishing');

    const tuberoMatches = getAutocompleteSkills('tubero', SAMPLE_SKILLS, []);
    expect(tuberoMatches.map((s) => s.name)).toContain('Plumbing & Pipe Fitting');

    const hilotMatches = getAutocompleteSkills('hilot', SAMPLE_SKILLS, []);
    expect(hilotMatches[0]?.name).toBe('Therapeutic Massage (Hilot)');
  });

  it('excludes already selected skills from autocomplete results', () => {
    const selected = [SAMPLE_SKILLS[1]]; // Plumbing
    const matches = getAutocompleteSkills('plumb', SAMPLE_SKILLS, selected);
    expect(matches).toHaveLength(0);
  });

  it('recommends related skills from the same category as selected skills', () => {
    const selected = [SAMPLE_SKILLS[0]]; // Carpentry (Construction)
    const recommended = getRecommendedSkills(SAMPLE_SKILLS, selected, 4);

    expect(recommended.length).toBe(3);
    expect(recommended.every((s) => s.category === 'Construction')).toBe(true);
    expect(recommended.some((s) => s.id === SAMPLE_SKILLS[0].id)).toBe(false);
  });

  it('returns empty recommendations when no skills are selected', () => {
    expect(getRecommendedSkills(SAMPLE_SKILLS, [])).toEqual([]);
  });
});
