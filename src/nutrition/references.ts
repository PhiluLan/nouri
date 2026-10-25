import type { NutrientKey, NutrientReference, Profile } from '../types/domain';

export const REFERENCE_SOURCE = 'BLV Schweizer Referenzwerte für die Nährstoffzufuhr';
export const REFERENCE_VERSION = 'BLV-Tabelle, publiziert 10.02.2026 (Datenstand Juni 2022)';
export const REFERENCE_PROFILE_VERSION = 2;

const labels: Record<NutrientKey, [string, NutrientReference['unit'], NutrientReference['group'], number]> = {
  protein: ['Protein', 'g', 'basis', 1], fiber: ['Nahrungsfasern', 'g', 'basis', 2], water: ['Wasser', 'ml', 'basis', 3],
  alphaLinolenicAcid: ['Alpha-Linolensäure (Omega-3)', 'g', 'fats', 2], epaDha: ['EPA + DHA (Omega-3)', 'mg', 'fats', 1], dha: ['DHA zusätzlich', 'mg', 'fats', 3], linoleicAcid: ['Linolsäure (Omega-6)', 'g', 'fats', 4],
  biotin: ['Biotin', 'µg', 'vitamins', 9], vitaminB12: ['Vitamin B12', 'µg', 'vitamins', 2], folate: ['Folat', 'µg', 'vitamins', 1], niacin: ['Niacin', 'mg', 'vitamins', 10], pantothenicAcid: ['Pantothensäure', 'mg', 'vitamins', 11], riboflavin: ['Riboflavin (B2)', 'mg', 'vitamins', 7], thiamin: ['Thiamin (B1)', 'mg', 'vitamins', 8],
  vitaminA: ['Vitamin A', 'µg', 'vitamins', 5], vitaminB6: ['Vitamin B6', 'mg', 'vitamins', 6], vitaminC: ['Vitamin C', 'mg', 'vitamins', 3], vitaminD: ['Vitamin D', 'µg', 'vitamins', 1], vitaminE: ['Vitamin E', 'mg', 'vitamins', 4], vitaminK: ['Vitamin K', 'µg', 'vitamins', 12],
  calcium: ['Calcium', 'mg', 'minerals', 1], chloride: ['Chlorid', 'mg', 'minerals', 12], copper: ['Kupfer', 'mg', 'minerals', 8], fluoride: ['Fluorid', 'mg', 'minerals', 13], iodine: ['Jod', 'µg', 'minerals', 2], iron: ['Eisen', 'mg', 'minerals', 3], magnesium: ['Magnesium', 'mg', 'minerals', 4], manganese: ['Mangan', 'mg', 'minerals', 10], molybdenum: ['Molybdän', 'µg', 'minerals', 14], phosphorus: ['Phosphor', 'mg', 'minerals', 9], potassium: ['Kalium', 'mg', 'minerals', 5], selenium: ['Selen', 'µg', 'minerals', 7], sodium: ['Natrium', 'mg', 'minerals', 11], zinc: ['Zink', 'mg', 'minerals', 6],
};

type ReferenceInput = Pick<Profile, 'birth_year' | 'sex' | 'weight_kg' | 'life_stage' | 'menopause_status' | 'phytate_level'>;
type Add = (key: NutrientKey, target: number, targetMax?: number, note?: string) => void;

export function referenceProfileIsComplete(profile: Partial<Profile> | null | undefined): profile is Profile {
  return Boolean(profile?.onboarded_at && (profile.reference_profile_version ?? 0) >= REFERENCE_PROFILE_VERSION
    && (profile.sex === 'female' || profile.sex === 'male')
    && typeof profile.weight_kg === 'number' && profile.weight_kg >= 30 && profile.weight_kg <= 300
    && profile.life_stage && profile.menopause_status && profile.phytate_level);
}

/** Selects official adult intake references. These are not biomarkers or diagnoses. */
export function referencesFor(profile: ReferenceInput, currentYear = new Date().getFullYear()): NutrientReference[] {
  if ((profile.sex !== 'female' && profile.sex !== 'male') || !profile.weight_kg) return [];
  const age = Math.max(18, currentYear - profile.birth_year);
  const older = age > 65;
  const female = profile.sex === 'female';
  const pregnant = profile.life_stage.startsWith('pregnant');
  const lactating = profile.life_stage.startsWith('lactating');
  const lifeStage = pregnant || lactating;
  const values: NutrientReference[] = [];
  const add: Add = (key, target, targetMax, note) => values.push({
    key, label: labels[key][0], unit: labels[key][1], group: labels[key][2], priority: labels[key][3],
    target: round(target), targetMax: targetMax === undefined ? undefined : round(targetMax),
    kind: targetMax === undefined ? 'minimum' : 'range', source: REFERENCE_SOURCE, note,
  });

  const energy = energyRange(female, older, profile.life_stage);
  add('fiber', older && !lifeStage ? 25 : 30, older && !lifeStage ? 30 : undefined);
  add('alphaLinolenicAcid', energy[0] * 0.005 / 9, energy[1] * 0.005 / 9, 'Aus 0,5 % der Referenzenergie abgeleitet.');
  add('epaDha', 250);
  if (lifeStage) add('dha', 100, 200);
  add('linoleicAcid', energy[0] * 0.04 / 9, energy[1] * 0.04 / 9, 'Aus 4 % der Referenzenergie abgeleitet.');

  const proteinFactor = older && !lifeStage ? 1 : 0.83;
  const proteinMaxFactor = older && !lifeStage ? 1.2 : proteinFactor;
  const proteinExtra = profile.life_stage === 'pregnant_t1' ? 1 : profile.life_stage === 'pregnant_t2' ? 9 : profile.life_stage === 'pregnant_t3' ? 28 : profile.life_stage === 'lactating_0_6' ? 19 : profile.life_stage === 'lactating_over_6' ? 13 : 0;
  add('protein', profile.weight_kg * proteinFactor + proteinExtra, older && !lifeStage ? profile.weight_kg * proteinMaxFactor + proteinExtra : undefined, 'Gewichtsbezogen berechnet.');
  add('water', lactating ? 2700 : pregnant ? 2000 : older ? 1400 : female ? 2000 : 2500, pregnant ? 2300 : older ? 1500 : undefined, older ? 'BLV-Angabe für Getränke.' : undefined);

  if (older && !lifeStage) addOlderVitamins(add, female);
  else addAdultVitamins(add, female, profile.life_stage, energy);
  if (older && !lifeStage) addOlderMinerals(add, female);
  else addAdultMinerals(add, female, age, profile.life_stage, profile.menopause_status, profile.phytate_level);
  return values.sort((a, b) => groupOrder(a.group) - groupOrder(b.group) || a.priority - b.priority);
}

function addAdultVitamins(add: Add, female: boolean, stage: Profile['life_stage'], energy: [number, number]) {
  const pregnant = stage.startsWith('pregnant');
  const lactating = stage.startsWith('lactating');
  add('biotin', lactating ? 45 : 40);
  add('vitaminB12', pregnant ? 4.5 : lactating ? 5 : 4);
  add('folate', pregnant ? 550 : lactating ? 450 : 330, undefined, pregnant ? 'Zusätzlich empfiehlt das BLV 400 µg Folsäure als Supplement.' : undefined);
  add('niacin', energy[0] * 0.004184 * 1.6, energy[1] * 0.004184 * 1.6, 'Aus 1,6 mg Niacin-Äquivalent pro MJ abgeleitet.');
  add('pantothenicAcid', lactating ? 7 : 5);
  add('riboflavin', pregnant ? 1.9 : lactating ? 2 : 1.6);
  add('thiamin', energy[0] * 0.004184 * 0.1, energy[1] * 0.004184 * 0.1, 'Aus 0,1 mg pro MJ abgeleitet.');
  add('vitaminA', pregnant ? 700 : lactating ? 1300 : female ? 650 : 750);
  add('vitaminB6', pregnant ? 1.8 : lactating ? 1.7 : female ? 1.6 : 1.7);
  add('vitaminC', pregnant ? 105 : lactating ? 155 : female ? 95 : 110);
  add('vitaminD', 15); add('vitaminE', female ? 11 : 13); add('vitaminK', 70);
}

function addOlderVitamins(add: Add, female: boolean) {
  add('biotin', 40); add('vitaminB12', 2.4, 3); add('folate', 300, 400);
  add('niacin', female ? 11 : 14, female ? 14 : 16); add('pantothenicAcid', 5);
  add('riboflavin', female ? 1 : 1.3, female ? 1.1 : undefined); add('thiamin', female ? 1 : 1.1, female ? 1.1 : 1.2);
  add('vitaminA', female ? 700 : 900, female ? 800 : 1000); add('vitaminB6', female ? 1.2 : 1.4, female ? 1.5 : 1.7);
  add('vitaminC', female ? 75 : 90, female ? 95 : 110); add('vitaminD', 20); add('vitaminE', female ? 11 : 12, 15); add('vitaminK', female ? 65 : 80, female ? 90 : 120);
}

function addAdultMinerals(add: Add, female: boolean, age: number, stage: Profile['life_stage'], menopause: Profile['menopause_status'], phytate: Profile['phytate_level']) {
  const pregnant = stage.startsWith('pregnant'); const lactating = stage.startsWith('lactating');
  add('calcium', age <= 24 ? 1000 : 950); add('chloride', 3100); add('copper', pregnant || lactating ? 1.5 : female ? 1.3 : 1.6); add('fluoride', female ? 2.9 : 3.4);
  add('iodine', pregnant || lactating ? 250 : 150); add('iron', pregnant ? 30 : lactating ? 20 : female && menopause !== 'post' ? 16 : 11);
  add('magnesium', female ? 300 : 350); add('manganese', 3); add('molybdenum', 65); add('phosphorus', 550); add('potassium', lactating ? 4000 : 3500); add('selenium', lactating ? 85 : 70); add('sodium', 2000);
  const zincValues = pregnant ? [9.1, 10.9, 12.6, 14.3] : lactating ? [10.4, 12.2, 13.9, 15.6] : female ? [7.5, 9.3, 11, 12.7] : [9.4, 11.7, 14, 16.3];
  add('zinc', zincValues[{ low: 0, medium: 1, high: 2, very_high: 3 }[phytate]], undefined, 'An die Phytatzufuhr angepasst.');
}

function addOlderMinerals(add: Add, female: boolean) {
  add('calcium', 1000, 1200); add('chloride', female ? 2000 : 1800, 2300); add('copper', 0.9, 1.5); add('fluoride', female ? 3 : 3.8, female ? 3.1 : 4);
  add('iodine', 150); add('iron', 8, 10); add('magnesium', female ? 300 : 350, female ? 320 : 420); add('manganese', 3); add('molybdenum', 65); add('phosphorus', 700); add('potassium', 4000, 4700); add('selenium', 55, female ? 60 : 70); add('sodium', 1200, 1500); add('zinc', female ? 7 : 11, female ? 10 : 16, 'BLV-Bereich abhängig von der Phytatzufuhr.');
}

function energyRange(female: boolean, older: boolean, stage: Profile['life_stage']): [number, number] {
  const base: [number, number] = older ? (female ? [1700, 2100] : [2100, 2800]) : female ? [1861, 2147] : [2305, 2672];
  const extra = stage === 'pregnant_t1' ? 70 : stage === 'pregnant_t2' ? 260 : stage === 'pregnant_t3' || stage.startsWith('lactating') ? 500 : 0;
  return [base[0] + extra, base[1] + extra];
}

function groupOrder(group: NutrientReference['group']) { return ['basis', 'fats', 'vitamins', 'minerals'].indexOf(group); }
function round(value: number) { return Math.round(value * 10) / 10; }
export function nutrientLabel(key: NutrientKey): string { return labels[key][0]; }
