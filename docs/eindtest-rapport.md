# Eindtestrapport — Las Tapas (US3)

> **Bewijsstuk voor het examenportfolio (Opdracht 2, Realiseren).**
> Dit rapport laat zien dat de drie gerealiseerde user stories daadwerkelijk
> werken en dat de werking reproduceerbaar is.

## Metadata

| Gegeven | Waarde |
| --- | --- |
| Project | Las Tapas – digitaal tafelbestelsysteem |
| Student | Eliyah Impelmans (GitHub: `Eliyah2`) |
| Testscript | `docs/checks/eindtest-check.js` |
| Uitgevoerd op | 24 september 2026, 15:41 (CEST) |
| Omgeving | Next.js 16 dev-server op `http://localhost:61768` |
| Codeversie | commit `0c0f0d1` (US3) + werkmap |
| Uitkomst | **13 van 13 controles gelukt** (twee identieke runs) |

## Waarom dit rapport erbij staat

Een screenshot van een werkend scherm bewijst niet dat de software door mij
is gebouwd. Dit rapport bewijst iets anders:

1. **Herhaalbaar** — het script reset de beginvoorraad en draait de volledige
   flow opnieuw. Wie het zelf uitvoert krijgt exact hetzelfde resultaat.
2. **Volledig** — niet alleen de happy path: ook de geweigerde kaart, het
   ongeldige kaartnummer, de dubbele betaling en de onbekende tafel worden
   getest. Fouten worden daadwerkelijk afgedekt, niet weggelaten.
3. **Gedateerd en in versiebeheer** — dit rapport en het testscript staan in
   GitHub, met auteur en tijdstempel per commit.

## Uitvoering

```bash
# 1. Start de ontwikkelserver
npm run dev

# 2. Voer de eindtest uit (in een tweede terminal)
node docs/checks/eindtest-check.js http://localhost:61768
```

## Werkelijke testuitvoer (run 2, identiek aan run 1)

```text
Eindtest volledige proces — tafel TEST-74931 op http://localhost:61768

0. Beginvoorraad terugzetten (reproduceerbaarheid)
  ✓ Voorraad teruggezet naar beginstand
1. Bestellen (iPad-flow)
  ✓ Bestelling 1 geaccepteerd (2× bravas €13,00 + paella €18,50) — voorraadmutaties: 11
  ✓ Bestelling 2 geaccepteerd (1× gambas €9,00)
2. Keuken-flow (status aanpassen)
  ✓ Status → in bereiding
  ✓ Status → gereed voor uitserveren
  ✓ Ongeldige status geweigerd (400)
3. Rekening per tafel
  ✓ Rekening gestart met totaal € 40,50 — server berekende: € 40.5
  ✓ Onbekende tafel geweigerd (404)
4. Betaling
  ✓ Geweigerde testkaart afgewezen — De kaart is geweigerd door de bank.
  ✓ Ongeldig kaartnummer afgewezen
  ✓ Betaling geslaagd, sessie op betaald — betaald om 15:41:43
  ✓ Alleen de laatste vier cijfers worden bewaard
  ✓ Dubbel betalen geblokkeerd (409) — Deze tafel is al afgerekend.

Uitkomst: 13 van 13 controles gelukt
```

## Wat elk onderdeel bewijst

| Controle | Bewijst |
| --- | --- |
| Beginvoorraad terugzetten | De test is niet afhankelijk van eerder gebruik — elke run begint gelijk |
| Bestelling 1 + 2 geaccepteerd | US3: bestellen via de gastflow werkt, inclusief automatische voorraadafboeking (11 mutaties) |
| Status → bereiden → klaar | US2: de chef kan de status aanpassen tot "gereed voor uitserveren" |
| Ongeldige status geweigerd (400) | US2: de status wordt server-side gevalideerd, niet alleen in de browser |
| Rekening € 40,50 | US1: het totaal per tafel klopt en is server-side berekend (2× € 6,50 + € 18,50 + € 9,00) |
| Onbekende tafel geweigerd (404) | US1: geen rekening zonder bestellingen |
| Geweigerde testkaart | US1: de betaling kan falen, en de fout wordt netjes teruggegeven |
| Ongeldig kaartnummer | US1: kaartgegevens worden gevalideerd (16 cijfers) |
| Betaling geslaagd | US1: de happy path werkt, met tijdstip vastgelegd |
| Alleen laatste vier cijfers bewaard | US1/AVG: er wordt geen volledig kaartnummer opgeslagen |
| Dubbel betalen geblokkeerd (409) | US1: de bediening kan niet dubbel afrekenen |

## Conclusie

Het volledige proces — **bestellen op de iPad → verwerking in de keuken →
totaalbedrag per tafel → online betaling** — werkt van begin tot eind en is
met 13 controles reproduceerbaar vastgelegd. De drie user stories (US1
betaalmodule, US2 statuskoppeling, US3 eindtest) zijn daarmee aantoonbaar
gerealiseerd.
