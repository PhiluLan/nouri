export type NutrientKey = 'protein' | 'fiber' | 'water' | 'alphaLinolenicAcid' | 'epaDha' | 'dha' | 'linoleicAcid'
  | 'biotin' | 'vitaminB12' | 'folate' | 'niacin' | 'pantothenicAcid' | 'riboflavin' | 'thiamin'
  | 'vitaminA' | 'vitaminB6' | 'vitaminC' | 'vitaminD' | 'vitaminE' | 'vitaminK'
  | 'calcium' | 'chloride' | 'copper' | 'fluoride' | 'iodine' | 'iron' | 'magnesium' | 'manganese'
  | 'molybdenum' | 'phosphorus' | 'potassium' | 'selenium' | 'sodium' | 'zinc';

const nutrientNumbers: Record<Exclude<NutrientKey, 'epaDha'>, string[]> = {
  protein: ['203'], fiber: ['291'], water: ['255'], alphaLinolenicAcid: ['851'], dha: ['621'], linoleicAcid: ['618'],
  biotin: ['416'], vitaminB12: ['418'], folate: ['435', '417'], niacin: ['406'], pantothenicAcid: ['410'], riboflavin: ['405'], thiamin: ['404'],
  vitaminA: ['320'], vitaminB6: ['415'], vitaminC: ['401'], vitaminD: ['328'], vitaminE: ['323'], vitaminK: ['430'],
  calcium: ['301'], chloride: ['311'], copper: ['312'], fluoride: ['313'], iodine: ['314'], iron: ['303'], magnesium: ['304'], manganese: ['315'],
  molybdenum: ['316'], phosphorus: ['305'], potassium: ['306'], selenium: ['317'], sodium: ['307'], zinc: ['309'],
};

export const desiredUnits: Record<NutrientKey, 'g' | 'mg' | 'µg' | 'ml'> = {
  protein: 'g', fiber: 'g', water: 'ml', alphaLinolenicAcid: 'g', epaDha: 'mg', dha: 'mg', linoleicAcid: 'g',
  biotin: 'µg', vitaminB12: 'µg', folate: 'µg', niacin: 'mg', pantothenicAcid: 'mg', riboflavin: 'mg', thiamin: 'mg',
  vitaminA: 'µg', vitaminB6: 'mg', vitaminC: 'mg', vitaminD: 'µg', vitaminE: 'mg', vitaminK: 'µg',
  calcium: 'mg', chloride: 'mg', copper: 'mg', fluoride: 'mg', iodine: 'µg', iron: 'mg', magnesium: 'mg', manganese: 'mg',
  molybdenum: 'µg', phosphorus: 'mg', potassium: 'mg', selenium: 'µg', sodium: 'mg', zinc: 'mg',
};

export function extractNutrients(raw: unknown[]): Partial<Record<NutrientKey, number>> {
  const result: Partial<Record<NutrientKey, number>> = {};
  for (const key of Object.keys(nutrientNumbers) as Exclude<NutrientKey, 'epaDha'>[]) {
    for (const number of nutrientNumbers[key]) {
      const found = raw.find((entry) => nutrientNumber(entry) === number);
      const amount = nutrientAmount(found); const unit = nutrientUnit(found);
      if (amount !== null && unit) { result[key] = round(convert(amount, unit, desiredUnits[key])); break; }
    }
  }
  const epa = raw.find((entry) => nutrientNumber(entry) === '629');
  const dha = raw.find((entry) => nutrientNumber(entry) === '621');
  const epaAmount = nutrientAmount(epa); const dhaAmount = nutrientAmount(dha);
  const epaUnit = nutrientUnit(epa); const dhaUnit = nutrientUnit(dha);
  if (epaAmount !== null && dhaAmount !== null && epaUnit && dhaUnit) result.epaDha = round(convert(epaAmount, epaUnit, 'mg') + convert(dhaAmount, dhaUnit, 'mg'));
  return result;
}

function nutrientNumber(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as { nutrientNumber?: string; nutrient?: { number?: string } };
  return item.nutrientNumber ?? item.nutrient?.number ?? null;
}
function nutrientAmount(value: unknown): number | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as { value?: number; amount?: number };
  const amount = item.value ?? item.amount;
  return typeof amount === 'number' && Number.isFinite(amount) ? amount : null;
}
function nutrientUnit(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as { unitName?: string; nutrient?: { unitName?: string } };
  return item.unitName ?? item.nutrient?.unitName ?? null;
}
function convert(amount: number, fromRaw: string, to: 'g' | 'mg' | 'µg' | 'ml'): number {
  const from = fromRaw.toLowerCase().replace('ug', 'µg');
  if (to === 'ml' || from === to) return amount;
  if (from === 'g' && to === 'mg') return amount * 1000;
  if (from === 'g' && to === 'µg') return amount * 1_000_000;
  if (from === 'mg' && to === 'g') return amount / 1000;
  if (from === 'mg' && to === 'µg') return amount * 1000;
  if (from === 'µg' && to === 'mg') return amount / 1000;
  if (from === 'µg' && to === 'g') return amount / 1_000_000;
  return amount;
}
function round(value: number) { return Math.round(value * 10_000) / 10_000; }
