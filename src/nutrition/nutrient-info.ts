import type { NutrientKey } from '../types/domain';

export interface NutrientInfo {
  icon: string;
  simple: string;
  roles: string[];
  foods: string[];
}

export const nutrientInfo: Record<NutrientKey, NutrientInfo> = {
  protein: info('◇', 'Protein besteht aus Aminosäuren – den Bausteinen vieler Körperstrukturen.', ['Muskeln und Gewebe erhalten', 'Enzyme und Botenstoffe bilden', 'Zellen erneuern'], ['Hülsenfrüchte', 'Tofu', 'Eier', 'Milchprodukte', 'Fisch oder Fleisch']),
  fiber: info('≈', 'Nahrungsfasern sind pflanzliche Bestandteile, die nur teilweise verdaut werden.', ['Verdauung unterstützen', 'Darmbakterien Nahrung geben', 'Länger satt halten'], ['Vollkorn', 'Bohnen & Linsen', 'Gemüse', 'Obst', 'Nüsse & Samen']),
  water: info('◌', 'Wasser ist der wichtigste Bestandteil unserer Körperflüssigkeiten.', ['Stoffe transportieren', 'Körpertemperatur regulieren', 'Zellen und Organe versorgen'], ['Wasser', 'Ungesüsster Tee', 'Suppen', 'Wasserreiches Obst & Gemüse']),
  alphaLinolenicAcid: info('ω', 'Alpha-Linolensäure (ALA) ist eine essenzielle pflanzliche Omega-3-Fettsäure.', ['Zellmembranen aufbauen', 'Als Ausgangsstoff für weitere Omega-3-Fettsäuren dienen'], ['Rapsöl', 'Leinsamen', 'Chiasamen', 'Walnüsse']),
  epaDha: info('ω', 'EPA und DHA sind langkettige Omega-3-Fettsäuren.', ['Zellmembranen mitbilden', 'Normale Herz- und Gehirnfunktionen unterstützen'], ['Fettreicher Fisch', 'Algenöl', 'Angereicherte Lebensmittel']),
  dha: info('◎', 'DHA ist eine Omega-3-Fettsäure und wichtiger Bestandteil von Nervenzellen.', ['Gehirnstruktur mitbilden', 'Netzhaut des Auges mitbilden'], ['Fettreicher Fisch', 'Algenöl', 'Angereicherte Lebensmittel']),
  linoleicAcid: info('ω', 'Linolsäure ist eine essenzielle Omega-6-Fettsäure.', ['Zellmembranen aufbauen', 'Hautbarriere unterstützen'], ['Pflanzenöle', 'Nüsse', 'Samen']),
  biotin: info('B', 'Biotin gehört zu den B-Vitaminen und hilft Enzymen bei ihrer Arbeit.', ['Fette und Kohlenhydrate verwerten', 'Stoffwechselreaktionen ermöglichen'], ['Eier', 'Nüsse', 'Haferflocken', 'Hülsenfrüchte']),
  vitaminB12: info('B₁₂', 'Vitamin B12 ist ein wasserlösliches Vitamin, das der Körper speichern kann.', ['Blutbildung unterstützen', 'Nervenfunktion erhalten', 'Erbgut aufbauen'], ['Fisch & Fleisch', 'Eier', 'Milchprodukte', 'Angereicherte vegane Produkte']),
  folate: info('B₉', 'Folat ist ein B-Vitamin, das besonders bei Zellteilung gebraucht wird.', ['Neue Zellen bilden', 'Erbgut aufbauen', 'Blutbildung unterstützen'], ['Blattgemüse', 'Hülsenfrüchte', 'Orangen', 'Vollkorn']),
  niacin: info('B₃', 'Niacin ist ein B-Vitamin und Teil wichtiger Stoffwechselhelfer.', ['Energie aus Nahrung gewinnen', 'Nerven und Haut unterstützen'], ['Fisch & Fleisch', 'Erdnüsse', 'Pilze', 'Vollkorn']),
  pantothenicAcid: info('B₅', 'Pantothensäure ist ein B-Vitamin und Baustein von Coenzym A.', ['Energie umsetzen', 'Fettsäuren auf- und abbauen'], ['Eier', 'Pilze', 'Vollkorn', 'Fleisch', 'Hülsenfrüchte']),
  riboflavin: info('B₂', 'Riboflavin unterstützt zahlreiche Reaktionen im Energiestoffwechsel.', ['Energie bereitstellen', 'Zellen vor oxidativem Stress schützen'], ['Milchprodukte', 'Eier', 'Fleisch', 'Mandeln']),
  thiamin: info('B₁', 'Thiamin hilft, Kohlenhydrate in nutzbare Energie umzuwandeln.', ['Energiestoffwechsel ermöglichen', 'Nervenfunktion unterstützen'], ['Vollkorn', 'Hülsenfrüchte', 'Schweinefleisch', 'Samen']),
  vitaminA: info('A', 'Vitamin A umfasst Stoffe, die unter anderem für Sehen und Zellwachstum wichtig sind.', ['Sehvorgang ermöglichen', 'Haut und Schleimhäute erhalten', 'Immunsystem unterstützen'], ['Karotten', 'Spinat', 'Eier', 'Milchprodukte', 'Leber']),
  vitaminB6: info('B₆', 'Vitamin B6 wirkt als Helfer bei vielen Eiweiss-Stoffwechselreaktionen.', ['Aminosäuren verwerten', 'Blutfarbstoff bilden', 'Nervenfunktion unterstützen'], ['Fisch & Fleisch', 'Kartoffeln', 'Kichererbsen', 'Bananen']),
  vitaminC: info('C', 'Vitamin C ist wasserlöslich und wirkt als Antioxidans.', ['Bindegewebe und Kollagen bilden', 'Pflanzliches Eisen besser aufnehmen', 'Zellen schützen'], ['Peperoni', 'Zitrusfrüchte', 'Beeren', 'Broccoli']),
  vitaminD: info('D', 'Vitamin D kann der Körper mithilfe von Sonnenlicht selbst bilden; Nahrung trägt ergänzend bei.', ['Calcium aufnehmen', 'Knochen und Muskeln unterstützen'], ['Fettreicher Fisch', 'Eigelb', 'Angereicherte Lebensmittel']),
  vitaminE: info('E', 'Vitamin E ist ein fettlösliches Antioxidans.', ['Zellmembranen vor oxidativem Stress schützen'], ['Pflanzenöle', 'Nüsse', 'Samen']),
  vitaminK: info('K', 'Vitamin K ist ein fettlösliches Vitamin.', ['Normale Blutgerinnung ermöglichen', 'Knochenstoffwechsel unterstützen'], ['Grünes Blattgemüse', 'Broccoli', 'Pflanzenöle']),
  calcium: info('Ca', 'Calcium ist der mengenmässig wichtigste Mineralstoff des Körpers.', ['Knochen und Zähne aufbauen', 'Muskeln anspannen', 'Nervensignale übertragen'], ['Milchprodukte', 'Calciumreicher Tofu', 'Grünkohl', 'Angereicherte Pflanzendrinks']),
  chloride: info('Cl', 'Chlorid ist ein Elektrolyt und meist Bestandteil von Kochsalz.', ['Flüssigkeitshaushalt regulieren', 'Magensäure bilden', 'Säure-Basen-Haushalt unterstützen'], ['Kochsalz', 'Brot', 'Käse', 'Viele verarbeitete Lebensmittel']),
  copper: info('Cu', 'Kupfer ist ein Spurenelement und Bestandteil vieler Enzyme.', ['Eisenstoffwechsel unterstützen', 'Bindegewebe bilden', 'Nervenfunktion unterstützen'], ['Nüsse & Samen', 'Vollkorn', 'Hülsenfrüchte', 'Meeresfrüchte']),
  fluoride: info('F', 'Fluorid ist ein Spurenelement, das vor allem für die Zähne relevant ist.', ['Zahnschmelz härten', 'Widerstandskraft der Zähne unterstützen'], ['Fluoridiertes Salz', 'Tee', 'Trinkwasser – je nach Region']),
  iodine: info('I', 'Jod ist ein Spurenelement und Baustein der Schilddrüsenhormone.', ['Schilddrüsenhormone bilden', 'Energiestoffwechsel mitsteuern'], ['Jodiertes Salz', 'Meeresfisch', 'Milchprodukte', 'Eier']),
  iron: info('Fe', 'Eisen ist ein Spurenelement und Bestandteil des roten Blutfarbstoffs.', ['Sauerstoff transportieren', 'Energiegewinnung unterstützen'], ['Fleisch', 'Linsen & Bohnen', 'Tofu', 'Kerne & Samen']),
  magnesium: info('Mg', 'Magnesium ist ein Mineralstoff und Helfer vieler Enzyme.', ['Muskeln und Nerven unterstützen', 'Energie umsetzen', 'Knochen mitaufbauen'], ['Nüsse & Samen', 'Vollkorn', 'Hülsenfrüchte', 'Grünes Gemüse']),
  manganese: info('Mn', 'Mangan ist ein Spurenelement und Bestandteil verschiedener Enzyme.', ['Stoffwechselreaktionen ermöglichen', 'Knochenbildung unterstützen'], ['Vollkorn', 'Nüsse', 'Tee', 'Hülsenfrüchte']),
  molybdenum: info('Mo', 'Molybdän ist ein Spurenelement, das als Enzymhelfer wirkt.', ['Bestimmte schwefelhaltige Stoffe abbauen', 'Stoffwechselreaktionen ermöglichen'], ['Hülsenfrüchte', 'Getreide', 'Nüsse']),
  phosphorus: info('P', 'Phosphor liegt im Körper überwiegend als Phosphat vor.', ['Knochen und Zähne aufbauen', 'Energie in Zellen übertragen', 'Zellmembranen mitbilden'], ['Milchprodukte', 'Fleisch & Fisch', 'Hülsenfrüchte', 'Nüsse']),
  potassium: info('K', 'Kalium ist ein Elektrolyt und vor allem innerhalb der Zellen aktiv.', ['Flüssigkeitshaushalt regulieren', 'Nervensignale übertragen', 'Muskelfunktion unterstützen'], ['Kartoffeln', 'Bohnen', 'Gemüse', 'Obst', 'Milchprodukte']),
  selenium: info('Se', 'Selen ist ein Spurenelement und Bestandteil spezieller Enzyme.', ['Zellen vor oxidativem Stress schützen', 'Schilddrüsenstoffwechsel unterstützen'], ['Fisch', 'Eier', 'Fleisch', 'Paranüsse – kleine Mengen genügen']),
  sodium: info('Na', 'Natrium ist ein Elektrolyt und Hauptbestandteil von Kochsalz.', ['Flüssigkeitshaushalt regulieren', 'Nerven- und Muskelfunktion ermöglichen'], ['Kochsalz', 'Brot', 'Käse', 'Verarbeitete Lebensmittel – meist ist genug vorhanden']),
  zinc: info('Zn', 'Zink ist ein Spurenelement und Bestandteil zahlreicher Enzyme.', ['Immunsystem unterstützen', 'Wundheilung ermöglichen', 'Erbgut und Eiweiss aufbauen'], ['Fleisch', 'Muscheln', 'Milchprodukte', 'Hülsenfrüchte', 'Nüsse & Samen']),
};

function info(icon: string, simple: string, roles: string[], foods: string[]): NutrientInfo {
  return { icon, simple, roles, foods };
}
