# Definition of Done en codeconventies — Las Tapas

> **Bewijsstuk voor B1-K1-W1** (afspraken over de planning en de samenwerking, geaccordeerd door de projectgroep).
> Versie 1.0 · 8 oktober 2026

## Accordering

| Rol | Naam | Akkoord | Datum |
| --- | --- | --- | --- |
| Projectlid | Mohamed Benabdillah (145614) | ☐ | |
| Projectlid | Ahmed «achternaam invullen» | ☐ | |
| Projectlid | Eliyah Impelmans | ☐ | |
| Docent | Koen van der Hulst | ☐ | |

De afspraken hieronder gelden voor alle user stories in `docs/sprintplanning.md` en zijn door de
projectgroep vastgesteld voordat de code naar `master` gaat.

## 1. Definition of Done per user story

Een user story is pas **klaar** als alle onderstaande punten waar zijn:

- ☐ **Werkt** — de functionaliteit doet wat in de user story staat, aantoonbaar via de route of het scherm.
- ☐ **Aan de eisen voldaan** — de eisen en wensen van de opdrachtgever zijn erin terug te vinden
  (per tafel één totaalbedrag, voorraad klopt met de bestellingen, keuken en bar hebben hun eigen scherm).
- ☐ **Lint schoon** — `npm run lint` geeft geen fouten.
- ☐ **Build groen** — `npm run build` slaagt zonder typefouten.
- ☐ **Types kloppen** — TypeScript staat op `strict` (`tsconfig.json`); geen `any` en geen `@ts-ignore`
  om fouten weg te poetsen.
- ☐ **Gevalideerd** — invoer uit de URL, het formulier of de API wordt op de server gecontroleerd.
- ☐ **Veilig** — prijzen, namen en bedragen komen altijd van de server, nooit uit de browser;
  sleutels staan in `.env.local` en worden niet gecommit.
- ☐ **Getest** — er is een controle in `docs/checks/` bijgewerkt of toegevoegd, en die is groen.
- ☐ **Werkt op mobiel en desktop** — gecontroleerd op 390 × 844 en 1440 × 900.
- ☐ **Toegankelijk** — semantische HTML, `aria-hidden` op decoratie, zichtbare focus en respect voor
  `prefers-reduced-motion`.
- ☐ **Gereviewd** — minimaal één teamgenoot heeft de code bekeken en de review is verwerkt.
- ☐ **Gedocumenteerd** — `docs/documentatie.md` (changelog) en, als het de buitenkant raakt, de README bijgewerkt.
- ☐ **Gecommit en gemergd** — de story staat met een duidelijke commitboodschap op `master` en de build
  op `master` is groen.

## 2. Definition of Ready (wanneer mag een story de sprint in)

- ☐ De user story heeft een ID (US..) en staat in de productbacklog met prioriteit.
- ☐ De acceptatiecriteria zijn duidelijk genoeg om te testen.
- ☐ De afhankelijkheden (database, sleutels, ander scherm) zijn geregeld.
- ☐ De story past binnen één sprint en is opgesplitst als hij te groot is.

## 3. Codeconventies

| Onderwerp | Afspraak | Waarom |
| --- | --- | --- |
| Taal van de code | Engels voor variabelen, functies en bestandsnamen; Nederlands voor tekst die de gebruiker ziet | Aansluiten bij Next.js en React, maar de gast leest Nederlands |
| Bestandsnamen | Componenten `PascalCase`, route- en lib-bestanden `kebab-case` | Zelfde stijl als het framework |
| Logica scheiden | Pure rekenlogica in `lib/`, bijvoorbeeld `lib/inventory.ts` en `lib/payments.ts`; API-routes in `app/api/…/route.ts` | Dezelfde functie wordt door meerdere schermen gebruikt en is los te testen |
| Types | Types en constanten bij de logica, geen losse getallen in de code | Voorkomt fouten bij status en voorraad |
| Styling | Eén `app/globals.css` voor de huisstijl, Tailwind voor layout | De huisstijl is zo in één keer over alle pagina's te wijzigen |
| Netheid | Geen `console.log` in productiecode, geen uitgecommentarieerde blokken | Rustige code en een schone build |
| Secrets | Alleen in `.env.local`; `.gitignore` houdt dit bestand buiten de repo | Sleutels horen nooit in git |
| Database | Aanpassingen via `supabase/schema.sql`, met RLS aan op elke tabel | Iedereen werkt met hetzelfde schema |

## 4. Afspraken over versiebeheer

- Werken op `master` met kleine, volledige commits; grotere stappen via een eigen branch en daarna mergen.
- Commitboodschap in het Nederlands met een prefix uit deze lijst:
  `US1:`…`US20:` voor functionaliteit · `Testen:` · `Bugfix:` · `Docs:` · `Opzet:`.
- Elke dag minimaal één commit, zodat de voortgang en de tijdstempels in het versiebeheer terug te zien zijn.
- De build moet groen zijn voordat er naar `master` wordt gemergd.
- Releases krijgen een versienummer in `docs/documentatie.md` (changelog).

## 5. Afspraken binnen het team

- **Dagstart (10 min):** wat is er af, wat doe je vandaag, waar loop je tegenaan; het bord wordt bijgewerkt.
- **Review:** aan het einde van elke sprint met de docent; de opdrachtgever wordt uitgenodigd.
- **Retrospective:** direct na de review — wat ging goed, wat kan beter, welke kwaliteitsdoelen nemen we mee.
- **Code review:** een story gaat pas naar `master` als een teamgenoot de code heeft gezien en de opmerkingen
  zijn verwerkt.
- **Afwezigheid:** meld je voor de dagstart, dan kan een ander het oppakken.

## 6. Waar deze conventies vandaan komen

De technische afspraken zijn niet uit de lucht komen vallen: ze sluiten aan op wat er al in het project staat.

| Afspraak | Bron in het project |
| --- | --- |
| Lint en web-vitals-regels uit de Next.js-config | `eslint.config.mjs` |
| TypeScript met `strict` | `tsconfig.json` |
| De commando's die als controle gelden | `package.json` (`lint`, `build`) |
| Draaien van de controlescripts | `docs/checks/*.js` |
| Huisstijl in één bestand | `app/globals.css` |
