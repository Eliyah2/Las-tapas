# Sprintplanning en productbacklog — Las Tapas

> **Bewijsstuk voor B1-K1-W1** (Stemt de opdracht af, plant werkzaamheden en bewaakt de voortgang).
> Versie 1.1 · 8 oktober 2026 · opgesteld door Mohamed Benabdillah (145614) · projectgroep Mohamed, Ahmed & Eliyah

## 1. Projectgegevens

| Gegeven | Invulling |
| --- | --- |
| Opdracht | Automatiseringschallenge Las Tapas — digitaal tafelbestelsysteem |
| Opdrachtgever | Las Tapas · contactpersonen **Maria & Marcus** |
| Projectgroep | Mohamed, Ahmed & Eliyah (drie leden) |
| Docent | Koen van der Hulst |
| Repository | https://github.com/Eliyah2/Las-tapas.git |
| Werkwijze | Scrum, sprints van 21 dagen; review en retrospective met minimaal één docent; de opdrachtgever wordt voor elke review uitgenodigd |
| Eisen van de opdrachtgever | database met minimaal vier onderling verbonden entiteiten · per tafel één totaalbedrag · keuken en bar digitaal beheren · voorraadbeheer verbeteren |
| Backlog, planning en bord | productbacklog met prioriteit in §3 · sprintkalender in §2 · bord in §4 · individuele planning in §5 |

## 2. Sprintkalender

| Sprint | Periode | Review + retrospective | Sprintdoel |
| --- | --- | --- | --- |
| **1** | 7 t/m 25 september 2026 | **25-09-2026** | Van papieren bonnetje naar een werkende digitale bestelstroom: QR-bestellen aan tafel, keukenscherm, voorraad en betalen per tafel |
| **2** | 26 september t/m 16 oktober 2026 | **16-10-2026** | Bestellingen, voorraad en betalingen volledig uit de database, rollen beveiligen en de beheerfunctionaliteit afronden |
| **3** | 17 oktober t/m 6 november 2026 | **06-11-2026** (tevens oplevering) | Product opleveren, verbeteringen doorvoeren en presenteren aan de opdrachtgever |

> De drie momenten zijn 21 dagen na elkaar afgesproken: 25-09, 16-10 en 06-11. De sprint 1-review valt
> direct na het testen en de laatste commits van sprint 1 (24 en 25 september), daarom zijn deze data
> hier als **review- en retrospectivemoment** opgenomen. Zijn het in plaats daarvan de startdata van de
> sprints, dan schuift elke rij één periode op — dat bevestig ik in de eerstvolgende afstemming met de docent.

## 3. Productbacklog met prioriteit

Prioriteit volgens MoSCoW: **Must** = nodig voor de oplevering · **Should** = belangrijk · **Could** = mooi als het past.

| ID | User story (functionaliteit) | Prioriteit | Sprint | Status | Bewijs |
| --- | --- | --- | --- | --- | --- |
| US1 | Als gast scan ik de QR-code op tafel en bestel ik zonder bediening | Must | 1 | Klaar | commit `6fe7cae` |
| US2 | Als kok zie ik op het keukenscherm live alle bestellingen en zet ik de status op nieuw → in bereiding → klaar | Must | 1 | Klaar | commit `6fe7cae` |
| US3 | Als zaak genereer en print ik per tafel een QR-code | Must | 1 | Klaar | commit `6fe7cae` |
| US4 | Als manager houd ik voorraad bij: par-niveau, leverancier, prijs en een mutatielog | Must | 1 | Klaar | commit `bac21d6` |
| US5 | Als manager boekt elke bestelling automatisch de ingrediënten af volgens het recept | Must | 1 | Klaar | commit `bac21d6` |
| US6 | Als gast zie ik op de menukaart dat een gerecht uitverkocht is | Should | 1 | Klaar | commit `bac21d6` |
| US7 | Als keuken boek ik in één tik af wat ik pak, met rollen (kok, hoofdchef, manager) en goedkeuring boven een drempel | Should | 1 | Klaar | commit `bac21d6` + `docs/documentatie.md` §10 |
| US8 | Als gast betaal ik per tafel één totaalbedrag via een veilige betaalpagina | Must | 1 | Klaar | commit `d537418` |
| US9 | Als gast zie ik de live status van mijn bestelling met de badge *gereed voor uitserveren* | Should | 1 | Klaar | commit `28910e7` |
| US10 | Als team werken we met bestellingen, voorraad en betalingen in de database in plaats van in het geheugen | Must | 1 | Klaar | commit `8128f09` |
| US11 | Als tester kan ik het volledige proces herhaalbaar testen met een testrapport | Must | 1 | Klaar | `docs/testrapport-us1-us3.md` |
| US12 | Als gast kan ik mijn bestelling annuleren en komt de voorraad dan terug | Should | 2 | Te doen | verbeterpunt 2 |
| US13 | Als manager zet ik gerechten aan en uit en wijzig ik prijzen in een beheerscherm | Should | 2 | Te doen | verbeterpunt 4 |
| US14 | Als keuken ontvang ik wijzigingen via realtime van Supabase in plaats van de eigen SSE-route | Could | 2 | Te doen | verbeterpunt 3 |
| US15 | Als zaak print ik QR-kaartjes op tafelformaat | Should | 2 | Te doen | verbeterpunt 6 |
| US16 | Als beheerder zijn de rollen beveiligd met een account en wachtwoord | Must | 2 | Te doen | verbeterpunt 8 |
| US17 | Als manager vul ik meerdere producten in één keer bij met een leverbon | Should | 3 | Te doen | verbeterpunt 7 |
| US18 | Als manager staat de hele voorraad in de database in plaats van in een JSON-bestand | Must | 3 | Te doen | verbeterpunt 1 |
| US19 | Als zaak staan er eigen foto's van de gerechten op de menukaart | Could | 3 | Te doen | verbeterpunt 5 |
| US20 | Als team leveren we het product op met demo, verbetervoorstellen en een presentatie | Must | 3 | Te doen | examenopdracht 4 en 6 |

> US12 t/m US19 komen uit de verbeterpunten en de eigen planning in `docs/documentatie.md` §13, zoals
> opdracht 4 van het examen vraagt. De verdeling over sprint 2 en sprint 3 staat hier als **voorstel** en
> wordt in de sprintplanning met de docent en de opdrachtgever definitief gemaakt.

## 4. Bord (scrumtakenbord)

Het bord wordt bijgehouden tijdens de sprint en na elke review bijgewerkt met de verwerkte feedback.
Maak na elke review een schermafdruk van dit bord: dat is het gevraagde beeldmateriaal met persoonlijke toelichting.

**Sprint 2 — stand aan het begin van de sprint**

| Te doen | Bezig | Review | Klaar |
| --- | --- | --- | --- |
| US12 annuleren + voorraad terugboeken | US16 rollen beveiligen | US13 beheerscherm | US1–US11 (sprint 1) |
| US15 QR-kaartjes op tafelformaat | | | |
| US14 realtime van Supabase | | | |

## 5. Jouw individuele planning en bijdrage (Mohamed Benabdillah)

Dit is het deel dat als individu wordt beoordeeld: welke user stories jij ontwikkelt, met een eigen schatting
en een eigen deadline. Hieronder staat wat er in het versiebeheer aantoonbaar van mij is, gevolgd door mijn
planning voor sprint 2 en sprint 3.

### Wat ik in sprint 1 heb gebouwd

| User story | Wat ik heb gemaakt | Bewijs | Status |
| --- | --- | --- | --- |
| US1 | QR-menu en bestellen aan tafel, inclusief welkomstpagina met tafelnummer | `6fe7cae` (07-09) | Klaar |
| US2 | Keukenscherm met live bestellingen en de status nieuw → in bereiding → klaar | `6fe7cae` (07-09) | Klaar |
| US3 | QR-code per tafel genereren en printen | `6fe7cae` (07-09) | Klaar |
| US4 | Voorraadbeheer met par-niveau, leverancier, prijs en mutatielog | `bac21d6` (17-09) | Klaar |
| US5 | Automatisch afboeken volgens recept, uitverkocht op de menukaart | `bac21d6` (17-09) | Klaar |
| US6 | Uitgiftescherm met rollen (kok, hoofdchef, manager) en goedkeuring boven een drempel | `bac21d6` (17-09) | Klaar |
| — | Zes van de acht controlescripts (`aanvraag`, `database`, `gerecht`, `screenshot`, `uitverkocht`, `voorraad-test`) en alle twintig schermafbeeldingen | `bac21d6`, `8128f09` | Klaar |
| US10 | Bestellingen, voorraad en betalingen naar Supabase: tien tabellen met verwijzingen en RLS | `8128f09` (25-09) | Klaar |
| — | Projectdocumentatie van 626 regels: programma van eisen, technische onderbouwing en huisstijl | `bac21d6` | Klaar |

**Van mijn teamgenoten (context, niet mijn eigen bewijs):** US8 betaalmodule en de rekening per tafel (`d537418`),
US9 live statuspagina met badge (`28910e7`) en het testrapport US1–US3 met de testomgeving (`bc7913d`, `6f7575f`)
zijn van Eliyah. Van Ahmed staan er nog geen commits in de repository — dat vul ik samen met hem aan, want bij
opdracht 5 moet ieder teamlid zijn eigen bijdrage kunnen laten zien.

### Mijn planning voor sprint 2 en sprint 3

| User story | Taak | Schatting (uur) | Klaar op | Status |
| --- | --- | --- | --- | --- |
| US16 | Rollen echt beveiligen met een account en wachtwoord | «schatting» | 16-10-2026 | Te doen |
| US12 | Geannuleerde bestelling boekt de voorraad terug | «schatting» | 16-10-2026 | Te doen |
| US13 | Beheerscherm voor gerechten aan/uit en prijzen | «schatting» | 16-10-2026 | Te doen |
| US18 | De hele voorraad uit het JSON-bestand naar de database | «schatting» | 06-11-2026 | Te doen |
| US17 | Leverbon: meerdere producten in één keer bijvullen | «schatting» | 06-11-2026 | Te doen |
| — | Afstemmingsdocument met Maria & Marcus, logboek en portfolio bijwerken | «schatting» | 16-10-2026 | Te doen |

**Waarom deze volgorde:** de verhalen die de opdrachtgever als *Must* heeft aangewezen en die andere taken
blokkeren (US16 en US18) gaan eerst; pas daarna de *Should* en *Could*. Daarnaast kosten de examenonderdelen
zelf tijd, en die staan daarom bewust in de planning.

## 6. Afstemming en afspraken

| Wat | Met wie | Wanneer | Vastgelegd in |
| --- | --- | --- | --- |
| Eisen, wensen, prioriteit en opleverdatum | Maria & Marcus (opdrachtgever) | «datum afstemming» | afstemmingsdocument + mailbevestiging |
| Sprintplanning, review en retrospective | projectgroep + minimaal één docent | 25-09 · 16-10 · 06-11-2026 | dit document + uitnodiging |
| Uitnodiging voor de sprintreviews | opdrachtgever | voor 16-10 en 06-11 | e-mail |
| Database-eis van vier onderling verbonden entiteiten | opdrachtgever | «datum» | `supabase/schema.sql` (tien tabellen met verwijzingen) |

## 7. Risico's en afhankelijkheden

| Risico | Gevolg | Maatregel |
| --- | --- | --- |
| Er is sinds 25 september niet gecommit, terwijl de sprint 2-review op 16 oktober is | Geen zichtbare voortgang, het bord en de planning lopen achter | Sprint 2 nu starten met US16 en US12; dagelijks committen en het bord bijwerken |
| Werken zonder dagelijkse commits | Versienummers en tijdstempels ontbreken bij het bewijs | Afspraak: elke werkdag minimaal één commit met een duidelijke prefix |
| Supabase-account en sleutels nog niet gedeeld binnen het team | US13, US14 en US18 kunnen niet starten | Vóór de eerstvolgende sprintplanning de sleutels delen en de RLS-regels controleren |
| Beschikbaarheid van de docent op de reviewdata | Review en retrospective kunnen niet doorgaan | Nu bevestigen in de agenda en de opdrachtgever uitnodigen |
| Rollen zijn nu in de browser te wisselen | Geen echte beveiliging | US16 in sprint 2 (Must) |
