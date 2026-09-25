# Testrapport — Las Tapas (US1 t/m US3)

> **Bewijsstuk voor het examenportfolio (B1-K1-W4 – Testen).**
> Testomgeving: `docs/checks/portfolio-test.js` · Uitgevoerd: 24 september 2026

## Metadata

| Gegeven | Waarde |
| --- | --- |
| Project | Las Tapas – digitaal tafelbestelsysteem |
| Student | Eliyah Impelmans (GitHub: `Eliyah2`) |
| Geteste user stories | US1 betaalmodule · US2 statuskoppeling · US3 volledig proces |
| Testvorm | Geautomatiseerde testsuite (API-niveau) + handmatige browsertest |
| Testmethodiek | Functioneel en technisch testen, zwart-witdoosbenadering |
| Omgeving | Next.js 16 dev-server, Node.js, Windows |
| Uitvoering | 24-09-2026, 15:51 (CEST), codeversie commit `bc7913d` |
| Resultaat | **34 van 34 controles geslaagd** (twee identieke runs) |

## Testopzet

De testomgeving is bewust reproduceerbaar gemaakt:

- **Uniek tafelnummer per run** (`T` + tijdstempel), zodat een tweede run niet
  tegen een reeds betaalde tafel aanloopt.
- **Reset van de beginvoorraad** aan het begin, zodat voorraadtekorten uit een
  eerdere run de uitkomst niet beïnvloeden.
- **Zelfde uitvoer bij herhaling**: de test is op 24-09 twee keer gedraaid met
  identieke uitkomst (34/34).

```bash
npm run dev                                  # terminal 1
node docs/checks/portfolio-test.js           # terminal 2
```

## Samenvatting resultaten

| Onderdeel | Functioneel | Technisch | Totaal |
| --- | --- | --- | --- |
| US1 – Betaalmodule | 8/8 | 9/9 | 17/17 |
| US2 – Statuskoppeling | 3/3 | 5/5 | 8/8 |
| US3 – Volledig proces | 4/4 | 5/5 | 9/9 |
| **Totaal** | **15/15** | **19/19** | **34/34** |

## Resultaten per onderdeel

### US1 – Betaalmodule

**Functioneel (8/8)**

| # | Test | Verwacht | Resultaat |
| --- | --- | --- | --- |
| F1 | Gast bestelt 2× Patatas Bravas + 1× Paella Mixta | Bestelling geaccepteerd, voorraad afgeboekt | ✅ 11 voorraadmutaties |
| F2 | Gast plaatst tweede bestelling (1× Gambas) | Geaccepteerd | ✅ |
| F3 | Rekening van tafel toont totaal | € 40,50 (2×6,50 + 18,50 + 9,00) | ✅ server gaf € 40,50 |
| F4 | Betaalpagina haalt bedrag op | Bedrag komt van de server | ✅ |
| F5 | Betalen met geweigerde kaart | Nette foutmelding | ✅ *"De kaart is geweigerd door de bank."* |
| F6 | Betalen met testkaart 4242… | Sessie wordt `betaald` | ✅ |
| F7 | Bevestiging toont bedrag en tijdstip | Beide aanwezig | ✅ |
| F8 | Bonnetje toont kaartnummer | Alleen laatste 4 cijfers | ✅ `4242` |

**Technisch (9/9)**

| # | Test | Verwacht | Resultaat |
| --- | --- | --- | --- |
| T1 | Dubbel betalen | HTTP 409, geen tweede afboeking | ✅ *"Deze tafel is al afgerekend."* |
| T2 | Ongeldig kaartnummer (`123`) | Geweigerd | ✅ |
| T3 | Rekening zonder tafelnummer | HTTP 400 | ✅ |
| T4 | Ongeldige JSON in body | HTTP 400, geen crash | ✅ |
| T5 | Rekening voor onbekende tafel | HTTP 404 | ✅ |
| T6 | Onbekende sessie-id | HTTP 404 | ✅ |
| T7 | Onvolledige kaartgegevens | Geweigerd | ✅ |
| T8 | **Prijsmanipulatie**: browser stuurt eigen prijs € 0,01 mee | Server negeert en rekent € 6,50 | ✅ beveiliging bevestigd |
| T9 | Reactietijd API | Gemiddeld < 500 ms | ✅ 44–55 ms |

### US2 – Statuskoppeling

**Functioneel (3/3)**

| # | Test | Verwacht | Resultaat |
| --- | --- | --- | --- |
| F9 | Status zetten op *in bereiding* | Status wordt `bereiden` | ✅ |
| F10 | Status zetten op *gereid voor uitserveren* | Status wordt `klaar` | ✅ |
| F11 | Statuspagina voor gast | Pagina laadt (HTTP 200) | ✅ |

**Technisch (5/5)**

| # | Test | Verwacht | Resultaat |
| --- | --- | --- | --- |
| T10 | Ongeldige status (`opgegeten`) | HTTP 400 | ✅ *"Status moet één van zijn: nieuw, bereiden, klaar"* |
| T11 | Status van onbekende bestelling | HTTP 404 | ✅ |
| T12 | Ongeldige JSON bij statuswijziging | HTTP 400 | ✅ |
| T13 | Live updates via SSE | `event: orders` wordt ontvangen | ✅ |
| T14 | Live stroom bevat de status van de gast | Bestelling + status in payload | ✅ |

### US3 – Volledig proces

**Functioneel (4/4)**

| # | Test | Verwacht | Resultaat |
| --- | --- | --- | --- |
| F12 | Bestellen na een eerdere sessie | Beide bestellingen geaccepteerd | ✅ |
| F13 | Alle bestellingen naar eindstatus | Beide `klaar` | ✅ |
| F14 | Totaal over meerdere bestellingen | € 37,00 (22,00 + 3×5,00) | ✅ server gaf € 37 |
| F15 | Betaling volledige tafelrekening | Geslaagd | ✅ |

**Technisch (5/5)**

| # | Test | Verwacht | Resultaat |
| --- | --- | --- | --- |
| T15 | Voorraadstatus na bestellingen | HTTP 200 | ✅ |
| T16 | Pagina `/rekening` | HTTP 200 | ✅ |
| T17 | Pagina `/status` | HTTP 200 | ✅ |
| T18 | Pagina `/menu` | HTTP 200 | ✅ |
| T19 | Pagina `/keuken` | HTTP 200 | ✅ |

## Werkelijke testuitvoer

```text
US1 – Betaalmodule
  Functioneel
    ✓ Gast kan bestellen (2× bravas + 1× paella) — voorraadmutaties: 11
    ✓ Gast kan een tweede bestelling plaatsen
    ✓ Bediening ziet het juiste totaalbedrag per tafel — verwacht € 40.5, server gaf € 40.5
    ✓ Betaalpagina haalt het bedrag op bij de server
    ✓ Geweigerde kaart geeft een nette foutmelding — De kaart is geweigerd door de bank.
    ✓ Gast kan succesvol betalen met testkaart
    ✓ Bevestiging toont het bedrag en tijdstip van betaling
    ✓ Alleen de laatste vier kaartcijfers worden bewaard
  Technisch
    ✓ Dubbel betalen wordt geblokkeerd (409) — Deze tafel is al afgerekend.
    ✓ Ongeldig kaartnummer wordt geweigerd
    ✓ Rekening zonder tafelnummer wordt geweigerd (400)
    ✓ Ongeldige JSON geeft 400 in plaats van een crash
    ✓ Rekening voor onbekende tafel geeft 404
    ✓ Onbekende sessie geeft 404
    ✓ Onvolledige kaartgegevens worden geweigerd
    ✓ Een door de browser meegestuurde prijs wordt genegeerd — server rekende € 6.5

US2 – Statuskoppeling
  Functioneel
    ✓ Chef kan status zetten op 'in bereiding'
    ✓ Chef kan met één klik naar 'gereed voor uitserveren'
    ✓ Statuspagina voor de gast is bereikbaar — HTTP 200
  Technisch
    ✓ Ongeldige status wordt server-side geweigerd (400)
    ✓ Status van onbekende bestelling geeft 404
    ✓ Ongeldige JSON bij statuswijziging geeft 400
    ✓ Gast ontvangt live updates via Server-Sent Events — event: orders ontvangen
    ✓ De live stroom bevat de status van de bestelling van de gast

US3 – Volledig proces
  Functioneel
    ✓ Bestellen werkt opnieuw na een eerdere sessie
    ✓ Alle bestellingen van een tafel raken de eindstatus
    ✓ Totaal van meerdere bestellingen per tafel klopt — verwacht € 37, server gaf € 37
    ✓ Betaling van de volledige tafelrekening lukt
  Technisch
    ✓ Voorraadstatus is na de bestellingen nog steeds bereikbaar — HTTP 200
    ✓ Pagina /rekening geeft HTTP 200
    ✓ Pagina /status geeft HTTP 200
    ✓ Pagina /menu geeft HTTP 200
    ✓ Pagina /keuken geeft HTTP 200
    ✓ Gemiddelde reactietijd van de API onder 500 ms — 46 ms over 5 requests

================================================================
TESTRAPPORT — Las Tapas
================================================================
Functionele tests : 15/15 geslaagd
Technische tests  : 19/19 geslaagd
Totaal            : 34/34 geslaagd

Uitkomst: 34 van 34 controles gelukt
```

## Bevindingen tijdens het testen

### B1 – De statuspagina levert geen statische inhoud (opgelost in de test)

Bij het schrijven van de test controleerde ik of de pagina `/status` de tekst
*"Gereed voor uitserveren"* in de HTML bevat. Die controle faalde, terwijl de
pagina wél goed werkt.

**Analyse:** de statuspagina is een *clientcomponent*. De voortgangsstappen
worden pas in de browser opgebouwd, nadat de gast op de pagina verbinding
maakt met de live stroom. De initiële HTML bevat daarom alleen de app-shell.

**Conclusie:** de applicatie is correct; de *verwachting in de test* was fout.
De test controleert nu of de pagina laadt (HTTP 200) en controleert de inhoud
apart via de live stroom (T13/T14). Dit is een goede herinnering: bij het
testen van een clientcomponent moet je de juiste laag kiezen — server-HTML,
API-respons of de daadwerkelijk gerenderde DOM.

**Actie:** test aangepast (commit `bc7913d`), applicatie ongewijzigd.

### B2 – De eerste testrun faalde door een tekort (opgelost in de test)

Bij de eerste uitvoering faalden twee controles: de tweede bestelling werd
geweigerd en het totaal was € 31,50 in plaats van € 40,50.

**Analyse:** de voorraad was door eerdere testroutines al grotendeels
afgeboekt. De paella werd daardoor geweigerd (HTTP 409), waardoor één
bestelling ontbrak in het totaal.

**Conclusie:** de test was niet reproduceerbaar. Dit is een eigenschap van de
test, niet van de applicatie.

**Actie:** de test zet nu aan het begin de beginvoorraad terug via
`POST /api/voorraad/reset`. Daarna geeft elke run hetzelfde resultaat — te
verifiëren met twee identieke runs (beide 34/34). Dit is belangrijk: een
test die je maar één keer kunt draaien, is geen betrouwbaar bewijs.

### B3 – Reactietijd is ruim voldoende (geen actie nodig)

De gemeten gemiddelde reactietijd van de API is 44–55 ms over vijf
opeenvolgende aanroepen, ruim onder de gestelde grens van 500 ms. Voor een
restaurantsituatie met enkele tafels is dit ruim voldoende. Geen actie nodig.

## Conclusies

1. **Alle drie de user stories functioneren zoals afgesproken.** De
   betaalmodule rekent server-side, de statuskoppeling werkt live en het
   volledige proces van bestellen tot betaling verloopt foutloos.
2. **De beveiliging houdt stand.** Prijsmanipulatie door de browser wordt
   genegeerd, dubbel betalen wordt geblokkeerd, ongeldige invoer geeft nette
   foutmeldingen en er worden geen kaartgegevens bewaard.
3. **De test is reproduceerbaar.** Twee identieke runs op dezelfde dag gaven
   34/34. Iedereen die de repository kloont kan dit zelf nagaan.
4. **Twee bevindingen bij het schrijven van de test** (B1 en B2) hebben de
   test beter gemaakt. De applicatie zelf bleef bij beide correct; de
   aanpassingen zaten in de testopzet.
5. **Niet afgebroken, maar wel gemeten:** de statuspagina is afhankelijk van
   JavaScript. Zonder JavaScript ziet de gast geen voortgang. Voor deze
   toepassing (een restaurant met tablets) is dat geen probleem, maar bij
   een toepassing die ook zonder JavaScript moet werken, is dit een
   aandachtspunt (progressive enhancement).
6. **Aanbeveling:** de bestellingen staan in het geheugen van de server. Bij
   een echte restaurantproef zou een database nodig zijn; het Supabase-schema
   ligt daarvoor al klaar in het project.
