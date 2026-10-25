# nouri

Ein eigenständiges Expo/React-Native-MVP für iOS: Mahlzeit in Alltagssprache eingeben, erkannte Lebensmittel und Mengen korrigieren, dokumentierte Nährstoffwerte verstehen und bis zu drei passende Lebensmittelvorschläge erhalten.

## Was funktioniert

- E-Mail-/Passwort-Authentifizierung mit Supabase
- Onboarding mit Altersgruppe, Referenzgruppe, Gewicht (optional), Schwangerschaft/Stillzeit, Ernährungsweise und Allergien
- serverseitiges, strukturiertes Meal-Parsing über die OpenAI Responses API
- serverseitiger Abgleich jedes Lebensmittels mit USDA FoodData Central (FDC-ID und Quelllink werden gespeichert)
- Korrektur von Namen und Mengen; ein geänderter Name muss vor dem Speichern erneut mit USDA abgeglichen werden
- deterministische Skalierung `Wert pro 100 g × Gramm / 100` im Client und nochmals in der Datenbank
- Tagescheck mit Datenabdeckung statt erfundener Nullwerte
- Speichern, Bearbeiten und Löschen von Mahlzeiten
- einfache 7-Tage-Übersicht
- maximal drei regelbasierte Vorschläge unter Beachtung der erfassten Einschränkungen
- native iOS-Tabnavigation und ein ruhiges, barrierearmes Designsystem
- geführter Zwei-Schritt-Erfassungsflow mit Beispielen, klarer Quellenanzeige und haptischem Feedback
- Pull-to-refresh, verständliche Lade-, Leer- und Fehlerzustände sowie direkte Übernahme einer Empfehlung
- bearbeitbares Profil mit Referenzparametern, Ernährungsfiltern und selbstständigem Löschen aller Mahlzeitendaten
- Supabase Auth mit bestätigten E-Mail-Adressen, mindestens 8 Zeichen und Schutz gegen bekannte kompromittierte Passwörter

Die App ist bewusst **keine Kalorienzähl-App**. Sie diagnostiziert weder Nährstoffmängel noch Krankheiten. Erfasste Zufuhr ist nicht gleich körperlicher Versorgungsstatus.

## Architektur

```text
Expo iOS App
  ├─ Supabase Auth
  ├─ Postgres Data API → RLS-geschützte Profile/Mahlzeiten
  └─ Authenticated Edge Function
       ├─ OpenAI Structured Output → Lebensmittel + geschätzte Gramm
       └─ USDA FoodData Central → dokumentierte Nährstoffwerte

Nutrition Engine (deterministisch)
  ├─ skaliert USDA-Werte auf die Portion
  ├─ markiert unvollständige Daten
  ├─ ordnet gegen Referenzwerte ein
  └─ wählt regelbasiert höchstens 3 Lebensmittel
```

Wesentliche Entscheidungen stehen in [docs/TECHNICAL_DECISIONS.md](docs/TECHNICAL_DECISIONS.md).

## Benötigte externe Zugänge

1. Supabase-Projekt: Project URL und **Publishable Key**
2. [USDA FoodData Central API Key](https://fdc.nal.usda.gov/api-key-signup.html)
3. OpenAI API Key und ein für Structured Outputs verfügbares Modell
4. Für TestFlight: Apple Developer Account und Expo/EAS Account

Der OpenAI- und USDA-Schlüssel gehört ausschließlich in Supabase Secrets. Ein Supabase Secret/Service-Role-Key darf niemals in `EXPO_PUBLIC_*` stehen.

## Lokaler Start

Voraussetzungen: Node.js 22.13+, npm und für den lokalen Backend-Stack Docker Desktop.

### Sofortvorschau auf dem iPhone (ohne Backend)

```bash
npm run preview
```

Anschließend den QR-Code mit Expo Go auf einem iPhone im selben WLAN öffnen. Dieser Modus ist in der Oberfläche deutlich als **lokale Vorschau mit Testdaten** markiert, speichert nichts in Supabase und verwendet keine Produktionswerte.

### Vollständiger lokaler Stack

```bash
npm install
cp .env.example .env
npx supabase@latest start
```

Die lokale Supabase-Ausgabe liefert API URL und Publishable Key. Diese in `.env` eintragen:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<lokaler publishable/anon key>
```

Edge-Function-Secrets lokal in `supabase/.env.local` setzen (Datei nicht committen):

```dotenv
OPENAI_API_KEY=<secret>
OPENAI_MODEL=gpt-5-mini
USDA_API_KEY=<secret>
```

Dann in getrennten Terminals:

```bash
npx supabase@latest functions serve analyze-meal --env-file supabase/.env.local
npm run ios
```

Ohne Xcode kann die App mit `npm start` und einem kompatiblen Development Build geöffnet werden. Außerhalb des expliziten Preview-Skripts verwendet die App keine Mockdaten; bei fehlender Konfiguration zeigt sie einen klaren Setup-Zustand.

## Supabase Deployment

```bash
npx supabase@latest login
npx supabase@latest link --project-ref <project-ref>
npx supabase@latest db push
npx supabase@latest secrets set OPENAI_API_KEY=<secret> USDA_API_KEY=<secret> OPENAI_MODEL=gpt-5-mini
npx supabase@latest functions deploy analyze-meal
```

Danach `.env` mit der Produktions-URL und dem Publishable Key befüllen. In Produktion E-Mail-Bestätigung, eigene SMTP-Zustellung und passende Redirect-URLs in Supabase Auth konfigurieren.

## TestFlight / EAS

Vor dem ersten Build in `app.json` die eigene `ios.bundleIdentifier` prüfen und anschließend:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --profile production
```

`eas.json` enthält bereits Development-, Preview- und Production-Profile. Apple-Credentials werden über EAS verwaltet und nicht im Repository gespeichert.

## Verifikation

```bash
npm run typecheck
npm run typecheck:functions
npm test
npx expo-doctor
npx supabase@latest db reset
```

Ergebnis vom 25.10.2026 nach Level 2:

- App- und Edge-Function-TypeScript: bestanden
- Unit- und Integrations-Vertragstests: 12/12 bestanden
- ESLint: bestanden (0 Fehler, 0 Warnungen)
- Expo Doctor: 20/20 Checks bestanden
- iOS JavaScript/Hermes-Bundle: erfolgreich erzeugt
- Supabase-Migration: im lokalen Postgres-17-Stack erfolgreich angewandt
- Externe End-to-End-Analyse: erfolgreich mit Auth, OpenAI-Parsing, korrigierter 120-g-Portion, passenden USDA-Zuordnungen und Supabase-Speicherung geprüft
- Supabase Security Advisor: keine offenen Hinweise
- npm Audit: 5 hohe transitive Warnungen in Expo-CLI-Buildabhängigkeiten (`node-forge`, `zod`); der automatische Fix schlägt einen inkompatiblen Downgrade auf Expo 44 vor und wurde deshalb nicht angewandt. Vor Release gegen ein aktualisiertes Expo-SDK erneut prüfen.

## Bekannte Punkte

- Das MVP ist auf Erwachsene ab 18 Jahren begrenzt.
- Portionen ohne Mengenangabe bleiben sichtbar als unsicher markiert.
- Zusammengesetzte Gerichte werden in Hauptbestandteile zerlegt; Rezeptdetails können fehlen und müssen geprüft werden.
- USDA-Suche arbeitet mit einem vom Parser erzeugten englischen Suchbegriff. Unsichere Zuordnungen werden markiert.
- Die Referenzengine deckt zunächst acht handlungsrelevante Nährstoffe ab. Eine spätere Version sollte die vollständige BLV-Referenztabelle versioniert importieren.
- Für einen App-Store-Release sind zusätzlich veröffentlichte Datenschutz- und Support-URLs, ein vollständiger Account-Löschprozess, Accessibility-Audit und Beta-Evaluation mit vielfältigen echten Mahlzeiten erforderlich.

## Quellen

- [Schweizer Referenzwerte für die Nährstoffzufuhr (BLV)](https://www.blv.admin.ch/de/naehrstoffzufuhr)
- [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide/)
- [OpenAI Responses API – Structured Outputs](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [Supabase Auth mit React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Supabase Edge Functions absichern](https://supabase.com/docs/guides/functions/auth)
