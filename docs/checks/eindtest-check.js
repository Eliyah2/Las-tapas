// Eindtest van het volledige proces (US3 van het examenportfolio):
// bestellen op de iPad → verwerking in de keuken → totaalbedrag per tafel → betaling.
//
// Gebruik (met de dev-server aan):
//   node docs/checks/eindtest-check.js            # tegen http://localhost:3000
//   node docs/checks/eindtest-check.js http://localhost:61768
//
// Het script plaatst echte testbestellingen en rekent een testtafel volledig af.
// Daarna wordt de testtafel niet automatisch leeggemaakt; run de server opnieuw
// of gebruik een tafelnummer dat je verder niet gebruikt.

const BASIS = process.argv[2] ?? "http://localhost:3000";
const TAFEL = "TEST-" + Math.floor(Math.random() * 100000);

// Wat het totaal moet worden als beide bestellingen geaccepteerd worden.
// De server rekent dit zelf uit; hier staat alleen wat wij verwachten.
const VERWACHT_TOTAAL = 2 * 6.5 + 18.5 + 9.0; // € 40,50

let gelukt = 0;
let mislukt = 0;

function check(naam, voorwaarde, extra = "") {
  if (voorwaarde) {
    gelukt++;
    console.log(`  ✓ ${naam}${extra ? ` — ${extra}` : ""}`);
  } else {
    mislukt++;
    console.log(`  ✗ ${naam}${extra ? ` — ${extra}` : ""}`);
  }
}

async function json(path, opties = {}) {
  const res = await fetch(`${BASIS}${path}`, {
    ...opties,
    headers: { "Content-Type": "application/json", ...(opties.headers ?? {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // antwoord was geen JSON (bijv. HTML-foutpagina)
  }
  return { status: res.status, body };
}

console.log(`\nEindtest volledige proces — tafel ${TAFEL} op ${BASIS}\n`);

// Stap 0: beginvoorraad terugzetten, zodat de test elke keer opnieuw
// hetzelfde resultaat geeft (reproduceerbaar, ook na eerdere testruns).
console.log("0. Beginvoorraad terugzetten (reproduceerbaarheid)");
const reset = await json("/api/voorraad/reset", { method: "POST" });
check("Voorraad teruggezet naar beginstand", reset.status === 200);

// Stap 1: gast bestelt op de iPad (menu → POST /api/orders)
console.log("1. Bestellen (iPad-flow)");
const order1 = await json("/api/orders", {
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
  "Bestelling 1 geaccepteerd (2× bravas €13,00 + paella €18,50)",
  order1.status === 201 && order1.body?.order?.id,
  `voorraadmutaties: ${order1.body?.voorraadMutaties}`
);

const order2 = await json("/api/orders", {
  method: "POST",
  body: JSON.stringify({
    table: TAFEL,
    items: [{ id: "gambas-al-ajillo", quantity: 1 }],
  }),
});
check(
  "Bestelling 2 geaccepteerd (1× gambas €9,00)",
  order2.status === 201,
  order2.status === 201 ? "" : order2.body?.error
);

// Stap 2: keuken verwerkt de bestelling (PATCH /api/orders/[id]/status)
console.log("2. Keuken-flow (status aanpassen)");
const eersteId = order1.body.order.id;
const naarBereiden = await json(`/api/orders/${eersteId}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "bereiden" }),
});
check("Status → in bereiding", naarBereiden.body?.order?.status === "bereiden");

const naarKlaar = await json(`/api/orders/${eersteId}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "klaar" }),
});
check("Status → gereed voor uitserveren", naarKlaar.body?.order?.status === "klaar");

const ongeldig = await json(`/api/orders/${eersteId}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "opgegeten" }),
});
check("Ongeldige status geweigerd (400)", ongeldig.status === 400);

// Stap 3: totaalbedrag per tafel (POST /api/betalen, server-side berekend)
console.log("3. Rekening per tafel");
const rekening = await json("/api/betalen", {
  method: "POST",
  body: JSON.stringify({ table: TAFEL }),
});
const sessie = rekening.body?.sessie;
check(
  `Rekening gestart met totaal € ${VERWACHT_TOTAAL.toFixed(2).replace(".", ",")}`,
  rekening.status === 201 && sessie?.bedrag === VERWACHT_TOTAAL,
  `server berekende: € ${sessie?.bedrag ?? "onbekend"}`
);

const onbekend = await json("/api/betalen", {
  method: "POST",
  body: JSON.stringify({ table: "BESTAAT-NIET-999" }),
});
check("Onbekende tafel geweigerd (404)", onbekend.status === 404);

// Stap 4: betaling (PATCH /api/betalen/[id])
console.log("4. Betaling");
const geweigerd = await json(`/api/betalen/${sessie.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    kaart: { nummer: "4000000000000002", houder: "Test Gast", vervalt: "12/29", cvc: "123" },
  }),
});
check("Geweigerde testkaart afgewezen", geweigerd.status === 400, geweigerd.body?.error);

const misvormd = await json(`/api/betalen/${sessie.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    kaart: { nummer: "12345", houder: "Test Gast", vervalt: "12/29", cvc: "123" },
  }),
});
check("Ongeldig kaartnummer afgewezen", misvormd.status === 400);

const betaald = await json(`/api/betalen/${sessie.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    kaart: { nummer: "4242 4242 4242 4242", houder: "Test Gast", vervalt: "12/29", cvc: "123" },
  }),
});
check(
  "Betaling geslaagd, sessie op betaald",
  betaald.status === 200 && betaald.body?.sessie?.status === "betaald",
  `betaald om ${new Date(betaald.body?.sessie?.betaaldOp ?? 0).toLocaleTimeString("nl-NL")}`
);
check(
  "Alleen de laatste vier cijfers worden bewaard",
  betaald.body?.sessie?.laatsteVier === "4242"
);

const dubbel = await json(`/api/betalen/${sessie.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    kaart: { nummer: "4242424242424242", houder: "Test Gast", vervalt: "12/29", cvc: "123" },
  }),
});
check("Dubbel betalen geblokkeerd (409)", dubbel.status === 409, dubbel.body?.error);

// Samenvatting
console.log(`\nUitkomst: ${gelukt} van ${gelukt + mislukt} controles gelukt`);
process.exit(mislukt === 0 ? 0 : 1);
