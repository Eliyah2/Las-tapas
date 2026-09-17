# Projectdocumentatie · Las Tapas (tafelbestelsysteem)

> **Schoolopdracht:** documentatie van alles wat er aan mijn kant is gemaakt en ontworpen.
> Versie 1.5 · 16 september 2026

| Gegeven | Invulling |
| --- | --- |
| Projectnaam | Las Tapas: bestellen aan tafel |
| Student | *(eigen naam invullen)* |
| Opleiding / klas | *(invullen)* |
| Docent | *(invullen)* |
| Periode | september 2026 |
| Techniek | Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Node |
| Status | Werkende demo met voorraadsysteem (bestandsopslag) + Supabase-schema klaar voor koppeling |

---

## 1. De opdracht

Een restaurant waar de gast **zonder bediening** kan bestellen:

1. De gast scant een **QR-code op tafel**.
2. Er opent een welkomstpagina met het tafelnummer er al in.
3. De gast bekijkt de **menukaart** en zet gerechten in een mandje.
4. De bestelling gaat naar de keuken; de gast krijgt een bevestiging.
5. Het **keukenscherm** toont alle bestellingen live en de kok zet de status op *nieuw → in bereiding → klaar*.
6. De zaak kan per tafel een **QR-code genereren en printen**.
7. De **voorraad** wordt bijgehouden: bij elke bestelling gaan de ingrediënten van de voorraad af, gerechten die niet meer gemaakt kunnen worden staan op de menukaart als *uitverkocht*, en leveringen en verliezen komen in een mutatielog.

**Doel van de opdracht:** leren werken met een modern webframework, een eigen huisstijl uitwerken en een volledige gebruikersstroom van begin tot eind bouwen.

---

## 2. Programma van eisen

| Eis | Invulling in het project |
| --- | --- |
| Werkt op mobiel én desktop | Alle pagina's zijn responsive (CSS Grid + media queries) |
| Bestellen zonder account | Geen login nodig; het tafelnummer uit de QR-code is de context |
| Bestelling komt live bij de keuken | Server-Sent Events (`/api/orders/stream`) pusht elke wijziging |
| Eigen huisstijl met Spaanse uitstraling | Zwart/wit met Spaans rood-geel, warme menukaart-typografie en één tapasfoto als achtergrond |
| Duidelijke feedback voor de gebruiker | Mandje onderaan, prijstotaal, bevestigingskaart, foutmeldingen |
| Voorraad klopt met de bestellingen | Recepten boeken automatisch af; niets afboeken als een bestelling niet kan |
| Uitverkocht is meteen zichtbaar | Menukaart toont *uitverkocht* en werkt live bij na het bijvullen |
| Voorraad is bij te houden | Par-niveau, leverancier en prijs per product, mutatielog en CSV-export |
| De keuken weet wat er is en wat ze pakt | Apart uitgiftescherm met pakmaten en een lijst van vandaag |
| Grote uitgiftes gaan niet ongemerkt | Rolkeuze plus goedkeuring door de hoofdchef boven een instelbare drempel |
| Veilige prijzen | Prijzen en namen komen **altijd van de server**, nooit van de browser |
| Toegankelijk | Semantische HTML, `aria-hidden` op decoratie, focusringen, `prefers-reduced-motion` |
| Ingrediënten zijn per gerecht te bekijken | Filter en sortering op gerecht, met de hoeveelheid per portie |

---

## 3. Technische stack en waarom

| Onderdeel | Keuze | Onderbouwing |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | Server- en clientcomponenten in één project, API-routes ingebouwd |
| Taal | **TypeScript** | Fouten in types (bijv. bestelstatus) worden al bij het compileren gevonden |
| UI | **React 19** | State per pagina (mandje, status) zonder extra libraries |
| Styling | **Tailwind CSS v4** + eigen `globals.css` | Tailwind voor snelle layout-hulp, eigen CSS voor de huisstijl |
| Typografie | **Playfair Display** + **Kaushan Script** via `next/font` | Menukaart-serif en handgeschreven accenten, meegebundeld zonder externe link |
| Live updates | **Server-Sent Events** | Eénrichtingsverkeer server → keukenscherm; simpeler dan WebSockets |
| QR-generatie | **`qrcode`** (npm) | QR als PNG leveren via een API-route, dus geen externe dienst nodig |
| Voorraadopslag | **JSON-bestand** (`data/voorraad.json`) | Geen account of sleutel nodig; met de hand te lezen en te back-uppen |
| Productinformatie | **Open Food Facts** | Gratis productendatabase zonder account, zonder inloggen en zonder API-sleutel |
| Database (gepland) | **Supabase / PostgreSQL** | Schema en seed staan klaar in `supabase/schema.sql` |
| Hosting | **Vercel** | Sluit direct aan op Next.js (`vercel.json` staat in het project) |

Standaardcommando's:

```bash
npm run dev     # ontwikkelserver op http://localhost:3000
npm run lint    # ESLint-controle
npm run build   # productiebuild
```

---

## 4. Huisstijl en designverantwoording

### 4.1 Uitgangspunt

De **kleuren** zijn het uitgangspunt: zwart en wit als basis met de rood en geel van de Spaanse vlag als accenten. Het referentiebeeld dat ik kreeg is alleen als kleurvoorbeeld gebruikt, niet als letterlijk ontwerp. De Spaanse sfeer komt daarom uit sfeer:

* één **tapasfoto** die als achtergrond van de home- en welkomstpagina staat;
* een **tegelmotief (azulejos)** als decoratieve band;
* **warme typografie** zoals op een menukaart;
* kleine Spaanse details: een geschilderde tegel als sieraad, een scheidingslijn met tegelruitje en Spaanse woorden als accentregel.

### 4.2 Kleurenpalet

| Naam | Hex | Gebruik |
| --- | --- | --- |
| `--negro` | `#17110F` | Tekst, randen, knoppen |
| `--carbon` | `#241B18` | Keukenscherm, donkere sluier over de foto |
| `--blanco` | `#FFFDF9` | Achtergrond, tekst op zwart |
| `--crema` | `#F8F1E6` | Warme vlakken en tegels |
| `--rojo` | `#B81D24` | Accenten, prijzen, hover, menukop |
| `--rojo-oscuro` | `#8C1219` | Diepere rode vlakken (menukaat-header) |
| `--amarillo` | `#F0B429` | Accentbalkjes, randen, focus |
| `--amarillo-licht` | `#F8DDA0` | Tekst op donkere vlakken |
| `--oliva` | `#6B7A45` | Groen accent (gereed-status in de keuken) |
| `--gris` | `#7D6D61` | Ondersteunende tekst |

Zwart en wit dragen het geheel, rood en geel zijn spaarzaam gebruikt als accent. Dat is precies zoals op de vlag, waar rood en geel samen maar een klein deel van het oppervlak innemen.

### 4.3 Typografie

| Rol | Lettertype | Waarom |
| --- | --- | --- |
| Koppen | **Playfair Display** (serif, 500–700) | Warme menukaart-uitstraling, past bij een Spaans restaurant |
| Accentregels | **Kaushan Script** | Handgeschreven, als met krijt op een schoolbord in een tasca |
| Lopende tekst | Systeem-schreefloos (`system-ui`) | Rustig, goed leesbaar op mobiel |

De lettertypes worden via `next/font/google` geladen (`app/layout.tsx`), dus ze worden meegebundeld en er is geen losse link naar Google nodig.

### 4.4 Terugkerende vormelementen

| Element | Klasse / component | Werking |
| --- | --- | --- |
| Logo | `.brand-mark` | Rond rood tegelstuk met monogram en een gele ring |
| Knop | `.button` | **Zwart met witte tekst**, afgeronde hoeken en zachte schaduw; bij hover rood |
| Scheidingslijn | `Divider` | Twee lijnen met een geel-rood tegelruitje in het midden |
| Tegelband | `AzulejoBand` | Strook met een azulejo-patroon als decoratieve afsluiting |
| Tegelsieraad | `Rosette` | Geschilderde tegel als rond sieraad bij sfeertekst en bevestiging |
| Sfeerfoto | `.page-photo` + `.page-overlay` | Eén tapasfoto als vaste achtergrondlaag over de hele pagina, met een warme donkere sluier (`.page-overlay`) zodat alle tekst erboven leesbaar blijft. De pagina's waar dit gebeurt krijgen `isolation: isolate`, zodat de fotolaag netjes achter de inhoud blijft |

### 4.5 Waarom er maar één foto is

Er staat bewust **één foto** in het project (`public/tapas.jpg`), en die staat op de home- en welkomstpagina als **vaste achtergrond over de hele pagina**: de foto blijft staan terwijl de inhoud eroverheen scrolt. De leesbaarheid is geregeld met een donkere sluier (`.page-overlay`) met een rode gloed rechtsonder en een gele gloed linksboven, in de kleuren van de vlag maar subtiel. De overige sfeer komt uit SVG-decoratie, die scherp blijft en niets extra's weegt.

**Fotoverantwoording:** "Spanish Tapas" door Toben, via Wikimedia Commons, licentie **CC BY-SA 4.0** (zie de bronnenlijst).

### 4.6 Responsief ontwerp

| Breekpunt | Aanpassing |
| --- | --- |
| `< 700px` | Eén kolom op de homepagina, sfeertekst onder elkaar, kleinere koppen |
| `≥ 700px` | Twee kolommen op de homepagina, keukenscherm met drie kolommen naast elkaar |
| Overig | `clamp()` voor koppen en tussenspaties zodat alles meeschaalt |

---

### 4.7 Screenshots van de huisstijl

Alle onderstaande beelden komen uit de automatische controle (`docs/checks/screenshot-check.js`).

| Pagina | Desktop (1440×900) | Mobiel (390×844) |
| --- | --- | --- |
| Home (foto-hero met tegelband) | ![Home op desktop](screenshots/home-desktop.png) | ![Home op mobiel](screenshots/home-mobiel.png) |
| Welkom na QR-scan | ![Welkom op desktop](screenshots/welkom-desktop.png) | ![Welkom op mobiel](screenshots/welkom-mobiel.png) |
| Menukaart | ![Menukaart op desktop](screenshots/menu-desktop.png) | ![Menukaart op mobiel](screenshots/menu-mobiel.png) |
| Keukenscherm | ![Keukenscherm op desktop](screenshots/keuken-desktop.png) | ![Keukenscherm op mobiel](screenshots/keuken-mobiel.png) |
| Voorraadscherm (manager) | ![Voorraad op desktop](screenshots/voorraad-desktop.png) | ![Voorraad op mobiel](screenshots/voorraad-mobiel.png) |
| Uitgiftescherm (keuken) | ![Uitgifte op desktop](screenshots/uitgifte-desktop.png) | ![Uitgifte op mobiel](screenshots/uitgifte-mobiel.png) |
| Menukaart met uitverkocht gerecht | ![Uitverkocht op desktop](screenshots/menu-uitverkocht-desktop.png) | ![Uitverkocht op mobiel](screenshots/menu-uitverkocht-mobiel.png) |
| Voorraad gefilterd op één gerecht | ![Voorraad op gerecht](screenshots/voorraad-gerecht-desktop.png) | ![Uitgifte op gerecht](screenshots/uitgifte-gerecht-desktop.png) |
| QR-codes | ![QR-pagina op desktop](screenshots/qr-desktop.png) | ![QR-pagina op mobiel](screenshots/qr-mobiel.png) |

Goedkeuring van een grote uitgifte, gezien als hoofdchef (het scherm dat de kok te zien krijgt staat op de rij hierboven, bij het uitgiftescherm):

![Goedkeuren van een aanvraag](screenshots/uitgifte-goedkeuren.png)

---

## 5. Pagina's en gebruikersstroom

```
QR-code op tafel
      │
      ▼
/welkom?tafel=5   ──►  /menu?tafel=5  ──►  POST /api/orders  ──►  bevestiging
   sfeerfoto met           menukaart            bestelling           "Gracias"
   tafelnummer             + mandje             naar de server
                                                      │
                                                      ▼
                                              /keuken  (live via SSE)
                                        nieuw → in bereiding → klaar
```

| Route | Bestand | Rol | Wat het doet |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | Iedereen | Homepage met tapasfoto en vijf ingangen: menukaart, keuken, voorraad, uitgifte en QR |
| `/welkom` | `app/welkom/page.tsx` | Gast | Welkomstpagina met foto en het tafelnummer uit de link |
| `/menu` | `app/menu/page.tsx` | Gast | Menukaart, mandje, opmerking voor de keuken, bestellen |
| `/keuken` | `app/keuken/page.tsx` | Keuken | Live overzicht in drie kolommen met statusknoppen |
| `/voorraad` | `app/voorraad/page.tsx` | Manager | Voorraad bijhouden: kerncijfers, producten, mutaties, recepten, CSV, drempel instellen, producten zoeken en filteren op gerecht |
| `/uitgifte` | `app/uitgifte/page.tsx` | Keuken | Zien wat er is en in één tik afboeken wat je pakt, rolkeuze, aanvragen voor de hoofdchef, filter op gerecht en een lijst van vandaag met een knop om iets terug te zetten |
| `/qr` | `app/qr/page.tsx` | Zaak | QR-code per tafel maken en downloaden als PNG |

Elke bestelling zet de voorraad in beweging:

```
/menu  ──►  POST /api/orders  ──┬── voorraad toereikend?  ──►  order naar de keuken
                                └── te weinig voorraad?    ──►  409 + tekorten,
                                                                gerecht gaat op
                                                                "uitverkocht"
                                             │
                                             ▼
                             /api/voorraad/stream  ──►  /keuken, /menu,
                                                        /voorraad en /uitgifte
                                                        lopen live mee
```

---

## 6. API-routes

| Endpoint | Methode | Body / query | Antwoord |
| --- | --- | --- | --- |
| `/api/orders` | POST | `{ table, items: [{ id, quantity }], note? }` | `201 { order }` of `400 { error }` |
| `/api/orders/[id]/status` | PATCH | `{ status: "nieuw" \| "bereiden" \| "klaar" }` | `200 { order }` of `400` / `404` |
| `/api/orders/stream` | GET | geen | `text/event-stream` met telkens een `orders`-event |
| `/api/qr` | GET | `?tafel=5` | PNG-afbeelding van de QR-code |

**Validatie in `/api/orders`:** het tafelnummer moet aanwezig zijn, de bestelling mag niet leeg zijn, elk gerecht moet bestaan én beschikbaar zijn, en het aantal moet een heel getal tussen 1 en 20 zijn. De **prijs wordt server-side opgezocht** in `lib/menu.ts`, zodat niemand via de browser een eigen prijs kan meesturen.

---

## 7. Voorraadsysteem

### 7.1 Wat het doet

| Functie | Uitleg |
| --- | --- |
| Voorraad bijhouden | 30 producten met eenheid (gram, ml of stuk), par-niveau, inkoopprijs en leverancier |
| Automatisch afboeken | Bij elke bestelling gaan de ingrediënten er volgens het recept af (13 gerechten, gekoppeld aan de menukaart) |
| Nooit te veel beloven | Kan een bestelling niet gemaakt worden, dan krijgt de gast een nette melding en wordt er **niets** afgeboekt (alles of niets) |
| Uitverkocht op de menukaart | Gerechten waarvan de voorraad op is staan als *uitverkocht*, met de melding *"Vandaag even niet beschikbaar: ..."* en *"Nog 2"*-labels als het bijna op is |
| Twee schermen | `/voorraad` voor de manager, `/uitgifte` voor de keuken (zie 7.6) |
| Rollen zonder inloggen | Je kiest eenmalig je rol (kok, hoofdchef of manager) en die wordt in de browser bewaard; elke mutatie legt vast wie hem deed |
| Goedkeuring van grote uitgiftes | Pak je als kok voor meer dan de drempel (standaard € 15), dan gaat de uitgifte naar *wacht op goedkeuring* en boekt pas af als de hoofdchef hem goedkeurt (zie 7.7) |
| Zelf afboeken | De keuken boekt in het uitgiftescherm af wat ze pakt, met reden *uitgifte* en een notitie; per ongeluk? één klik zet het terug |
| Mutatielog | Elke levering, elk verbruik, elk verlies en elke telling met tijdstip, product en notitie |
| Kerncijfers | Voorraadwaarde, producten onder par, lege producten, uitverkochte gerechten, mutaties vandaag |
| Snelacties | Per product boeken (levering, verlies of telling), *+ par* in één klik, alles in één keer bijvullen, beginvoorraad herstellen |
| Sorteren en filteren op gerecht | Je ziet per product voor welke gerechten het dient, kunt de lijst op gerecht sorteren, en met één keuze alleen de ingrediënten van één gerecht tonen (met de hoeveelheid per portie), zie 7.8 |
| CSV-export | De hele voorraad als CSV voor Excel, met puntkomma's en Nederlandse komma's |
| Nieuw product | Zelf toevoegen, met zoeken in de gratis productendatabase Open Food Facts |
| Live | Via Server-Sent Events loopt elk scherm mee: keuken, voorraad en menukaart |

### 7.2 Waarom een JSON-bestand en geen database

Voor de opdracht mocht een externe dienst gebruikt worden zolang die gratis is en **geen account of login** vraagt. Dat blijkt niet te bestaan voor opslag: Supabase, MongoDB Atlas en vergelijkbare diensten zijn gratis te beginnen, maar vragen allemaal om een account en een API-sleutel.

Daarom staat de voorraad in **`data/voorraad.json`**:

* geen account, geen sleutel, geen internet nodig;
* met de hand te lezen, te controleren en te back-uppen;
* overleeft een herstart van de ontwikkelserver (anders dan de in-memory bestellingen).

Staat de app op een server met alleen-lezen schijf, dan blijft alles werken in het geheugen en zet het scherm daar een waarschuwing neer (het veld `persistent` in het overzicht).

### 7.3 Gegevensmodel

| Type | Velden |
| --- | --- |
| `Product` | `id`, `name`, `unit`, `stock`, `parLevel`, `costPerUnit`, `supplier`, `updatedAt` |
| `Movement` | `id`, `ingredientId`, `name`, `delta`, `reason` (`levering` \| `verbruik` \| `uitgifte` \| `verlies` \| `correctie`), `note`, `door?` (de rol die het boekte), `createdAt` |
| `Aanvraag` | `id`, `ingredientId`, `name`, `unit`, `amount`, `waarde`, `note`, `aangevraagdDoor`, `status` (`open` \| `goedgekeurd` \| `afgewezen`), `createdAt`, `behandeldDoor?`, `behandeldOp?`, `reden?` (waarom het afgewezen is) |
| `Recipe` | `menuItemId` met regels `{ ingredientId, amount }` |
| `GerechtStatus` | `maakbaar`, `porties`, `tekort[]` per gerecht |

Het bestand bevat de producten en de laatste 500 mutaties. De recepten staan bewust **niet** in het bestand: die horen bij het menu en staan in de seed, zodat je ze in één bestand beheert.

### 7.4 Zo houd je het bij

| Wat | Waar |
| --- | --- |
| Producten, par-niveaus, prijzen, leveranciers | `lib/voorraad-seed.ts` |
| Recepten per gerecht | `lib/voorraad-seed.ts` |
| Actuele stand, mutaties en aanvragen | `data/voorraad.json` (staat in `.gitignore`) |
| Terug naar de beginvoorraad | Knop *Beginvoorraad herstellen* op `/voorraad`, of `data/voorraad.json` weggooien |

Een nieuw product in de seed zet je er gewoon bij: bij de volgende start wordt het automatisch aan de voorraadlijst toegevoegd.

### 7.5 API-routes van het voorraadsysteem

| Endpoint | Methode | Wat het doet |
| --- | --- | --- |
| `/api/voorraad` | GET | Volledig overzicht: producten, mutaties, recepten, status per gerecht en de kerncijfers |
| `/api/voorraad` | POST | Nieuw product toevoegen (naam, eenheid, voorraad, par, prijs, leverancier) |
| `/api/voorraad/uitgifte` | POST | De keuken boekt af wat ze pakt; boven de drempel wordt er niets afgeboekt maar een **aanvraag** aangemaakt |
| `/api/voorraad/aanvragen/[id]` | PATCH | Aanvraag `goedkeuren` of `afwijzen`; alleen de rol **hoofdchef** mag dat (anders 403). Goedkeuren boekt de voorraad af |
| `/api/voorraad/[id]` | PATCH | Mutatie boeken (`delta` of `naar` met een `reason`) of productgegevens aanpassen |
| `/api/voorraad/[id]` | DELETE | Product uit de lijst halen (met een correctie in het log) |
| `/api/voorraad/beschikbaar` | GET | Licht antwoord met alleen de beschikbaarheid per gerecht, voor de menukaart |
| `/api/voorraad/bijvullen` | POST | Alles wat onder par zit in één keer bijvullen |
| `/api/voorraad/reset` | POST | Terug naar de beginvoorraad uit de seed |
| `/api/voorraad/export` | GET | CSV-download van de hele voorraad |
| `/api/voorraad/zoek` | GET | Producten zoeken via Open Food Facts |
| `/api/voorraad/instellingen` | POST | Automatisch afboeken bij bestellingen aan- of uitzetten en de goedkeuringsdrempel instellen |
| `/api/voorraad/stream` | GET | Live overzicht via Server-Sent Events |

De redenen die bij een mutatie horen zijn `levering`, `verbruik` (automatisch uit een bestelling), `uitgifte` (de keuken pakt iets), `verlies` en `correctie` (telling). Een uitgifte die door de hoofdchef is goedgekeurd houdt dezelfde reden `uitgifte`, maar krijgt `door: "hoofdchef"` en de notitie *aangevraagd door de kok* mee; zo blijft het één soort mutatie met een duidelijk spoor.

Bij elke handmatige mutatie legt de store ook vast **wie** hem deed (`door`): een rol zoals `kok`, `hoofdchef` of `manager`. Automatisch verbruik uit een bestelling heeft geen rol, want dat gebeurt door het systeem; daar staat de tafel in de notitie.

`POST /api/orders` is uitgebreid: eerst wordt de bestelling tegen de recepten afgeboekt. Lukt dat niet, dan volgt **HTTP 409** met de tekorten erbij in plaats van een bestelling die de keuken niet kan maken.

### 7.6 Twee schermen: de manager en de keuken

| | `/voorraad` (manager) | `/uitgifte` (keuken) |
| --- | --- | --- |
| Doel | Inkopen, bijbestellen, controleren | Zien wat er is en afboeken wat je pakt |
| Kerncijfers en voorraadwaarde | ja | nee, dat is informatie voor de manager |
| Producten aanpassen of verwijderen | ja | nee |
| Leveringen, verliezen en tellingen boeken | ja | nee |
| Snel pakken (− 250 g, − 6 st, …) | nee | ja, met per product welke gerechten het gebruiken |
| Eigen hoeveelheid met notitie ("voor de paella") | nee | ja |
| Vandaag gepakt terugzetten | nee | ja |
| CSV-export en receptenoverzicht | ja | nee |
| Automatisch afboeken instellen | ja | ziet alleen de waarschuwing |
| Goedkeuringsdrempel instellen | ja, veld *Goedkeuring vanaf* | nee |
| Open aanvragen zien | als kerncijfer (*grote uitgiftes voor de hoofdchef*) | als wachtrij met de bedragen erbij |
| Grote uitgiftes goedkeuren of afwijzen | nee, dat is juist het punt van de drempel | ja, maar alleen met de rol *hoofdchef* |

**Nooit dubbel tellen.** Er zijn twee manieren waarop voorraad kan afgaan: automatisch per recept bij een bestelling, of doordat de keuken zelf pakt. Allebei tegelijk zou dubbel tellen. Daarom staat er op het voorraadscherm de schakelaar **Bestellingen automatisch afboeken**:

* **aan** (standaard): de recepten rekenen af bij elke bestelling, het uitgiftescherm is dan vooral het overzicht voor de keuken;
* **uit**: alleen wat de keuken op `/uitgifte` registreert gaat van de voorraad af; de bestel-API controleert nog wel of een gerecht gemaakt kan worden, maar boekt niets meer af.

Het uitgiftescherm waarschuwt de keuken zolang de automatische afboeking aanstaat, zodat duidelijk is waar de getallen vandaan komen.

### 7.7 Rollen en goedkeuring van grote uitgiftes

In een echte keuken mag niet iedereen zomaar voorraad afboeken, en al helemaal niet in grote hoeveelheden. Daarom kent het systeem drie rollen:

| Rol | Wat hij mag |
| --- | --- |
| **Kok** | Zien wat er is, normale hoeveelheden pakken (onder de drempel) en zijn eigen uitgiftes terugzetten |
| **Hoofdchef** | Alles wat de kok mag, plus uitgiftes boven de drempel goedkeuren of afwijzen |
| **Manager** | Alles van het voorraadscherm: producten aanpassen, leveringen en tellingen boeken, de drempel instellen |

**Rollen zonder inloggen.** Op het uitgiftescherm staat bovenaan een rij knoppen *Ik werk als …*. Eén klik zet de rol in `localStorage`, dus op een tablet in de keuken hoef je dat maar één keer te doen. Wie geen rol kiest, werkt als *kok*: de veiligste standaard. Dat is bewust géén echt account: inloggen vraagt een dienst met een account, en dat mocht niet voor deze opdracht. In de documentatie en op het scherm staat dat ook zo, zodat het niet lijkt alsof dit waterdicht is.

**Hoe de goedkeuring werkt**

1. De drempel staat standaard op **€ 15** (constante `STANDAARD_DREMPEL`) en is op het voorraadscherm aan te passen (het veld *Goedkeuring vanaf*).
2. De kok boekt een hoeveelheid; het systeem rekent de waarde uit (hoeveelheid × inkoopprijs).
3. Blijft die waarde **onder** de drempel, dan gaat de voorraad er meteen af (reden *uitgifte*).
4. Komt die er **boven**, dan wordt er **niets** afgeboekt. In plaats daarvan komt er een **aanvraag** met status *open*, met daarnaast wat de aanvraag zou kosten.
5. De kok ziet zijn aanvraag klaarstaan met het label *wacht op hoofdchef*, maar heeft **geen** goedkeurknop. Alleen de rol *hoofdchef* krijgt de knoppen *Goedkeuren* en *Afwijzen*.
6. Goedkeuren boekt de voorraad alsnog af (reden *uitgifte*, met `door: hoofdchef` en *aangevraagd door de kok* in de notitie); afwijzen laat de voorraad met rust, zet de aanvraag op *afgewezen* en verdwijnt uit de wachtrij (met een eigen lijstje *Afgewezen vandaag*).

De aanvraag wordt **server-side** opnieuw doorgerekend op het moment van goedkeuren, niet op het moment van aanvragen. Is de voorraad intussen op, dan krijgt de chef een melding dat het niet meer kan (HTTP 409) in plaats van een negatieve voorraad.

De drempel, de open aanvragen en het besluit staan in `data/voorraad.json`, zodat de keuken op een tweede tablet meteen ziet wat er speelt. **Waar staat wat?** Het goedkeuren gebeurt op `/uitgifte`, want daar werkt de hoofdchef en daar zie je ook direct wat er gepakt wordt. Op `/voorraad` stelt de manager de drempel in (`Goedkeuring vanaf €`) en ziet hij hoeveel aanvragen er nog openstaan, zonder dat hij ze zelf kan goedkeuren.

### 7.8 Ingrediënten opzoeken en sorteren per gerecht

Op beide voorraadschermen kun je de producten **op gerecht** bekijken. Dat werkt op drie manieren:

| Manier | Wat het doet |
| --- | --- |
| Regel onder elk product | *voor Patatas Bravas, Tortilla Española*: de gerechten waarin dit ingrediënt zit (staat ook op het uitgiftescherm, zodat de kok de link ziet) |
| Sortering *Op gerecht* | De ingrediënten van hetzelfde gerecht staan naast elkaar, op alfabetische volgorde van het gerecht. Een ingrediënt dat in meerdere gerechten zit staat bij het eerste gerecht waar het in voorkomt |
| Filter *Alle gerechten* | Kies je één gerecht, dan blijven alleen de ingrediënten van dat recept over. Bij elk product staat dan *nodig: 250 g per portie*, en op het uitgiftescherm staan ze **in de volgorde van het recept**, zodat de kok van boven naar beneden kan werken |

Dit is bewust dezelfde gegevensbron als het automatisch afboeken: de recepten uit `lib/voorraad-seed.ts`. Er kan dus geen verschil ontstaan tussen wat het systeem afboekt en wat het scherm als ingrediënten toont. De rekenkundige kant staat in twee pure functies in `lib/voorraad-types.ts`:

* `gebruikPerIngredient(recepten)` draait de recepten om naar *per ingrediënt welke gerechten het gebruiken*;
* `ingredientenVanGerecht(recepten, menuItemId)` geeft de ingrediënten van één gerecht met de hoeveelheid per portie.

Op het voorraadscherm staat bij elke receptkaart ook de knop **Toon deze ingrediënten in de lijst**: die zet het filter en de sortering in één klik goed en scrolt naar de productlijst. Dat is de snelste weg van "welk gerecht wil ik maken" naar "wat heb ik daarvoor nodig".

### 7.9 Externe API: Open Food Facts

Bij het toevoegen van een product kun je op naam zoeken in **Open Food Facts**. Dit is een gratis, open database zonder account, zonder inloggen en zonder API-sleutel, dus precies binnen de eisen. Uit de hoeveelheid ("500 ml", "250 gram") leidt de app meteen de eenheid af.

De dienst is een extraatje en geen afhankelijkheid: reageert hij niet of is er geen internet, dan verschijnt de melding dat je het product met de hand kunt invullen en werkt de rest gewoon.

---

## 8. Datamodel

Het schema in `supabase/schema.sql` beschrijft vier tabellen:

| Tabel | Velden (kort) | Doel |
| --- | --- | --- |
| `menu_categories` | `id`, `name`, `sort_order` | Categorieën zoals Tapas, Dranken |
| `menu_items` | `id`, `category_id`, `name`, `description`, `price`, `available` | De gerechten met prijs en beschikbaarheid |
| `orders` | `id (uuid)`, `table_number`, `status`, `note`, timestamps | Eén bestelling per tafel |
| `order_items` | `id`, `order_id`, `menu_item_id`, `name`, `price`, `quantity` | De regels van een bestelling |

Verder in het schema:

* **Triggers** `set_updated_at` houden `updated_at` automatisch bij.
* **Row Level Security** staat aan; alleen categorieën en beschikbare gerechten zijn publiek leesbaar. Bestellingen schrijven gebeurt uitsluitend via de server-API (met een secret key die RLS omzeilt), niet rechtstreeks vanuit de browser.
* **View** `orders_with_items` levert een bestelling met zijn regels als JSON, klaar voor het keukenscherm.
* **Seed-data**: 4 categorieën en 13 gerechten, herhaalbaar uit te voeren (`on conflict ... do update`).

De demo werkt nu nog met een **in-memory store** (`lib/orders.ts`), zodat de app zonder database draait. Het schema staat klaar om die store te vervangen.

---

## 9. Bestandsstructuur

```
app/
  layout.tsx             root-layout, metadata en de lettertypes (next/font)
  globals.css            volledige huisstijl (kleuren, decoratie, alle pagina's)
  page.tsx               homepagina met tapasfoto
  welkom/page.tsx        welkomstpagina na QR-scan
  menu/page.tsx          menukaart + mandje + bestellen
  keuken/page.tsx        keukenscherm met live updates
  qr/page.tsx            QR-generator
  api/
    orders/route.ts              bestelling plaatsen
    orders/[id]/status/route.ts  status wijzigen
    orders/stream/route.ts       live stream (SSE)
    qr/route.ts                  QR als PNG
  voorraad/page.tsx      voorraadscherm voor de manager
  uitgifte/page.tsx      uitgiftescherm voor de keuken
  api/voorraad/          voorraad-API (zie 7.5)
  api/menu/route.ts      menukaart als JSON
components/
  decor.tsx              SVG-decoratie: tegelband, tegel-sieraad en scheidingslijn
  rol-kiezer.tsx         rolkeuze (kok / hoofdchef / manager) met bewaren in localStorage
lib/
  menu.ts                menukaart (bron van waarheid voor namen en prijzen)
  orders.ts              in-memory bestellingen-store + abonnementen voor SSE
  format.ts              prijs- en hoeveelhedopmaak in het Nederlands
  voorraad-types.ts      types en rekenwerk van de voorraad (ook bruikbaar in de browser)
  inventory.ts           voorraadstore met bestandsopslag en mutaties
  voorraad-seed.ts       beginvoorraad, par-niveaus, prijzen en recepten
public/
  tapas.jpg              de enige foto, gebruikt als achtergrond
data/
  voorraad.json          actuele voorraadstand (staat in .gitignore)
supabase/schema.sql      databaseschema, policies, view en seed-data
docs/documentatie.md     dit document
docs/screenshots/        schermafbeeldingen van alle pagina's
docs/checks/             controlescripts (Playwright en API-tests)
```

**Ontwerpkeuze:** alle styling staat in één bestand (`globals.css`) met beschrijvende klassenamen per pagina. Dat maakt de huisstijl makkelijk te presenteren en aan te passen, en houdt de componenten leesbaar. Tailwind wordt alleen gebruikt voor kleine layout-hulpjes.

---

## 10. Wat ik zelf heb gemaakt (overzicht van mijn werk)

| # | Onderdeel | Wat er is gedaan |
| --- | --- | --- |
| 1 | Projectopzet | Next.js-project met TypeScript opgezet, mappenstructuur ingericht |
| 2 | Menukaart-data | `lib/menu.ts` met 4 categorieën en 13 gerechten, inclusief prijzen en omschrijvingen |
| 3 | Bestel-API | `POST /api/orders` met volledige servervalidatie van tafel, items en aantallen |
| 4 | Status-API | `PATCH /api/orders/[id]/status` met controle op toegestane statussen |
| 5 | Live keukenscherm | SSE-stream met ping en opruimen van verbindingen + drie kolommen met statusknoppen |
| 6 | QR-generator | API-route die een QR naar `/welkom?tafel=…` maakt, plus downloadpagina |
| 7 | Gastflow | Welkom- en menupagina met mandje, aantal-bediening, opmerkingenveld en bevestiging |
| 8 | Databaseschema | Supabase-schema met constraints, triggers, RLS-policies, view en seed |
| 9 | Huisstijl | Kleurpalet (zwart/wit met rood-geel), menukaart-typografie en knopstijl uitgewerkt |
| 10 | Decoratie | Zelfgemaakte SVG's: azulejo-tegelband, tegel-sieraad en scheidingslijn met ruitje |
| 11 | Foto | Vrij bruikbare tapasfoto gezocht, gedownload en als achtergrond van home en welkom gezet |
| 12 | Layoutherziening (16-09) | Volledige restyling naar de warme Spaanse tapasstijl, inmiddels op alle zeven pagina's |
| 13 | Documentatie | Dit verslag, bijgehouden tijdens het bouwen |
| 14 | Controle | Playwright-script dat alle pagina's op twee schermbreedtes nakijkt en screenshots maakt |
| 15 | Voorraadgegevens | 30 producten met eenheid, par-niveau, inkoopprijs en leverancier + recepten voor alle 13 gerechten |
| 16 | Voorraadstore | `lib/inventory.ts`: opslag in een JSON-bestand, mutaties met reden, automatisch verbruik, alles-of-niets-controle en live-abonnementen |
| 17 | Voorraad-API | Acht routes plus CSV-export en productzoeker (Open Food Facts) |
| 18 | Voorraadscherm | `/voorraad` met kerncijfers, snelacties per product, nieuw product, inklapbare recepten en mutatielog |
| 19 | Koppeling met de kaart | Uitverkochte gerechten op de menukaart, 409 bij te weinig voorraad en een voorraadteller op het keukenscherm |
| 20 | Voorraadtests | `docs/checks/voorraad-test.js` (47 controles), `docs/checks/uitverkocht-check.js` en `docs/checks/aanvraag-check.js` |
| 21 | Uitgiftescherm | `/uitgifte` voor de keuken: pakmaten per product, eigen hoeveelheid met notitie, welke gerechten het product gebruiken en een lijst van vandaag met een knop om iets terug te zetten |
| 22 | Geen dubbele afboeking | Schakelaar *Bestellingen automatisch afboeken* op het voorraadscherm, met uitleg in beide schermen |
| 23 | Uitgiftereden | Nieuwe mutatiereden `uitgifte`, zodat de manager in het log ziet wat de keuken zelf pakte |
| 24 | Rollen | Drie rollen (kok, hoofdchef, manager) met eenmalige keuze per apparaat, zonder inloggen; elke handmatige mutatie en elke aanvraag legt vast wie hem deed (`door` en `aangevraagdDoor`) |
| 25 | Goedkeuring van grote uitgiftes | Instelbare drempel (standaard € 15) op het voorraadscherm; aanvragen boven de drempel boeken niets af tot de hoofdchef goedkeurt, met een wachtrij en een knop om af te wijzen |
| 26 | Controle van de rollen | Browsertest (`docs/checks/aanvraag-check.js`) die aantoont dat een kok geen goedkeurknop heeft, dat de hoofdchef wel mag goedkeuren en dat de voorraad daarna precies klopt |
| 27 | Rekenwerk per gerecht | `gebruikPerIngredient` en `ingredientenVanGerecht` in `lib/voorraad-types.ts`: de recepten omdraaien naar *per ingrediënt welke gerechten het gebruiken* |
| 28 | Filter en sortering op gerecht | Op beide schermen een keuzelijst met alle gerechten, sortering *Op gerecht* op het voorraadscherm, de benodigde hoeveelheid per portie en de knop *Toon deze ingrediënten in de lijst* bij elke receptkaart |

---

## 11. Changelog / logboek

| Datum | Versie | Wat is er gedaan |
| --- | --- | --- |
| 07-09-2026 | 0.1 | Project opgezet, eerste opzet van pagina's en bestel-API |
| 14-09-2026 | 0.2 | Menukaart, keukenscherm met live stream en QR-generator toegevoegd |
| 15-09-2026 | 0.3 | Supabase-schema met RLS, view en seed-data geschreven |
| 16-09-2026 | 0.9 | Eerste huisstijl opgezet met zwart/wit en rood-geel, maar met letterlijke affiche-elementen (stralen, hoekhaken, vlagbadge). Die zijn daarna geschrapt omdat ze te veel als een poster oogden |
| 16-09-2026 | 1.5 | **Ingrediënten sorteren en filteren op gerecht:** onder elk product staat voor welke gerechten het dient, op het voorraadscherm kun je op gerecht sorteren en op één gerecht filteren (met de hoeveelheid per portie), het uitgiftescherm toont de ingrediënten van een gekozen gerecht in de volgorde van het recept, en bij elke receptkaart staat een knop om die ingrediënten direct in de lijst te zetten; 14 extra browsertests (`docs/checks/gerecht-check.js`) |
| 16-09-2026 | 1.4 | **Rollen en goedkeuring toegevoegd:** rolkeuze (kok, hoofdchef, manager) op het uitgiftescherm zonder inloggen, elke handmatige mutatie legt vast wie hem deed, en uitgiftes boven een instelbare drempel (standaard € 15) gaan naar *wacht op hoofdchef* waarbij alleen de hoofdchef mag goedkeuren of afwijzen; wachtrij en lijst van afgewezen aanvragen op het uitgiftescherm, teller op het voorraadscherm; 15 extra automatische controles (47 in totaal) en een browsertest van de goedkeuringsflow |
| 16-09-2026 | 1.3 | **Uitgiftescherm voor de keuken toegevoegd** (`/uitgifte`): zien wat er is, in één tik afboeken wat je pakt (per product ook welke gerechten het gebruiken), eigen hoeveelheid met notitie, lijst van vandaag met terugzet-knop; nieuwe mutatiereden *uitgifte*; schakelaar *Bestellingen automatisch afboeken* zodat de keuken en de recepten nooit dubbel tellen; 7 extra automatische controles (32 in totaal) |
| 16-09-2026 | 1.2 | **Voorraadsysteem toegevoegd:** 30 producten met par-niveau en leverancier, recepten voor alle gerechten, automatisch afboeken bij een bestelling, bestelling weigeren (409) als er te weinig voorraad is, uitverkochte gerechten op de menukaart, voorraadscherm met kerncijfers/snelacties/mutatielog/CSV-export, producten zoeken via Open Food Facts en live bijwerken via SSE; 25 automatische controles toegevoegd |
| 16-09-2026 | 1.1 | De tapasfoto staat nu als **vaste achtergrond over de hele pagina** in plaats van alleen achter de hero; op de homepagina is alle tekst daarom licht geworden en kreeg de tegelband een donkere variant |
| 16-09-2026 | 1.0 | **Definitieve huisstijl:** warme Spaanse tapasstijl met de kleuren van de vlag: zwarte knoppen met witte tekst, Playfair Display-koppen met Kaushan Script-accenten, azulejo-tegelband, scheidingslijnen met tegelruitje, één vrij bruikbare tapasfoto (`public/tapas.jpg`, CC BY-SA 4.0) als achtergrond van home en welkom; sluit-tag-bug in de menupagina en lint-fout in het keukenscherm opgelost; screenshots en controlescript toegevoegd; deze documentatie geschreven |

> **Logboek per les** (zelf invullen):
>
> | Les | Datum | Gedaan | Probleem | Oplossing | Volgende keer |
> | --- | --- | --- | --- | --- | --- |
> | 1 | | | | | |
> | 2 | | | | | |
> | 3 | | | | | |

---

## 12. Testen en verificatie

**Geautomatiseerd**

```bash
npm run lint     # geen ESLint-fouten
npm run build    # productiebuild zonder typefouten
```

**Automatische browsercontrole** (met de dev-server aan op `http://localhost:3000`)

```bash
node docs/checks/screenshot-check.js
```

Dit script maakt van alle **zeven** pagina's een screenshot in twee weergaven en controleert automatisch op:

* horizontale overloop (mag nergens scrollen);
* de knopkleuren: zwarte achtergrond met witte tekst;
* of de tapasfoto als achtergrond geladen is op de pagina's waar dat hoort (door een screenshot met en zonder de fotolaag te vergelijken, want een foto die per ongeluk achter de pagina-achtergrond valt zou je anders niet zien).

Uitkomst van de laatste controle: **geen problemen** op alle veertien combinaties van pagina en schermbreedte, en geen fouten in de browserconsole.

**Voorraadtests** (met de dev-server aan)

```bash
node docs/checks/voorraad-test.js      # 47 controles van de hele voorraadflow
node docs/checks/uitverkocht-check.js  # uitverkocht gerecht op de menukaart
node docs/checks/aanvraag-check.js     # rollen en goedkeuring in de browser
node docs/checks/gerecht-check.js      # filteren en sorteren op gerecht
```

`voorraad-test.js` plaatst een echte bestelling en controleert of de voorraad precies met de recepten meedaalt, dat een te grote bestelling geweigerd wordt zonder af te boeken, dat leveringen en bijvullen werken, dat een gerecht uitverkocht raakt bij een tekort, dat de CSV-export klopt, dat een **uitgifte** van de keuken afboekt, dat met *automatisch afboeken* uit een bestelling niets meer afboekt (en nog wel gecontroleerd wordt), dat een uitgifte onder de drempel meteen afboekt, dat een uitgifte boven de drempel **niets** afboekt en een aanvraag wordt, dat een kok die aanvraag niet mag goedkeuren (403), dat de hoofdchef hem wel goedkeurt, dat de voorraad daarna precies met de goedgekeurde hoeveelheid daalt, dat een te grote aanvraag na goedkeuring netjes geweigerd wordt, dat afwijzen de voorraad met rust laat en dat *Beginvoorraad herstellen* alles terugzet. Uitkomst: **47 van 47 gelukt**.

`uitverkocht-check.js` zet de inktvisringen leeg en kijkt in de browser of de paella als uitverkocht verschijnt, met de juiste melding. Uitkomst: **geen problemen** op desktop en mobiel.

`aanvraag-check.js` zet de drempel laag, boekt als kok een grote uitgifte, kijkt of de goedkeurknop alleen bij de hoofdchef staat en of goedkeuren de voorraad echt afboekt, en zet daarna alles terug. Uitkomst: **kok: 0 goedkeurknoppen, 1 wachtlabel; entrecote 6400 → 5400 gram; geen problemen**.

`gerecht-check.js` kiest het gerecht *Paella Mixta* en controleert dat er dan precies de acht ingrediënten van dat recept staan, dat bij elk product *nodig: … per portie* staat, dat sorteren op gerecht de ingrediënten per gerecht op alfabetische volgorde zet, dat de keuken hetzelfde filter ziet met de volgorde van het recept, en dat er op mobiel niets buiten het scherm valt. Uitkomst: **14 van 14 gelukt, geen problemen**.

> Let op bij het schrijven van zulke controles: Playwright zoekt bij `text=` **hoofdletterongevoelig**, dus `text=Goedkeuren` matchte ook de uitleg *"…moet deze uitgiftes nog goedkeuren"*. De test zoekt daarom op de knop zelf (`getByRole("button", { name: "Goedkeuren" })`).

**Handmatige testlijst**

| # | Test | Verwachte uitkomst |
| --- | --- | --- |
| 1 | Open `/` | Homepagina met tapasfoto, tegelband en vijf werkende links (menukaart, keuken, voorraad, uitgifte, QR) |
| 2 | Open `/welkom?tafel=7` | Tafel 7 wordt getoond; knop opent de menukaart met tafel 7 |
| 3 | Voeg drie gerechten toe in `/menu` | Mandje toont aantallen en het juiste totaal in euro's |
| 4 | Verlaag een aantal tot 0 | Het gerecht verdwijnt uit het mandje |
| 5 | Bestel | Bevestigingskaart "Bestelling ontvangen!" met het tafelnummer |
| 6 | Open `/keuken` in een tweede scherm | Nieuwe bestelling verschijnt direct in de kolom *Nieuw* |
| 7 | Status op *In bereiding* en daarna *Klaar* | De kaart verhuist live naar de volgende kolom |
| 8 | Verbreek de verbinding | De badge toont "Verbinding verbroken…" |
| 9 | Maak een QR voor tafel 12 en scan hem | De welkomstpagina opent met tafel 12 |
| 10 | Test op smalle weergave (mobiel) | Alles blijft leesbaar, niets loopt buiten het scherm |
| 11 | Open `/voorraad` | Kerncijfers, 30 producten met status en het mutatielog laden |
| 12 | Boek een levering bij een product | De voorraad stijgt en de mutatie staat in het log |
| 13 | Zet een ingrediënt van de paella op 0 | De paella staat op de menukaart als *uitverkocht* en is niet te bestellen |
| 14 | Klik *Alles bijvullen tot par* | Alle producten staan weer op par-niveau en het aantal uitverkochte gerechten is 0 |
| 15 | Bestel iets en kijk op `/voorraad` | De ingrediënten zijn afgeboekt met de reden *Verbruik* en de tafel erbij |
| 16 | Download de CSV | Het bestand opent in Excel met de juiste kolommen en komma's |
| 17 | Zoek een product en klik een resultaat aan | Naam en eenheid worden overgenomen uit Open Food Facts |
| 18 | Open `/uitgifte` en klik *− 250 g* bij een product | De voorraad daalt met 250 g en de regel staat onder *Vandaag gepakt* |
| 19 | Pak met de hand 2 stuks met de notitie "voor de paella" | De mutatie heeft die notitie en is zichtbaar in het log bij de manager |
| 20 | Klik *↺* bij een regel van vandaag | De hoeveelheid staat weer op de voorraad |
| 21 | Zet *Bestellingen automatisch afboeken* uit en bestel iets | De bestelling lukt, maar er wordt niets automatisch afgeboekt |
| 22 | Kies op `/uitgifte` de rol *Kok* en pak een normale hoeveelheid (onder € 15) | De voorraad gaat er direct af, met de reden *Gepakt* |
| 23 | Pak als kok een grote hoeveelheid (bijvoorbeeld 2 kg entrecôte) | Er wordt **niets** afgeboekt; de aanvraag staat in het paneel *Wacht op goedkeuring* met het label *wacht op hoofdchef* en de kok ziet géén goedkeurknop |
| 24 | Wissel naar de rol *Hoofdchef* | De aanvraag toont nu de knoppen *Goedkeuren* en *Afwijzen* |
| 25 | Klik *Goedkeuren* | De voorraad daalt met de aangevraagde hoeveelheid en in het log staat *Gepakt* met de rol *hoofdchef* erbij |
| 26 | Vraag opnieuw iets groots aan en klik *Afwijzen* | De aanvraag verdwijnt uit de wachtrij en de voorraad verandert niet |
| 27 | Verlaag op `/voorraad` de drempel naar € 1 | Alles boven € 1 moet dan eerst goedgekeurd worden; zet hem daarna terug op 15 |
| 28 | Herlaad de pagina na het kiezen van een rol | De gekozen rol blijft staan (bewaard in de browser) |
| 29 | Kies op `/voorraad` het gerecht *Paella Mixta* | Alleen de acht ingrediënten van de paella staan er, met per product de hoeveelheid per portie |
| 30 | Kies *Alle gerechten* en sorteer *Op gerecht* | De ingrediënten van hetzelfde gerecht staan bij elkaar, op alfabetische volgorde van het gerecht |
| 31 | Open het receptenoverzicht en klik *Toon deze ingrediënten in de lijst* | Het filter springt op dat gerecht en de pagina scrolt naar de productlijst |
| 32 | Kies op `/uitgifte` het gerecht *Paella Mixta* | De kaarten staan in de volgorde van het recept, met per product wat er per portie nodig is |

---

## 13. Reflectie

**Wat goed ging**

* De hele stroom van QR-scan tot keukenscherm werkt zonder database of externe diensten.
* Door de huisstijl in één CSS-bestand te zetten, kon de nieuwe Spaanse stijl in één keer over alle pagina's worden doorgevoerd.
* Prijzen worden server-side bepaald; dat is meteen ook een veiligheidsles over "nooit de client vertrouwen".

**Waar ik tegenaan liep**

* De eerste versie was te letterlijk een affiche. Door het referentiebeeld alleen als kleurenvoorbeeld te gebruiken (en sfeer te halen uit een foto, een tegelmotief en typografie) werd het rustiger en professioneler.
* Live bijwerken zonder de pagina te verversen: opgelost met Server-Sent Events en een ping-interval om dode verbindingen op te ruimen.
* Voorraad en bestellingen kloppend houden was het lastigste deel: door de recepten eerst te controleren en pas daarna af te boeken (alles of niets) kan er nooit voorraad verdwijnen zonder dat er een bestelling tegenover staat.
* Het voorraadscherm werd op mobiel veel te lang. Opgelost met compacte productkaartjes en een inklapbare receptensectie.
* Opslag zonder account: geen enkele gratis database bleek zonder login te werken, dus werd het een JSON-bestand met een duidelijke waarschuwing als er niet geschreven kan worden.
* Twee schermen voor twee rollen leek eerst extra werk, maar door dezelfde API en dezelfde live-stroom te hergebruiken was het vooral een kwestie van andere knoppen tonen. Het nadenken over **dubbel tellen** (recepten versus wat de keuken pakt) was leerzamer dan het bouwen zelf.
* Het filteren op gerecht kostte minder werk dan gedacht, omdat de recepten al de enige bron van waarheid waren: dezelfde gegevens die de voorraad afboeken, bepalen nu ook wat een kok nodig heeft. Ik heb daar twee kleine pure functies van gemaakt in plaats van de logica in beide schermen te herhalen.
* Rollen zonder inloggen was een bewuste afweging: het systeem weet nu wie wat boekt en kan grote uitgiftes tegenhouden, maar het is geen beveiliging. Dat heb ik liever eerlijk opgeschreven dan dat het scherm de indruk geeft dat het waterdicht is.
* De goedkeuring had een valkuil: als je de voorraad bij het **aanvragen** al doorrekent, kun je een aanvraag goedkeuren die intussen niet meer kan. Daarom wordt de controle bij het **goedkeuren** opnieuw gedaan, met een nette foutmelding in plaats van een negatieve voorraad.

**Verbeterpunten / planning**

1. De in-memory store van de bestellingen vervangen door Supabase (schema staat klaar); de voorraad kan dan mee naar dezelfde database.
2. Een geannuleerde bestelling de voorraad weer laten terugboeken.
3. Realtime van Supabase gebruiken in plaats van de eigen SSE-route.
4. Beheerpagina om gerechten aan/uit te zetten en prijzen te wijzigen.
5. Eigen foto's van de gerechten toevoegen (nu staat er één algemene tapasfoto als achtergrond).
6. Een printversie van de QR-kaartjes maken, zodat ze op tafel passen.
7. Leveringen van meerdere producten in één keer invoeren als een leverbon.
8. Rollen echt beveiligen met een account en wachtwoord, zodat de rol niet in de browser te wisselen is.

---

## 14. Bronnen

* Next.js documentatie: https://nextjs.org/docs
* Tailwind CSS documentatie: https://tailwindcss.com/docs
* MDN, Server-Sent Events: https://developer.mozilla.org/docs/Web/API/Server-sent_events
* Supabase documentatie: https://supabase.com/docs
* Google Fonts, Playfair Display: https://fonts.google.com/specimen/Playfair+Display
* Google Fonts, Kaushan Script: https://fonts.google.com/specimen/Kaushan+Script
* **Foto:** "Spanish Tapas" door Toben, Wikimedia Commons, licentie CC BY-SA 4.0: https://commons.wikimedia.org/wiki/File:Spanish_Tapas.jpg
* Open Food Facts (open productendatabase zonder account of sleutel): https://world.openfoodfacts.org/data
* Referentiebeeld voor de kleuren: Spaans affiche (zwart/wit met rood-geel)
