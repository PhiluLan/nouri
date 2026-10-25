import type { NutrientKey, NutrientReference, Profile } from '../types/domain';

const SOURCE = 'BLV Schweizer Referenzwerte für die Nährstoffzufuhr';

const labels: Record<NutrientKey, [string, NutrientReference['unit']]> = {
  protein: ['Protein', 'g'],
  fiber: ['Nahrungsfasern', 'g'],
  calcium: ['Calcium', 'mg'],
  iron: ['Eisen', 'mg'],
  potassium: ['Kalium', 'mg'],
  vitaminC: ['Vitamin C', 'mg'],
  vitaminB12: ['Vitamin B12', 'µg'],
  folate: ['Folat', 'µg'],
};

/**
 * MVP reference selection for healthy adults. Values are intake reference points,
 * never a statement about an individual's physiological status.
 */
export function referencesFor(profile: Pick<Profile, 'birth_year' | 'sex' | 'weight_kg' | 'pregnant' | 'breastfeeding'>, currentYear = new Date().getFullYear()): NutrientReference[] {
  const age = Math.max(18, currentYear - profile.birth_year);
  const female = profile.sex === 'female';
  const fallbackWeight = female ? 60 : profile.sex === 'male' ? 75 : 67.5;
  const weight = profile.weight_kg && profile.weight_kg > 0 ? profile.weight_kg : fallbackWeight;
  const proteinFactor = age >= 65 ? 1 : 0.83;

  const values: Record<NutrientKey, number> = {
    protein: Math.round(weight * proteinFactor),
    fiber: 30,
    calcium: age >= 65 ? 1000 : 950,
    iron: profile.pregnant ? 30 : profile.breastfeeding ? 20 : female ? 16 : 11,
    potassium: 3500,
    vitaminC: female ? 95 : profile.sex === 'male' ? 110 : 100,
    vitaminB12: profile.pregnant ? 4.5 : profile.breastfeeding ? 5.5 : 4,
    folate: profile.pregnant ? 550 : profile.breastfeeding ? 450 : 330,
  };

  return (Object.keys(values) as NutrientKey[]).map((key) => ({
    key,
    label: labels[key][0],
    unit: labels[key][1],
    target: values[key],
    source: SOURCE,
  }));
}

export function nutrientLabel(key: NutrientKey): string {
  return labels[key][0];
}
