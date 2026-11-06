# Logboek voortgang — Las Tapas

> **Bewijsstuk voor B1-K1-W1** (Bewaken voortgang en reageren op afwijkingen).
> Bijgehouden door **Mohamed Benabdillah** (studentnummer 145614) · docent **Koen van der Hulst** ·
> gestart 7 september 2026 · laatste bijwerking 8 oktober 2026

## Hoe dit logboek wordt bijgehouden

Per werkdag of les vul ik in wat er gedaan is, wat er **afweek** van de planning, waarom, wat dat deed met de
doorlooptijd en welke tussenoplossing er is gekozen. De kolom *bewijs* verwijst naar het versiebeheer, zodat
elke regel te controleren is.

Dit is **mijn eigen logboek**. Werk dat een teamgenoot deed staat er als context bij en is gemarkeerd met
*(teamgenoot)*, zodat de beoordelaar ziet welk deel van mij is en welk deel van de anderen.

> Wat in dit logboek uit de repository komt (datums, commits, documenten) is controleerbaar.
> De vakjes tussen « » moet ik nog invullen uit de overleggen met de docent en de opdrachtgever.

## Sprint 1 (7 t/m 25 september 2026)

| Datum | Werkzaamheden | Bewijs | Afwijking van de planning | Oorzaak | Invloed op de doorlooptijd | Tussenoplossing en afstemming |
| --- | --- | --- | --- | --- | --- | --- |
| 07-09 | Project opgezet met Next.js, eerste opzet van de pagina's, QR-bestellen aan tafel en het keukenscherm met live dashboard; Vercel ingesteld | commits `1342bfb`, `6fe7cae`, `0321c26` | Geen | — | Op schema | Afgesproken om klein te beginnen: eerst de hele stroom van QR tot keuken, daarna pas de details |
| 08-09 t/m 15-09 | — *(geen commits in deze periode)* | `git log` | **Ja — tien dagen zonder commit** | «invullen: lesrooster/andere vakken, wachten op duidelijkheid over de huisstijl» | De voorraadmodule schoof op van week 2 naar 17 september | Voorraad eerst in een JSON-bestand in plaats van in de database, zodat er geen account of sleutel nodig was; daarna opnieuw plannen |
| 16-09 | Huisstijl herontworpen: de eerste versie (0.9) leek te veel op een affiche; overgestapt op sfeer via één tapasfoto, een tegelmotief en warme typografie (1.0) | `docs/documentatie.md` §11 (versie 0.9 → 1.0) | **Ja — extra werk dat niet in de planning stond** | Het referentiebeeld was te letterlijk nagemaakt | Ongeveer een dag extra aan de huisstijl | Decoratie via SVG in plaats van meer foto's; het referentiebeeld alleen als kleurenvoorbeeld gebruiken. Let op: dit werk is **niet dezelfde dag gecommit** |
| 17-09 | Voorraadbeheer en het uitgiftescherm voor de keuken gebouwd: voorraad met par-niveau, recepten, automatisch afboeken en een mutatielog | commit `bac21d6` | Inhaalslag na de stilte van 8 t/m 15 september | Zie hierboven | Voorraad een week later dan gepland | Afgestemd in de dagstart: eerst de voorraad, de betaalmodule schoof door naar 24 september |
| 24-09 (09:50) | Keukenscherm bijgewerkt *(teamgenoot Eliyah)* | commit `6b4b1ce` | Nee | — | Op schema | — |
| 24-09 (14:46) | *(teamgenoot Eliyah)* Drie user stories op één dag afgerond: betaalmodule met rekening per tafel, live statuspagina met badge *gereed voor uitserveren*, eindtest van het volledige proces (12 controles) | commits `d537418`, `28910e7`, `0c0f0d1` | **Ja — drie stories op de laatste dag voor de review** | De betaalmodule was doorgeschoven vanaf 17 september | Alles kwam op één dag; er was weinig tijd over om te testen | Testomgeving reproduceerbaar gemaakt en direct na het bouwen getest in plaats van de dag erna |
| 24-09 (15:42–15:53) | *(teamgenoot Eliyah)* Eindtest herhaalbaar gemaakt, testomgeving voor de drie user stories gebouwd en het testrapport met resultaten, bevindingen en conclusies geschreven | `docs/eindtest-check.js`, `docs/checks/portfolio-test.js`, `docs/testrapport-us1-us3.md` | Nee, dit stond wel in de planning | — | Op schema | Twee identieke runs met dezelfde uitkomst: **34 van 34 controles geslaagd** |
| 24-09 (16:03) | *(teamgenoot Eliyah)* **Bugfix:** de betaalpagina las het sessie-id uit de query in plaats van uit het pad | commit `2a9aca7` | **Ja — fout gevonden tijdens het testen** | De route was op twee manieren te openen; de pagina pakte de verkeerde bron | Ongeveer een uur extra | Direct opgelost en opnieuw getest; daarna het testrapport bijgewerkt. Dit was precies de reden om te testen vóór de review |
| 25-09 (09:36–09:37) | Ondertekst van de homepagina bijgewerkt; wijzigingen van een teamgenoot samengevoegd | commits `3379c69`, `d9b4268` | Nee | — | Op schema | Samenvoegen met de remote om niets kwijt te raken |
| 25-09 (10:28) | **Bestellingen, voorraad en betalingen naar Supabase** (mijn grootste wijziging van sprint 1): tien tabellen met verwijzingen, RLS aan, en de API-routes en schermen omgezet | commit `8128f09`, `supabase/schema.sql`, `docs/checks/database-check.js` | **Ja — grote migratie op de dag van de review** | De opdrachtgever eist een database met minimaal vier onderling verbonden entiteiten | Riskant: er was geen tijd meer om uitgebreid te testen | Alleen wat nodig was omgezet, databasecontrole toegevoegd en de uitkomst in de review van 25-09 besproken met de docent |
| 25-09 | **Sprint 1 review en retrospective met de docent** | «verslag/uitnodiging toevoegen» | — | — | — | Uitkomst: «invullen: welke afspraken zijn gemaakt, wie pakt wat op voor sprint 2» |

**Samenvatting sprint 1:** de hele stroom van QR-code tot betaling werkt en is getest (34/34), en de database-eis
van de opdrachtgever is met tien tabellen ruim gehaald. De planning liep op twee punten uit: de voorraad een week
later door de stille periode van 8 t/m 15 september, en de betaalmodule die daardoor op de laatste dag moest.

> **Nog invullen:** op 24 september staat er geen commit van mij. Vul in wat jij die dag deed (of waarom je
> niet aan het project werkte) — ook een dag zonder werk is een afwijking die je moet melden, want de beoordelaar
> kijkt of jij de planning in de gaten hield.

## Sprint 2 (26 september t/m 16 oktober 2026)

| Datum | Werkzaamheden | Bewijs | Afwijking van de planning | Oorzaak | Invloed op de doorlooptijd | Tussenoplossing en afstemming |
| --- | --- | --- | --- | --- | --- | --- |
| 26-09 t/m 08-10 | — *(geen commits; de laatste commit is van 25 september)* | `git log`, `git status` (schoon) | **Ja — dertien dagen zonder commit terwijl de review op 16 oktober staat** | «invullen» | De vijf stories van sprint 2 (US12 t/m US16) staan nog op *Te doen* en er blijven acht dagen over | Sprint 2 moet nu starten: vandaag het bord bijwerken, de stories verdelen, US16 (rollen beveiligen, Must) en US12 eerst oppakken en daarna elke dag committen. Dit meld ik in de sprintplanning van 16 oktober aan de docent |
| «datum» | «wat heb je gedaan» | «commit» | «ja/nee» | «waarom» | «gevolgen voor de planning» | «welke keuze heb je gemaakt en met wie afgestemd» |

## Openstaande acties

| Actie | Wie | Wanneer | Status |
| --- | --- | --- | --- |
| Afstemmingsdocument met Maria & Marcus laten accorderen (eisen, wensen, prioriteit, doelen, opleverdatum) | Mohamed Benabdillah + opdrachtgever | vóór 16-10 | Open |
| Opdrachtgever uitnodigen voor de review van 16-10 en 06-11 | Mohamed Benabdillah | deze week | Open |
| Docent Koen van der Hulst bevestigen voor de review en retrospective van 16-10 | Mohamed Benabdillah | deze week | Open |
| Supabase-sleutels delen binnen het team zodat US13, US14 en US18 kunnen starten | Mohamed Benabdillah | vóór de sprintstart | Open |
| Definition of Done door de projectgroep laten ondertekenen | alle leden | vóór 16-10 | Open |
| Per werkdag minimaal één commit, ook als iets nog niet af is | alle leden | vanaf nu | Open |
| Git op mijn eigen naam zetten (`user.name` en `user.email`) zodat mijn commits herkenbaar van mij zijn | Mohamed Benabdillah | vandaag | Open |

## Wat ik de volgende keer anders doe

1. **Dagelijks committen**, ook bij werk dat nog niet af is: dan is de voortgang zichtbaar en kloppen de
   tijdstempels in het versiebeheer. De stille periode van 8 t/m 15 september kostte me een week op de voorraad.
2. **Grote wijzigingen niet op de dag van een review plannen.** De Supabase-migratie deed ik op 25 september
   om 10:28, vlak vóór de review. Daardoor heb ik de tien tabellen niet uitgebreid kunnen testen en moest ik
   in de review op mijn woorden vertrouwen in plaats van op bewijs.
3. **Eerst de kleuren bepalen, dan pas decoratie.** Mijn eerste huisstijl (versie 0.9) leek te veel op het
   referentiebeeld, waardoor ik op 16 september een halve dag opnieuw kon beginnen. Het referentiebeeld gebruik
   ik de volgende keer alleen als kleurvoorbeeld en niet als ontwerp.
4. **Mijn commits op mijn eigen naam zetten.** Ze staan nu op de gebruikersnaam `simo123-a11y` met een privé-
   e-mailadres, terwijl het mijn werk is. Met de juiste naam en mijn schoolmail kan de beoordelaar zien dat het
   werk van mij is — bij het eindgesprek wordt daar immers naar gevraagd.
5. **De afstemming met de opdrachtgever meteen vastleggen** (mail of verslag); nu moet ik dat achteraf
   reconstrueren, terwijl het juist het bewijs voor het afstemmen van de opdracht is.
