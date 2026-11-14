import { Skill } from '../api/skills';

const SKILL_SYNONYMS: Record<string, string[]> = {
  'carpentry & cabinet making': ['karpintero', 'woodwork', 'furniture', 'cabinet', 'kahoy'],
  'masonry (hollow block laying)': ['mason', 'kantero', 'hollow block', 'brick', 'wall', 'semento'],
  'concrete mixing & plastering': ['palitada', 'semento', 'concrete', 'cement', 'mason'],
  'electrical wiring & installation': [
    'electrician',
    'elektrisyan',
    'kuryente',
    'wiring',
    'breaker',
  ],
  'plumbing & pipe fitting': ['tubero', 'plumber', 'tubo', 'gripo', 'pipe', 'leak'],
  'house painting & varnishing': ['pintor', 'painter', 'pintura', 'varnish', 'pader'],
  'welding & metal fabrication': ['welder', 'hinang', 'bakal', 'metal', 'steel', 'gate'],
  'roofing & gutter installation': ['bubong', 'roof', 'yero', 'alulod', 'gutter'],
  'tile setting': ['tiles', 'tiler', 'sahig', 'banyo', 'flooring'],
  'housekeeping & deep cleaning': ['katulong', 'kasambahay', 'linis', 'cleaner', 'maid'],
  'cooking & meal prep': ['kusinera', 'kusinero', 'cook', 'chef', 'luto', 'pagkain'],
  'laundry & ironing': ['labandera', 'laba', 'plantsa', 'laundry', 'clothes'],
  'nanny & babysitting': ['yaya', 'bantay bata', 'babysitter', 'alaga', 'childcare'],
  'elderly care & companionship': ['caregiver', 'alaga matanda', 'senior', 'elderly'],
  'gardening & lawn care': ['hardinero', 'gardener', 'halaman', 'damo', 'landscaping'],
  'rice planting & harvesting': ['magsasaka', 'palay', 'farmer', 'ani', 'rice'],
  'coconut harvesting & copra making': ['niyog', 'kopra', 'copra', 'coconut'],
  'vegetable & fruit farming': ['gulay', 'prutas', 'farm', 'tanaman', 'magsasaka'],
  'livestock & poultry raising': ['baboy', 'manok', 'poultry', 'livestock', 'alaga hayop'],
  'fishery & net repair': ['mangingisda', 'lambat', 'isda', 'fishing', 'fisherman'],
  'hair cutting & styling': ['barbero', 'gupit', 'parlor', 'haircut', 'salon', 'stylist'],
  'manicure & pedicure': ['manikurista', 'kuko', 'nails', 'pedicure', 'salon'],
  'therapeutic massage (hilot)': ['hilot', 'masahista', 'massage', 'spa', 'therapy'],
  'makeup artistry': ['makeup', 'make up', 'mua', 'cosmetics', 'bridal'],
  'aircon cleaning & repair': ['aircon', 'ac', 'hvac', 'cooling', 'freon'],
  'home appliance repair': ['appliance', 'ref', 'refrigerator', 'washing machine', 'tv'],
  'mobile phone & laptop repair': ['cellphone', 'cp', 'phone', 'laptop', 'computer', 'tech'],
  'motorcycle mechanics': ['mekaniko', 'motor', 'motorcycle', 'tune up', 'change oil'],
  'tricycle driving & rental': ['tricycle', 'trike', 'toda', 'driver'],
  'motorcycle delivery & courier': ['rider', 'delivery', 'courier', 'padala', 'lalamove'],
  'light vehicle driving (car/suv)': ['driver', 'tsuper', 'kotse', 'suv', 'family driver'],
  'heavy truck driving': ['truck', 'driver', 'hauling', 'delivery truck', '10 wheeler'],
  'tailoring & dressmaking': ['mananahi', 'sastre', 'modista', 'tahi', 'sewing', 'alteration'],
  'upholstery & furniture repair': ['upholstery', 'sofa', 'kutchon', 'furniture'],
  'event decorating & balloon styling': ['balloon', 'party', 'decor', 'events', 'birthday'],
};

function getKeywordsForSkill(skill: Skill): string[] {
  const lower = skill.name.trim().toLowerCase();
  return SKILL_SYNONYMS[lower] ?? [];
}

function scoreSkillMatch(skill: Skill, normalizedQuery: string): number {
  const nameLower = skill.name.toLowerCase();
  const categoryLower = (skill.category ?? '').toLowerCase();
  const keywords = getKeywordsForSkill(skill);

  if (nameLower.startsWith(normalizedQuery)) {
    return 100;
  }

  const words = nameLower.split(/[\s/&(),()-]+/).filter(Boolean);
  if (words.some((w) => w.startsWith(normalizedQuery))) {
    return 80;
  }

  if (keywords.some((kw) => kw.startsWith(normalizedQuery))) {
    return 70;
  }

  if (nameLower.includes(normalizedQuery)) {
    return 60;
  }

  if (keywords.some((kw) => kw.includes(normalizedQuery))) {
    return 50;
  }

  if (categoryLower.startsWith(normalizedQuery) || categoryLower.includes(normalizedQuery)) {
    return 30;
  }

  return 0;
}

/**
 * Return ranked catalog skills matching a live search query, excluding already-selected skills.
 */
export function getAutocompleteSkills(
  query: string,
  allSkills: Skill[],
  selectedSkills: Skill[],
  limit = 6,
): Skill[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const selectedIds = new Set(selectedSkills.map((s) => s.id));

  return allSkills
    .filter((skill) => !selectedIds.has(skill.id))
    .map((skill) => ({ skill, score: scoreSkillMatch(skill, normalized) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name))
    .slice(0, limit)
    .map((entry) => entry.skill);
}

/**
 * Recommend related catalog skills sharing categories with the worker's currently selected skills.
 */
export function getRecommendedSkills(
  allSkills: Skill[],
  selectedSkills: Skill[],
  limit = 6,
): Skill[] {
  if (selectedSkills.length === 0) {
    return [];
  }

  const selectedIds = new Set(selectedSkills.map((s) => s.id));
  const categoryCounts = new Map<string, number>();

  for (const skill of selectedSkills) {
    if (!skill.category) {
      continue;
    }
    const cat = skill.category.trim().toLowerCase();
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }

  if (categoryCounts.size === 0) {
    return [];
  }

  return allSkills
    .filter((skill) => {
      if (selectedIds.has(skill.id) || !skill.category) {
        return false;
      }
      return categoryCounts.has(skill.category.trim().toLowerCase());
    })
    .sort((a, b) => {
      const countA = categoryCounts.get((a.category ?? '').trim().toLowerCase()) ?? 0;
      const countB = categoryCounts.get((b.category ?? '').trim().toLowerCase()) ?? 0;
      return countB - countA || a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}
