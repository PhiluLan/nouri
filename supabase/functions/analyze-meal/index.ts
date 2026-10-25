import { withSupabase } from 'npm:@supabase/server@1';

type Confidence = 'high' | 'medium' | 'low';
type NutrientKey = 'protein' | 'fiber' | 'calcium' | 'iron' | 'potassium' | 'vitaminC' | 'vitaminB12' | 'folate';

interface ParsedItem {
  food_name_de: string;
  search_query_en: string;
  amount_g: number;
  portion_label: string;
  quantity_confidence: Confidence;
  notes: string;
}

interface FoodSearchResult {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients?: unknown[];
}

const nutrientNumbers: Record<NutrientKey, string[]> = {
  protein: ['203'],
  fiber: ['291'],
  calcium: ['301'],
  iron: ['303'],
  potassium: ['306'],
  vitaminC: ['401'],
  vitaminB12: ['418'],
  folate: ['435', '417'],
};

const handler = withSupabase({ auth: 'user' }, async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const openAiKey = Deno.env.get('OPENAI_API_KEY');
  const usdaKey = Deno.env.get('USDA_API_KEY');
  if (!openAiKey || !usdaKey) return json({ error: 'server_configuration_missing', message: 'OPENAI_API_KEY oder USDA_API_KEY fehlt.' }, 503);

  let text = '';
  try {
    const body = await request.json();
    text = typeof body?.text === 'string' ? body.text.trim() : '';
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (text.length < 2 || text.length > 2000) return json({ error: 'invalid_text', message: 'Text muss 2 bis 2000 Zeichen enthalten.' }, 400);

  try {
    const parsed = await parseMeal(text, openAiKey);
    const items = await Promise.all(parsed.map((item) => enrichWithUsda(item, usdaKey)));
    const warnings = items.flatMap((item) => {
      const result: string[] = [];
      if (item.quantity_confidence !== 'high') result.push(`Menge für „${item.display_name}“ ist geschätzt.`);
      if (item.match_confidence === 'low') result.push(`USDA-Zuordnung für „${item.display_name}“ bitte prüfen.`);
      if (item.missing_nutrients.length) result.push(`Für „${item.display_name}“ fehlen ${item.missing_nutrients.length} der betrachteten Nährstoffwerte.`);
      return result;
    });
    return json({ raw_text: text, items, warnings });
  } catch (error) {
    console.error('analyze-meal failed', error);
    return json({ error: 'analysis_failed', message: error instanceof Error ? error.message : 'Unbekannter Fehler' }, 502);
  }
});

export default { fetch: handler };

async function parseMeal(text: string, apiKey: string): Promise<ParsedItem[]> {
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['items'],
    properties: {
      items: {
        type: 'array', minItems: 1, maxItems: 12,
        items: {
          type: 'object', additionalProperties: false,
          required: ['food_name_de', 'search_query_en', 'amount_g', 'portion_label', 'quantity_confidence', 'notes'],
          properties: {
            food_name_de: { type: 'string' },
            search_query_en: { type: 'string' },
            amount_g: { type: 'number', minimum: 0.1, maximum: 5000 },
            portion_label: { type: 'string' },
            quantity_confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            notes: { type: 'string' },
          },
        },
      },
    },
  };
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-5-mini',
      instructions: [
        'Du zerlegst deutschsprachige Mahlzeiten in einzelne Lebensmittel.',
        'Gib keine Nährstoffwerte aus. Erfinde keine Marken oder Zutaten.',
        'Konvertiere Volumen und übliche Portionen in eine plausible essbare Masse in Gramm.',
        'Wenn eine Menge fehlt, nutze eine konservative typische Portion und markiere quantity_confidence als low.',
        'search_query_en muss ein knapper englischer USDA-Suchbegriff inklusive Zubereitungsart sein.',
        'Bei zusammengesetzten Gerichten trenne erkennbare Hauptbestandteile; bleibe bei höchstens 12 Positionen.',
      ].join(' '),
      input: text,
      text: { format: { type: 'json_schema', name: 'parsed_meal', strict: true, schema } },
    }),
  });
  if (!response.ok) throw new Error(`OpenAI Parsing fehlgeschlagen (${response.status}).`);
  const body = await response.json();
  const outputText = body.output
    ?.flatMap((output: { content?: Array<{ type?: string; text?: string }> }) => output.content ?? [])
    .find((content: { type?: string }) => content.type === 'output_text')?.text;
  if (!outputText) throw new Error('OpenAI lieferte keine strukturierte Mahlzeit.');
  const result = JSON.parse(outputText) as { items: ParsedItem[] };
  return result.items.map((item) => ({ ...item, amount_g: round(item.amount_g) }));
}

async function enrichWithUsda(parsed: ParsedItem, apiKey: string) {
  const searchResponse = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: parsed.search_query_en, pageSize: 8, dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'] }),
  });
  if (!searchResponse.ok) throw new Error(`USDA-Suche fehlgeschlagen (${searchResponse.status}).`);
  const search = await searchResponse.json() as { foods?: FoodSearchResult[] };
  const ranked = (search.foods ?? []).map((food, index) => ({ food, score: scoreFood(food, parsed.search_query_en, index) })).sort((a, b) => b.score - a.score);
  const selected = ranked[0];
  if (!selected) return unmatched(parsed, 'Kein Eintrag in FoodData Central gefunden.');

  const detailResponse = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${selected.food.fdcId}?api_key=${encodeURIComponent(apiKey)}`);
  if (!detailResponse.ok) throw new Error(`USDA-Detailabruf fehlgeschlagen (${detailResponse.status}).`);
  const detail = await detailResponse.json() as FoodSearchResult;
  const per100g = extractNutrients(detail.foodNutrients ?? []);
  const missing = (Object.keys(nutrientNumbers) as NutrientKey[]).filter((key) => per100g[key] === undefined);
  const overlap = wordOverlap(selected.food.description, parsed.search_query_en);
  const matchConfidence: Confidence = overlap >= 0.6 ? 'high' : overlap >= 0.3 ? 'medium' : 'low';

  return {
    display_name: parsed.food_name_de,
    amount_g: parsed.amount_g,
    portion_label: parsed.portion_label,
    quantity_confidence: parsed.quantity_confidence,
    match_confidence: matchConfidence,
    fdc_id: selected.food.fdcId,
    fdc_description: selected.food.description,
    data_type: selected.food.dataType,
    nutrients_per_100g: per100g,
    nutrients_for_amount: scale(per100g, parsed.amount_g),
    missing_nutrients: missing,
    source_url: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${selected.food.fdcId}/nutrients`,
    notes: parsed.notes || null,
  };
}

function extractNutrients(raw: unknown[]): Partial<Record<NutrientKey, number>> {
  const result: Partial<Record<NutrientKey, number>> = {};
  for (const key of Object.keys(nutrientNumbers) as NutrientKey[]) {
    for (const number of nutrientNumbers[key]) {
      const found = raw.find((entry) => nutrientNumber(entry) === number);
      const amount = nutrientAmount(found);
      if (amount !== null) { result[key] = round(amount); break; }
    }
  }
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

function scoreFood(food: FoodSearchResult, query: string, index: number): number {
  const typeScore: Record<string, number> = { Foundation: 4, 'SR Legacy': 3, 'Survey (FNDDS)': 2 };
  return (typeScore[food.dataType] ?? 0) * 10 + wordOverlap(food.description, query) * 20 + Math.max(0, 8 - index);
}

function wordOverlap(description: string, query: string): number {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((word) => word.length > 2);
  const queryWords = [...new Set(normalize(query))];
  const descriptionWords = new Set(normalize(description));
  return queryWords.length ? queryWords.filter((word) => descriptionWords.has(word)).length / queryWords.length : 0;
}

function scale(values: Partial<Record<NutrientKey, number>>, amountG: number) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, round((value as number) * amountG / 100)]));
}

function unmatched(parsed: ParsedItem, notes: string) {
  return {
    display_name: parsed.food_name_de, amount_g: parsed.amount_g, portion_label: parsed.portion_label,
    quantity_confidence: parsed.quantity_confidence, match_confidence: 'low' as const,
    fdc_id: null, fdc_description: null, data_type: null,
    nutrients_per_100g: {}, nutrients_for_amount: {},
    missing_nutrients: Object.keys(nutrientNumbers), source_url: null, notes,
  };
}

function round(value: number) { return Math.round(value * 100) / 100; }

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}
