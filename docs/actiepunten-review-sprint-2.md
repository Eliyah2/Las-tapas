# Actiepunten uit de review van sprint 2 — Las Tapas

> **Bewijsstuk voor B1-K1-W1** (afstemmen met de opdrachtgever en de opdracht aanscherpen).
> Bron: spraakopname van de review, 15:57 min, met de opdrachtgever (Maria & Marcus).
> Uitgewerkt op 6 november 2026 door Mohamed Benabdillah (145614).
> De tijdstippen tussen haakjes verwijzen naar de opname, zodat elke regel terug te luisteren is.

## 1. Wat de opdrachtgever heeft besloten

Vier punten zijn in het gesprek echt beslist; de rest zijn wensen of vragen die nog antwoord nodig hebben.

| Besluit | Wat het betekent | Bron |
| --- | --- | --- |
| **Eén knop voor opmerking én allergie** | Geen losse "+ allergie"-knop meer. De gast typt in één veld alles wat de keuken moet weten: allergie, "zonder ui", "medium rare", extra lepeltjes. De opdrachtgever vond het onderscheid tussen twee knoppen niet uit te leggen zolang beide invoervelden op dezelfde plek in hetzelfde rijtje staan | 4:40–8:52 |
| **Keukenscherm met kleine vakjes per tafel** | Niet meer één groot vak per bestelling, maar kleine tegels per tafel. Tik op een tegel en je ziet wat er voor die tafel moet gebeuren | 25:02–25:35 |
| **Sorteren op resterende tijd** | De tafel met de minste tijd over staat bovenaan, zodat de keuken eerst doet wat het eerst klaar moet zijn. De opdrachtgever vroeg zich af of een tafel die net binnenkomt dan niet te ver naar boven schuift; afgesproken is dat alles uiteindelijk aan de beurt komt | 23:41–24:06 |
| **Nieuw besteld gerecht bovenaan** | Wat je aanklikt komt bovenaan de bestelling te staan, niet onderaan, zodat de gast niet hoeft te scrollen om te zien wat er net bij is | 13:41–13:56 |

## 2. Actielijst

Prioriteit volgens MoSCoW, net als in `docs/sprintplanning.md`. De kolom *nu* zegt wat er op 6 november in de
code staat, zodat duidelijk is wat nieuw werk is en wat alleen gecontroleerd hoeft te worden.

### A. Bestellen door de gast

| # | Actie | Waar | Prioriteit | Bron | Nu |
| --- | --- | --- | --- | --- | --- |
| A1 | Opmerking en allergie samenvoegen tot één knop met één tekstveld per regel | `app/menu/page.tsx` (regel 570–605) | Must | 4:40–8:52 | Twee losse knoppen en twee losse velden |
| A2 | De dubbele opmerking-knop weghalen: er staan twee identieke knoppen op elke bestelregel | `app/menu/page.tsx` ± 570–590 | Must (bug) | eigen codecontrole | Dubbel |
| A3 | Een nieuw toegevoegd gerecht bovenaan de bestelling tonen | `app/menu/page.tsx` (`cartLines`) | Should | 13:41–13:56 | Regel komt onderaan |
| A4 | De bestelbalk onderaan compacter maken voor tablet | `app/globals.css` (`.cart-bar`) | Must | 10:14–10:35 | Groot uitgevoerd; op een groot scherm valt het niet op, op een tablet wel |
| A5 | Controleren dat de allergie bij de juiste persoon terechtkomt (kan doordat er per persoon besteld wordt) | `app/menu/page.tsx`, `lib/orders.ts` | Should | 9:47–9:56 | Per persoon bestellen bestaat al; controle nodig |
| A6 | Maximum aantal per gerecht per ronde | `lib/orders.ts`, API | Could | 17:45–17:58 | Geen maximum; de opdrachtgever vroeg ernaar, het team antwoordde "nee" |

### B. Keukenscherm

| # | Actie | Waar | Prioriteit | Bron | Nu |
| --- | --- | --- | --- | --- | --- |
| B1 | Vakjes kleiner maken en per tafel een tegel tonen; tik opent de details | `app/keuken/page.tsx` | Must | 25:02–25:35 | Drie kolommen met grote kaarten per bestelling |
| B2 | Sorteren op de minste resterende tijd in plaats van op binnenkomst | `app/keuken/page.tsx` | Must | 23:41–24:06 | Op binnenkomst; alleen de wachttijd is gekleurd (8 en 15 minuten) |
| B3 | Minder scrollen en grotere raakvlakken, want de koks hebben hun handen vol | `app/keuken/page.tsx` | Must | 23:34–23:43 | Lijst wordt lang bij drukte |
| B4 | Op het wandscherm twee kolommen naast elkaar in plaats van één lange lijst | `app/keuken/page.tsx` | Should | 26:36–27:02 | Eén lijst |
| B5 | Statuslabels gelijktrekken met de woorden van de keuken: "ontvangen" in plaats van "nieuw" | `app/keuken/page.tsx` | Could | 16:28–16:37 | "Nieuw" |
| B6 | Schermbeveiliging na 20 seconden: het scherm dimmen en de klok **klein in een hoek** zetten, niet groot in beeld | `app/keuken/page.tsx` | Should | 9:11–9:26, 29:14–29:52 | **Staat niet in de code** (gezocht op idle/screensaver). In de opname zegt het team dat het bestaat, dus eerst bouwen en dan pas laten zien |
| B7 | Als de opmerking en allergie samengevoegd zijn: een allergie in de vrije tekst herkenbaar maken (bijvoorbeeld rood). Dan hoeft er geen aparte knop te zijn | `app/keuken/page.tsx` | Could | 8:18–8:36 | — |

### C. Menukaart en arrangementen

| # | Actie | Waar | Prioriteit | Bron | Nu |
| --- | --- | --- | --- | --- | --- |
| C1 | Het jaartal onder de merknaam gelijktrekken met wat de opdrachtgever zegt (nu "desde 2010" op de home- en welkomstpagina) | `app/page.tsx` regel 46, `app/welkom/page.tsx` regel 31 | Must (klein, maar zichtbaar) | 0:32–0:47 | 2010 op twee plekken; het juiste jaartal moet bevestigd worden |
| C2 | Drie arrangementen ondersteunen in plaats van één tarief: 2 uur zonder drinken, 3 uur met drinken, en de variant die de opdrachtgever noemde | `lib/tafel.ts` (`TARIEF_PER_PERSOON`, `DUUR_MINUTEN`), `app/welkom/gasten-kiezer.tsx` | Must | 1:55–2:20 | Eén tarief: € 27,50 voor 150 minuten |
| C3 | De officiële menukaart met alle gerechten en prijzen samen met de opdrachtgever doorlopen | `lib/menu.ts` | Should | 2:41–2:55 | Het team zegt dat het compleet is; de opdrachtgever wil het nog zien |
| C4 | Vastleggen of de prijs ook geldt bij een reservering of alleen bij gasten die aan tafel komen | `docs/` + `lib/tafel.ts` | Should | 2:14–2:22 | Niet uitgezocht |

### D. Afrekenen

| # | Actie | Waar | Prioriteit | Bron | Nu |
| --- | --- | --- | --- | --- | --- |
| D1 | Op de bon de gegevens zetten die de opdrachtgever noemde: aantal personen, tafelnummer, betaalwijze en tijd | `lib/payments.ts` (bonregels) | Should | 18:31–19:52 | De bon bestaat; welke gegevens er precies op staan moet gecontroleerd worden |
| D2 | Betaalmethoden bespreken: iDEAL werkt, pinnen aan de balie is nu buiten de app | `app/betalen/[id]/page.tsx`, `lib/payments.ts` | Should | 18:46–19:00 | iDEAL |

### E. Hardware (buiten de software)

| # | Actie | Prioriteit | Bron |
| --- | --- | --- | --- |
| E1 | Kiezen tussen een iPad per tafel en één of twee schermen per sectie; de opdrachtgever ziet één of twee schermen als goedkoper dan tien iPads | Should | 27:32–28:06 |
| E2 | Uitzoeken waarom een hotspot niet goed werkt, zodat er echt op een tablet getest kan worden | Should | 10:30–11:38 |

## 3. Open vragen voor de opdrachtgever

Deze punten zijn in de opname niet beslist. Ze staan hier bij elkaar zodat ze in één keer terug te mailen zijn.

| Vraag | Waarom het telt | Bron |
| --- | --- | --- |
| Welk jaartal moet er onder de merknaam staan? | De opdrachtgever noemt een ander jaartal dan 2010, maar het is in de opname niet verstaanbaar | 0:32–0:47 |
| Wat zijn de precieze prijzen en tijden van de drie arrangementen? | Nu staat er één tarief van € 27,50 voor 150 minuten in de code | 1:55–2:20 |
| Geldt de prijs per persoon ook bij een reservering? | De opdrachtgever vroeg dit en het antwoord staat niet in de opname | 2:14–2:22 |
| Moet er een maximum per gerecht per ronde komen? | De opdrachtgever vroeg ernaar; het team antwoordde "nee", maar de vraag blijft open | 17:45–17:58 |
| Wat is het "beurtenscherm" dat ter sprake kwam, en is dat nog nodig? | De opdrachtgever verwijst ernaar, maar het is niet duidelijk welk scherm bedoeld wordt | 21:04–21:15 |
| Wordt er ook met pin of een kassa betaald, of alleen met iDEAL? | De opdrachtgever noemt betalen aan de balie; dat is nu nog buiten de app | 18:46–19:00 |

## 4. Wat al werkt en dus in de volgende review te laten zien is

- **Per persoon bestellen met de naam van de gast** (9:26–9:38): de gast kiest voor wie het gerecht is en de
  keuken ziet de naam bij het gerecht. Dit is precies wat de opdrachtgever wilde en het maakt de allergie per
  persoon mogelijk.
- **iDEAL-betaling** via de betaalpagina.
- **De keukenstroom** ontvangen → in bereiding → gereed voor uitserveren (16:23–16:57).
- **Eén knop voor opmerking én allergie** is nog niet gebouwd: dat is de eerste Must van deze lijst.

> Let op bij het demonstreren: de schermbeveiliging na 20 seconden (B6) is in de opname als bestaand
> gepresenteerd, maar staat niet in de code. Niet laten zien voordat die gebouwd en getest is.

## 5. Voorgestelde volgorde

1. **Eerst de kern van het bestellen en de keuken:** A1, A2, A4, B1, B2 (Must, en A2 is een zichtbare bug).
2. **Daarna de afwerking:** B6, B3, C1, C2, A3.
3. **Als er tijd over is:** B4, B5, B7, C3, D1, A6.

Deze punten staan nog niet in de productbacklog. Voorstel: ze als **US21–US29** toevoegen aan
`docs/sprintplanning.md` §3, met dezelfde MoSCoW-prioriteit als hierboven, en ze daarna in het bord in §4 zetten.

## 6. Hoe deze lijst is gemaakt

De opname is automatisch uitgeschreven, dus de tekst bevat fouten ("argumenten" voor arrangementen, "EIPA" voor
iDEAL, "aangifte" voor uitgifte). Ik heb alleen punten overgenomen waar de bedoeling duidelijk was en heb bij
elke regel het tijdstip bewaard. Wat ik niet kon thuisbrengen staat bij de open vragen en niet in de actielijst.
De kolom *nu* komt uit de code op 6 november, niet uit de opname: zo is te zien dat sommige wensen al klaar zijn
en andere helemaal nog niet bestaan.

## 7. Stand na uitwerking (6 november 2026)

Wat hieronder *gebouwd* staat, is gecontroleerd met `npx tsc --noEmit`, `npx eslint` en `npx next build`.
In de browser is het nog niet bekeken.

| Punt | Stand | Waar het zit |
| --- | --- | --- |
| A1, A2 | Gebouwd: één knop en één veld per gerecht; de dubbele knop is weg | `app/menu/page.tsx` |
| A3 | Gebouwd: de nieuwste regel staat bovenaan de bestelling | `app/menu/page.tsx` (`cartLines`) |
| A4 | Gebouwd: compactere bestelbalk | `app/globals.css` (`.cart-inner`, `.cart-list`) |
| B1, B2, B3, B5 | Gebouwd: kleine tegels per tafel, tik om te openen, oudste wacht bovenaan, statuslabels ontvangen/in bereiding/gereed | `app/keuken/page.tsx` |
| B4 | Gebouwd: twee kolommen op een tablet, drie op een breed scherm | `app/keuken/page.tsx` |
| B6 | Gebouwd: na 20 seconden dimmen met de klok klein in de hoek, ook op het uitserveerscherm | `components/idle-scherm.tsx` |
| B7 | Gebouwd: een allergie in de vrije tekst wordt rood gemarkeerd op het keuken- en uitserveerscherm | `lib/opmerking.ts` |
| Nieuw uit de review | Gebouwd: uitserveerscherm voor de obers met wat gereed is, voor welke tafel, met gastnaam en opmerking, en een knop *Geserveerd* | `app/serveren/page.tsx`, status `geserveerd` in `lib/orders.ts` |
| C1 | **Niet gebouwd:** het juiste jaartal is niet te verstaan in de opname, dus dat moet eerst bevestigd worden | `app/page.tsx`, `app/welkom/page.tsx` |
| C2, C4 | **Niet gebouwd:** de prijzen en tijden van de drie arrangementen staan niet in de opname | `lib/tafel.ts` |
| C3 | Doorlopen met de opdrachtgever, geen codewerk | `lib/menu.ts` |
| A6 | **Niet gebouwd:** de opdrachtgever vroeg naar een maximum, maar gaf geen getal | `app/api/orders/route.ts` (nu 1–20 per gerecht) |
| D1, D2 | Nog te controleren met de opdrachtgever: welke gegevens op de bon en of pinnen meedoet | `lib/payments.ts` |
| E1, E2 | Hardware, buiten de software | — |

> De schermbeveiliging (B6) stond bij de review nog niet in de code en is nu gebouwd. Bij de volgende
demonstratie is dat dus wel te laten zien, maar nog niet in een browser gecontroleerd.
