# Technische Entscheidungen

## 1. KI erkennt Struktur, nicht Nährstoffe

Die KI extrahiert Lebensmittel, englischen USDA-Suchbegriff, Portion und geschätzte Gramm über ein striktes JSON-Schema. Sie darf keine Nährstoffwerte liefern. Erst die anschließend ausgewählte FDC-ID ist die Datenquelle. So bleibt ein KI-Fehler sichtbar und korrigierbar.

## 2. Deterministische Nutrition Engine

`nutrients_per_100g` stammt aus FoodData Central. Portionswerte werden mit `per100g × amount_g / 100` berechnet. Die Postgres-Funktion `save_meal` berechnet die gespeicherten Portionswerte nochmals aus Quelle und Gramm; sie vertraut dem vom Client übermittelten Ergebnis nicht.

Für jeden betrachteten Nährstoff werden `knownItems`, `totalItems` und `complete` geführt. Ein fehlender USDA-Wert wird nicht zu `0`, sondern bleibt abwesend. Unvollständige Summen werden als „mindestens“ ausgewiesen und Empfehlungen benötigen mindestens 67 % Datenabdeckung.

## 3. Fachliche Referenzen

Die MVP-Auswahl basiert auf den Schweizer Referenzwerten des BLV (Stand im Profil versioniert). Alter, Referenzgruppe, Körpergewicht sowie Schwangerschaft/Stillzeit beeinflussen relevante Werte. Diese Werte sind populationsbezogene Zufuhrreferenzen, keine Diagnose und keine Messung des Versorgungsstatus.

Die erste Version bildet Protein, Nahrungsfasern, Calcium, Eisen, Kalium, Vitamin C, Vitamin B12 und Folat ab. Vor einer klinisch oder institutionell genutzten Version müssen Werte, Altersbänder und Fußnoten mit der vollständigen BLV-Datentabelle automatisiert abgeglichen und fachlich freigegeben werden.

## 4. Empfehlungen sind regelbasiert

Die App sortiert ausreichend dokumentierte Nährstoffe nach dem Anteil am Referenzwert und ordnet ihnen aus einem kuratierten Katalog geeignete Lebensmittel zu. Vegan-, vegetarisch-, Milch-, Laktose-, Fisch-, Ei- und Sojafilter werden berücksichtigt. Es werden keine Mengen- oder Heilversprechen gemacht und maximal drei Vorschläge gezeigt.

## 5. Datenschutz und Autorisierung

- Der Client kennt nur Supabase URL und Publishable Key.
- OpenAI- und USDA-Schlüssel liegen in Supabase Secrets.
- Alle exponierten Tabellen verwenden RLS mit `auth.uid()` und getrennten SELECT/INSERT/UPDATE/DELETE-Policies.
- UPDATE-Policies enthalten `USING` und `WITH CHECK`.
- Die atomare RPC läuft als `SECURITY INVOKER`; kein Service-Role-Zugriff ist nötig.
- Nutzer- und Fremdschlüssel sind indexiert, Tagesabfragen verwenden `(user_id, eaten_at)`.
- Die Edge Function steht am Gateway mit `verify_jwt = false`, erzwingt die Nutzer-JWT aber innerhalb der Function über `withSupabase({ auth: 'user' })`. Das vermeidet die Gateway-Inkompatibilität mit Publishable Keys, ohne anonymen Zugriff auf die Analyse zu erlauben.
- E-Mail-Anmeldungen verlangen bestätigte Adressen und mindestens acht Passwortzeichen. Supabase Auth lehnt zusätzlich Passwörter ab, die in bekannten Datenlecks vorkommen.
- Die Passwort-Wiederherstellung verwendet den registrierten App-Scheme `nouri://reset-password`. Der Client übernimmt ausschließlich kurzlebige Auth-Tokens aus dem Supabase-Link und setzt danach eine lokale Sitzung für den Passwortwechsel.
- Die vollständige Kontolöschung liegt in einer authentifizierten Edge Function. Sie entnimmt die User-ID nur den serverseitig geprüften JWT-Claims, verlangt zusätzlich eine feste Bestätigung und akzeptiert keine vom Client übermittelte User-ID. Durch `on delete cascade` verschwinden Profil, Mahlzeiten und Positionen gemeinsam mit dem Auth-Nutzer.

## 6. Datenmodell

`profiles` enthält Referenzparameter und Einschränkungen. `meals` enthält den Originaltext und Zeitpunkt. `meal_items` enthält korrigierbare Positionen, USDA-Zuordnung, Quelllink, Werte pro 100 g, deterministisch skalierte Werte und die Liste fehlender Nährstoffe. Die Normalisierung erlaubt einzelne Lebensmittel später gezielt nachzuschlagen, ohne JSON-Mahlzeiten neu schreiben zu müssen.

## 7. Produkt- und Release-Grenzen

Der MVP verzichtet bewusst auf Kalorien, Gewichtsziele, Streaks und Diagnosen. Primäre Navigation: Erfassen, Tagescheck, Empfehlungen. Bearbeiten ist ein modaler Detailflow und kein vierter Hauptscreen.

## 8. Level-2-UX

Die drei primären Bereiche verwenden ab Expo SDK 58 native Tabs mit SF Symbols auf iOS. Erfassen folgt einem expliziten Ablauf aus Beschreiben, Prüfen und Speichern. Tagescheck und Empfehlungen priorisieren Erklärung und Datenabdeckung statt Scores oder Gamification. Profil und Datenkontrolle liegen in einem modalen Sekundärbereich, damit die Hauptnavigation ruhig bleibt. Fehlende, ladende und fehlerhafte Zustände sind als eigenständige Produktzustände gestaltet; destructive Aktionen verlangen eine native Bestätigung.
