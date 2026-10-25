import type { NutrientKey } from '../types/domain';

export type BodyRegionKey = 'brain' | 'eyes' | 'heart' | 'blood' | 'digestion' | 'immune' | 'muscles' | 'bones' | 'skin';

export interface BodyRegion {
  key: BodyRegionKey;
  label: string;
  shortLabel: string;
  symbol: string;
  description: string;
  functions: string[];
  nutrients: NutrientKey[];
}

export const bodyRegions: BodyRegion[] = [
  {
    key: 'brain', label: 'Gehirn & Nerven', shortLabel: 'Gehirn', symbol: '◉',
    description: 'Diese Nährstoffe unterstützen Aufbau, Signalübertragung und normalen Energiestoffwechsel des Nervensystems.',
    functions: ['Nervensignale übertragen', 'Zellmembranen mitbilden', 'Energie für Nervenzellen bereitstellen'],
    nutrients: ['epaDha', 'iodine', 'vitaminB12', 'thiamin', 'magnesium'],
  },
  {
    key: 'eyes', label: 'Augen & Sehen', shortLabel: 'Augen', symbol: '◌',
    description: 'Sehvorgang, Netzhaut und schützende Zellstrukturen benötigen mehrere unterschiedliche Nährstoffe.',
    functions: ['Sehvorgang ermöglichen', 'Netzhaut mitbilden', 'Zellen vor oxidativem Stress schützen'],
    nutrients: ['vitaminA', 'epaDha', 'vitaminC', 'vitaminE', 'zinc'],
  },
  {
    key: 'heart', label: 'Herz & Kreislauf', shortLabel: 'Herz', symbol: '♥',
    description: 'Elektrolyte, Fettsäuren und weitere Nährstoffe tragen zur normalen Herz- und Gefässfunktion bei.',
    functions: ['Herzmuskel arbeiten lassen', 'Flüssigkeitshaushalt regulieren', 'Zellmembranen unterstützen'],
    nutrients: ['potassium', 'magnesium', 'epaDha', 'thiamin'],
  },
  {
    key: 'blood', label: 'Blut & Sauerstoff', shortLabel: 'Blut', symbol: '●',
    description: 'Blutbildung und Sauerstofftransport hängen von mehreren Nährstoffen gemeinsam ab.',
    functions: ['Blutfarbstoff bilden', 'Neue Blutzellen bilden', 'Sauerstoff transportieren'],
    nutrients: ['iron', 'folate', 'vitaminB12', 'vitaminB6', 'copper'],
  },
  {
    key: 'digestion', label: 'Darm & Verdauung', shortLabel: 'Verdauung', symbol: '≈',
    description: 'Nahrungsfasern und Flüssigkeit prägen die Verdauung; weitere Stoffe unterstützen den normalen Stoffwechsel.',
    functions: ['Verdauung unterstützen', 'Darmbakterien Nahrung geben', 'Nahrungsbestandteile transportieren'],
    nutrients: ['fiber', 'water', 'magnesium', 'chloride'],
  },
  {
    key: 'immune', label: 'Abwehr & Schutz', shortLabel: 'Abwehr', symbol: '✦',
    description: 'Das Immunsystem und die natürlichen Schutzbarrieren nutzen ein Zusammenspiel verschiedener Nährstoffe.',
    functions: ['Schutzbarrieren erhalten', 'Normale Immunfunktion unterstützen', 'Zellen vor oxidativem Stress schützen'],
    nutrients: ['vitaminA', 'vitaminC', 'vitaminD', 'zinc', 'selenium', 'protein'],
  },
  {
    key: 'muscles', label: 'Muskeln & Bewegung', shortLabel: 'Muskeln', symbol: '⌁',
    description: 'Muskelgewebe, Anspannung und Entspannung benötigen Baustoffe, Elektrolyte und Energiehelfer.',
    functions: ['Muskelgewebe erhalten', 'Anspannung und Entspannung ermöglichen', 'Energie umsetzen'],
    nutrients: ['protein', 'magnesium', 'potassium', 'calcium', 'vitaminD'],
  },
  {
    key: 'bones', label: 'Knochen & Zähne', shortLabel: 'Knochen', symbol: '◇',
    description: 'Knochen sind lebendes Gewebe. Mineralstoffe und Vitamine wirken bei Aufbau und Erhalt zusammen.',
    functions: ['Knochenstruktur aufbauen', 'Calcium verwerten', 'Zähne mineralisieren'],
    nutrients: ['calcium', 'vitaminD', 'vitaminK', 'phosphorus', 'magnesium', 'fluoride'],
  },
  {
    key: 'skin', label: 'Haut & Gewebe', shortLabel: 'Haut', symbol: '○',
    description: 'Haut und Bindegewebe brauchen Baustoffe für Erneuerung, Barriere und Kollagenbildung.',
    functions: ['Gewebe erneuern', 'Kollagen bilden', 'Hautbarriere unterstützen'],
    nutrients: ['protein', 'vitaminC', 'vitaminA', 'zinc', 'biotin', 'linoleicAcid'],
  },
];

export function bodyRegion(key: BodyRegionKey): BodyRegion {
  return bodyRegions.find((region) => region.key === key) ?? bodyRegions[0];
}
