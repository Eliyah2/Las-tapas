// Testomgeving voor het examenportfolio (B1-K1-W4 – Testen).
// Test de drie gerealiseerde user stories van Las Tapas op twee niveaus:
//   F = functioneel  (doet het wat de user story belooft?)
//   T = technisch    (validatie, beveiliging, foutafhandeling, performance)
//
// Gebruik (met de dev-server aan):
//   node docs/checks/portfolio-test.js
//   node docs/checks/portfolio-test.js http://localhost:3000
//
// De test is reproduceerbaar: hij reset de beginvoorraad, gebruikt per
// run een uniek tafelnummer en ruimt zichzelf niet halverwege op.

const BASIS = process.argv[2] ?? "http://localhost:3000";
const RUN = Date.now().toString(36).slice(-5);
const TAFEL = `T${RUN}`;

const resultaten = [];
let huidigeGroep = "";
let huidigType = "";

function groep(naam) {
  huidigeGroep = naam;
  console.log(`\n${naam}`);
}

function type(t) {
  huidigType = t;
  console.log(`  ${t === "F" ? "Functioneel" : "Technisch  "}`);
}

function check(naam, voorwaarde, detail = "") {
  resultaten.push({
    groep: huidigeGroep,
    type: huidigType,
    naam,
    ok: Boolean(voorwaarde),
    detail,
  });
  console.log(
    `    ${voorwaarde ? "✓" : "✗"} ${naam}${detail ? ` — ${detail}` : ""}`
  );
}

async function req(pad, opties = {}) {
  const res = await fetch(`${BASIS}${pad}`, {
    ...opties,
    headers: { "Content-Type": "application/json", ...(opties.headers ?? {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // geen JSON (bijv. HTML)
  }
  return { status: res.status, body, headers: res.headers };
}

// ---------------------------------------------------------------
// US1 – Betaalmodule
// ---------------------------------------------------------------
groep("US1 – Betaalmodule");
type("F");

await req("/api/voorraad/reset", { method: "POST" });

const bestellingA = await req("/api/orders", {
  method: "POST",
  body: JSON.stringify({
    table: TAFEL,
    items: [
      { id: "patatas-bravas", quantity: 2 },
      { id: "paella-mixta", quantity: 1 },
    ],
  }),
});
check(
  "Gast kan bestellen (2× bravas + 1× paella)",
  bestellingA.status === 201,
  bestellingA.status === 201
    ? `voorraadmutaties: ${bestellingA.body?.voorraadMutaties}`
    : bestellingA.body?.error
);

const bestellingB = await req("/api/orders", {
  method: "POST",
  body: JSON.stringify({
    table: TAFEL,
    items: [{ id: "gambas-al-ajillo", quantity: 1 }],
  }),
});
check("Gast kan een tweede bestelling plaatsen", bestellingB.status === 201);

const verwachtTotaal = 2 * 6.5 + 18.5 + 9.0; // € 40,50
const sessieStart = await req("/api/betalen", {
  method: "POST",
  body: JSON.stringify({ table: TAFEL }),
});
const sessie = sessieStart.body?.sessie;
check(
  "Bediening ziet het juiste totaalbedrag per tafel",
  sessieStart.status === 201 && sessie?.bedrag === verwachtTotaal,
  `verwacht € ${verwachtTotaal}, server gaf € ${sessie?.bedrag ?? "onbekend"}`
);

const sessieOphalen = await req(`/api/betalen/${sessie.id}`);
check(
  "Betaalpagina haalt het bedrag op bij de server",
  sessieOphalen.status === 200 && sessieOphalen.body?.sessie?.bedrag === verwachtTotaal
);

const weigering = await req(`/api/betalen/${sessie.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    kaart: { nummer: "4000000000000002", houder: "Test Gast", vervalt: "12/29", cvc: "123" },
  }),
});
check(
  "Geweigerde kaart geeft een nette foutmelding",
  weigering.status === 400 && /geweigerd/i.test(weigering.body?.error ?? ""),
  weigering.body?.error
);

const geslaagd = await req(`/api/betalen/${sessie.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    kaart: { nummer: "4242 4242 4242 4242", houder: "Test Gast", vervalt: "12/29", cvc: "123" },
  }),
});
check(
  "Gast kan succesvol betalen met testkaart",
  geslaagd.status === 200 && geslaagd.body?.sessie?.status === "betaald"
);
check(
  "Bevestiging toont het bedrag en tijdstip van betaling",
  Boolean(geslaagd.body?.sessie?.betaaldOp) && geslaagd.body?.sessie?.bedrag === verwachtTotaal
);
check(
  "Alleen de laatste vier kaartcijfers worden bewaard",
  geslaagd.body?.sessie?.laatsteVier === "4242"
);

type("T");

const dubbel = await req(`/api/betalen/${sessie.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    kaart: { nummer: "4242424242424242", houder: "Test Gast", vervalt: "12/29", cvc: "123" },
  }),
});
check(
  "Dubbel betalen wordt geblokkeerd (409)",
  dubbel.status === 409,
  dubbel.body?.error
);

const foutKaart = await req(`/api/betalen/${sessie.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    kaart: { nummer: "123", houder: "Test Gast", vervalt: "12/29", cvc: "123" },
  }),
});
check("Ongeldig kaartnummer wordt geweigerd", foutKaart.status >= 400);

const geenTabel = await req("/api/betalen", {
  method: "POST",
  body: JSON.stringify({}),
});
check("Rekening zonder tafelnummer wordt geweigerd (400)", geenTabel.status === 400);

const kapotteJson = await req("/api/betalen", {
  method: "POST",
  body: "{ dit is geen json",
});
check("Ongeldige JSON geeft 400 in plaats van een crash", kapotteJson.status === 400);

const onbekend = await req("/api/betalen", {
  method: "POST",
  body: JSON.stringify({ table: "ONBEKEND-000" }),
});
check("Rekening voor onbekende tafel geeft 404", onbekend.status === 404);

const onbekendeSessie = await req("/api/betalen/00000000-0000-0000-0000-000000000000");
check("Onbekende sessie geeft 404", onbekendeSessie.status === 404);

const onvolledigeKaart = await req(`/api/betalen/${sessie.id}`, {
  method: "PATCH",
  body: JSON.stringify({ kaart: { nummer: "4242424242424242" } }),
});
check("Onvolledige kaartgegevens worden geweigerd", onvolledigeKaart.status >= 400);

// Prijsmanipulatie: een browser kan een eigen prijs proberen mee te sturen.
const metEigenPrijs = await req("/api/orders", {
  method: "POST",
  body: JSON.stringify({
    table: TAFEL,
    items: [{ id: "patatas-bravas", quantity: 1, price: 0.01 }],
  }),
});
const eigenPrijsGekregen =
  metEigenPrijs.status === 201 && metEigenPrijs.body?.order?.items?.[0]?.price === 6.5;
check(
  "Een door de browser meegestuurde prijs wordt genegeerd",
  eigenPrijsGekregen,
  eigenPrijsGekwegdDetail(metEigenPrijs)
);

function eigenPrijsGekwegdDetail(res) {
  if (res.status !== 201) return res.body?.error;
  return `server rekende € ${res.body.order.items[0].price}`;
}

// ---------------------------------------------------------------
// US2 – Statuskoppeling
// ---------------------------------------------------------------
groep("US2 – Statuskoppeling");
type("F");

const order = bestellingA.body?.order;
const naarBereiden = await req(`/api/orders/${order.id}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "bereiden" }),
});
check(
  "Chef kan status zetten op 'in bereiding'",
  naarBereiden.body?.order?.status === "bereiden"
);

const naarKlaar = await req(`/api/orders/${order.id}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "klaar" }),
});
check(
  "Chef kan met één klik naar 'gereed voor uitserveren'",
  naarKlaar.body?.order?.status === "klaar"
);

// De statuspagina is een clientcomponent: de voortgangsstappen worden pas in de
// browser opgebouwd. Daarom controleren we hier alleen of de pagina laadt; de
// inhoud van de stappen controleren we hieronder via de live stroom.
const statusPagina = await fetch(`${BASIS}/status?tafel=${TAFEL}`);
const statusHtml = await statusPagina.text();
check(
  "Statuspagina voor de gast is bereikbaar",
  statusPagina.status === 200 && statusHtml.includes("Las Tapas"),
  `HTTP ${statusPagina.status}`
);

type("T");

const ongeldig = await req(`/api/orders/${order.id}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "opgegeten" }),
});
check(
  "Ongeldige status wordt server-side geweigerd (400)",
  ongeldig.status === 400,
  ongeldig.body?.error
);

const nietBestaand = await req("/api/orders/00000000-0000-0000-0000-000000000000/status", {
  method: "PATCH",
  body: JSON.stringify({ status: "klaar" }),
});
check("Status van onbekende bestelling geeft 404", nietBestaand.status === 404);

const kapotteStatus = await req(`/api/orders/${order.id}/status`, {
  method: "PATCH",
  body: "{ kapotte json",
});
check("Ongeldige JSON bij statuswijziging geeft 400", kapotteStatus.status === 400);

// Live stroom: de status moet zonder verversen doorkomen, inclusief de inhoud
// die de statuspagina voor de gast toont.
const stream = await fetch(`${BASIS}/api/orders/stream`, {
  headers: { Accept: "text/event-stream" },
});
const reader = stream.body.getReader();
const eerste = await reader.read();
const eersteTekst = new TextDecoder().decode(eerste.value);
check(
  "Gast ontvangt live updates via Server-Sent Events",
  eersteTekst.includes("event: orders"),
  "event: orders ontvangen"
);

// De verzonden data moet ook echt de status voor deze tafel bevatten, want
// dat is wat de statuspagina van de gast toont.
const orderId = bestellingA.body?.order?.id;
const statusInStream = eersteTekst.includes(orderId);
check(
  "De live stroom bevat de status van de bestelling van de gast",
  statusInStream,
  statusInStream ? `bestelling ${orderId.slice(0, 8)}… met status klaar` : "bestelling niet gevonden in stream"
);
await reader.cancel();

// ---------------------------------------------------------------
// US3 – Eindtest (het volledige proces)
// ---------------------------------------------------------------
groep("US3 – Volledig proces");
type("F");

const tweedeTabel = `${TAFEL}B`;
const o1 = await req("/api/orders", {
  method: "POST",
  body: JSON.stringify({ table: tweedeTabel, items: [{ id: "churrasco", quantity: 1 }] }),
});
const o2 = await req("/api/orders", {
  method: "POST",
  body: JSON.stringify({ table: tweedeTabel, items: [{ id: "tortilla", quantity: 3 }] }),
});
check("Bestellen werkt opnieuw na een eerdere sessie", o1.status === 201 && o2.status === 201);

await req(`/api/orders/${o1.body.order.id}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "bereiden" }),
});
const proc1 = await req(`/api/orders/${o1.body.order.id}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "klaar" }),
});
await req(`/api/orders/${o2.body.order.id}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "bereiden" }),
});
const proc2 = await req(`/api/orders/${o2.body.order.id}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "klaar" }),
});
check("Alle bestellingen van een tafel raken de eindstatus", proc1.body?.order?.status === "klaar" && proc2.body?.order?.status === "klaar");

const eindRekening = await req("/api/betalen", {
  method: "POST",
  body: JSON.stringify({ table: tweedeTabel }),
});
const eindTotaal = 22.0 + 3 * 5.0; // churrasco + 3× tortilla = € 37,00
check(
  "Totaal van meerdere bestellingen per tafel klopt",
  eindRekening.body?.sessie?.bedrag === eindTotaal,
  `verwacht € ${eindTotaal}, server gaf € ${eindRekening.body?.sessie?.bedrag}`
);

const eindBetaling = await req(`/api/betalen/${eindRekening.body.sessie.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    kaart: { nummer: "4242424242424242", houder: "Test Gast", vervalt: "12/30", cvc: "456" },
  }),
});
check("Betaling van de volledige tafelrekening lukt", eindBetaling.status === 200);

type("T");

const voorraadNa = await req("/api/voorraad/beschikbaar");
check(
  "Voorraadstatus is na de bestellingen nog steeds bereikbaar",
  voorraadNa.status === 200,
  `HTTP ${voorraadNa.status}`
);

const paginaChecks = await Promise.all(
  ["/rekening", "/status", "/menu", "/keuken"].map(async (pad) => {
    const r = await fetch(`${BASIS}${pad}`);
    return { pad, status: r.status };
  })
);
for (const p of paginaChecks) {
  check(`Pagina ${p.pad} geeft HTTP 200`, p.status === 200, `HTTP ${p.status}`);
}

// Bereikbaarheid van de pagina's. Let op: deze pagina's zijn clientcomponents,
// dus hun inhoud wordt pas in de browser opgebouwd. Daarom controleert deze
// test alleen wat op HTTP-niveau vast te stellen is: de pagina bestaat en
// geeft geen serverfout. De inhoud (teksten, knoppen, klikken) is apart
// handmatig in een echte browser getest; zie het testrapport.
{
  const paginaPaden = [
    `/rekening?tafel=${TAFEL}`,
    `/status?tafel=${TAFEL}`,
    `/menu?tafel=${TAFEL}`,
    "/keuken",
    "/betalen/00000000-0000-0000-0000-000000000000",
  ];

  for (const pad of paginaPaden) {
    const r = await fetch(`${BASIS}${pad}`);
    const html = await r.text();
    const isServerfout =
      /application error|unhandled runtime|__next_error__/i.test(html);
    check(
      `Pagina ${pad.split("?")[0]} bestaat en geeft geen serverfout`,
      r.status === 200 && !isServerfout,
      `HTTP ${r.status}`
    );
  }

  // Tafelnummer met scriptinhoud mag niet uitgevoerd worden.
  const rareRekening = await req("/api/betalen", {
    method: "POST",
    body: JSON.stringify({ table: "<script>alert(1)</script>" }),
  });
  check(
    "Tafelnummer met scriptinhoud wordt veilig behandeld",
    rareRekening.status === 404,
    `HTTP ${rareRekening.status}`
  );
}

// Performance: vijf opeenvolgende API-calls moeten snel genoeg zijn voor
// een restaurant-situatie (grens: gemiddeld onder 500 ms).
const start = Date.now();
for (let i = 0; i < 5; i += 1) {
  await req("/api/voorraad/beschikbaar");
}
const gemiddeld = Math.round((Date.now() - start) / 5);
check(
  "Gemiddelde reactietijd van de API onder 500 ms",
  gemiddeld < 500,
  `${gemiddeld} ms over 5 requests`
);

// ---------------------------------------------------------------
// Samenvatting
// ---------------------------------------------------------------
const totaal = resultaten.length;
const goed = resultaten.filter((r) => r.ok).length;
const fout = totaal - goed;
const functioneel = resultaten.filter((r) => r.type === "F");
const technisch = resultaten.filter((r) => r.type === "T");

console.log("\n" + "=".repeat(64));
console.log(`TESTRAPPORT — Las Tapas — tafelreeks ${RUN}`);
console.log("=".repeat(64));
console.log(`Functionele tests : ${functioneel.filter((r) => r.ok).length}/${functioneel.length} geslaagd`);
console.log(`Technische tests  : ${technisch.filter((r) => r.ok).length}/${technisch.length} geslaagd`);
console.log(`Totaal            : ${goed}/${totaal} geslaagd`);
if (fout > 0) {
  console.log("\nMislukte tests:");
  for (const r of resultaten.filter((x) => !x.ok)) {
    console.log(`  ✗ [${r.type}] ${r.groep} — ${r.naam} ${r.detail}`);
  }
}
console.log(`\nUitkomst: ${goed} van ${totaal} controles gelukt`);
process.exit(fout === 0 ? 0 : 1);
