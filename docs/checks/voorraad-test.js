/**
 * Controle van het voorraadsysteem via de API.
 *
 * Gebruik: eerst `npm run dev` starten, daarna
 *   node docs/checks/voorraad-test.js
 *
 * Het script plaatst een bestelling, kijkt of de voorraad precies met de
 * recepten meedaalt, test een te grote bestelling, boekt een levering, vult
 * alles tot par-niveau bij en herstelt daarna de beginvoorraad.
 */

const BASIS = "http://localhost:3000";

let gelukt = 0;
let mislukt = 0;

function check(naam, voorwaarde, uitleg = "") {
  if (voorwaarde) {
    gelukt += 1;
    console.log(`  ok    ${naam}`);
  } else {
    mislukt += 1;
    console.log(`  FOUT  ${naam}${uitleg ? ` (${uitleg})` : ""}`);
  }
}

async function api(pad, opties) {
  const antwoord = await fetch(`${BASIS}${pad}`, opties);
  const tekst = await antwoord.text();
  let data = null;
  try {
    data = JSON.parse(tekst);
  } catch {
    data = tekst;
  }
  return { status: antwoord.status, data, headers: antwoord.headers };
}

function voorraadVan(overzicht, id) {
  return overzicht.producten.find((p) => p.id === id)?.stock;
}

(async () => {
  console.log("1. Voorraad ophalen");
  const eerste = await api("/api/voorraad");
  check("overzicht komt binnen", eerste.status === 200);
  const start = eerste.data;
  check("producten aanwezig", Array.isArray(start.producten) && start.producten.length > 20, `${start.producten?.length} producten`);
  check("recepten aanwezig", Object.keys(start.status ?? {}).length === 13, `${Object.keys(start.status ?? {}).length} gerechten`);
  check("voorraad wordt bewaard in een bestand", start.persistent === true);

  const patatasVoor = voorraadVan(start, "patatas");
  const gambasVoor = voorraadVan(start, "gambas");

  console.log("\n2. Bestelling plaatsen (2x patatas bravas, 1x gambas)");
  const bestelling = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table: "99",
      items: [
        { id: "patatas-bravas", quantity: 2 },
        { id: "gambas-al-ajillo", quantity: 1 },
      ],
    }),
  });
  check("bestelling geaccepteerd", bestelling.status === 201, `status ${bestelling.status}`);

  const naBestelling = (await api("/api/voorraad")).data;
  check(
    "aardappelen 500 g afgeboekt (2 porties x 250 g)",
    voorraadVan(naBestelling, "patatas") === patatasVoor - 500,
    `${patatasVoor} -> ${voorraadVan(naBestelling, "patatas")}`
  );
  check(
    "garnalen 180 g afgeboekt",
    voorraadVan(naBestelling, "gambas") === gambasVoor - 180,
    `${gambasVoor} -> ${voorraadVan(naBestelling, "gambas")}`
  );
  check(
    "mutaties met reden 'verbruik' geboekt",
    naBestelling.mutaties.some(
      (m) => m.reason === "verbruik" && m.note?.includes("tafel 99")
    )
  );

  console.log("\n3. Te grote bestelling wordt geweigerd");
  const teVeel = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table: "99",
      items: [{ id: "paella-mixta", quantity: 20 }],
    }),
  });
  check("bestelling geweigerd met 409", teVeel.status === 409, `status ${teVeel.status}`);
  check(
    "tekorten worden meegestuurd",
    Array.isArray(teVeel.data.tekorten) && teVeel.data.tekorten.length > 0
  );

  const naWeigering = (await api("/api/voorraad")).data;
  check(
    "geen voorraad afgeboekt bij een geweigerde bestelling",
    voorraadVan(naWeigering, "patatas") === patatasVoor - 500
  );

  console.log("\n4. Levering boeken en bijvullen");
  const levering = await api("/api/voorraad/gambas", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta: 1500, reason: "levering", note: "Testlevering" }),
  });
  check("levering geboekt", levering.status === 200, `status ${levering.status}`);

  const naLevering = (await api("/api/voorraad")).data;
  check(
    "garnalen weer op peil",
    voorraadVan(naLevering, "gambas") === gambasVoor - 180 + 1500
  );

  const bijvullen = await api("/api/voorraad/bijvullen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  check("bijvullen uitgevoerd", bijvullen.status === 200, `status ${bijvullen.status}`);

  const naBijvullen = (await api("/api/voorraad")).data;
  check(
    "niets meer onder par-niveau",
    naBijvullen.samenvatting.onderPar === 0,
    `${naBijvullen.samenvatting.onderPar} producten`
  );
  check(
    "geen uitverkochte gerechten meer",
    naBijvullen.samenvatting.uitverkochteGerechten === 0
  );

  console.log("\n5. Nieuwe voorraad maakt gerechten weer beschikbaar");
  await api("/api/voorraad/calamares", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ naar: 10, reason: "correctie" }),
  });
  const metTekort = (await api("/api/voorraad")).data;
  check(
    "paella is uitverkocht bij te weinig inktvis",
    metTekort.status["paella-mixta"].maakbaar === false
  );
  check(
    "menukaart krijgt de beschikbaarheid door",
    (await api("/api/voorraad/beschikbaar")).data.status["paella-mixta"]
      .maakbaar === false
  );

  console.log("\n6. Export en producten toevoegen");
  const csv = await api("/api/voorraad/export");
  check("CSV-export werkt", csv.status === 200 && String(csv.data).includes("Product;Eenheid"));
  check(
    "CSV heeft een bestandsnaam",
    String(csv.headers.get("content-disposition") ?? "").includes("voorraad-las-tapas")
  );

  const nieuw = await api("/api/voorraad", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Testproduct",
      unit: "stuk",
      stock: 5,
      parLevel: 10,
      costPerUnit: 1.5,
      supplier: "Testleverancier",
    }),
  });
  check("nieuw product toegevoegd", nieuw.status === 201, `status ${nieuw.status}`);

  const verwijderd = await api(`/api/voorraad/${nieuw.data.product.id}`, {
    method: "DELETE",
  });
  check("nieuw product weer verwijderd", verwijderd.status === 200);

  console.log("\n7. Uitgifte door de keuken");
  const voorUitgifte = (await api("/api/voorraad")).data;
  const patatasVoorUitgifte = voorraadVan(voorUitgifte, "patatas");

  const uitgifte = await api("/api/voorraad/patatas", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta: -500, reason: "uitgifte", note: "Test pakken" }),
  });
  check("uitgifte geboekt", uitgifte.status === 200, `status ${uitgifte.status}`);

  const naUitgifte = (await api("/api/voorraad")).data;
  check(
    "voorraad 500 g gedaald door de uitgifte",
    voorraadVan(naUitgifte, "patatas") === patatasVoorUitgifte - 500,
    `${patatasVoorUitgifte} -> ${voorraadVan(naUitgifte, "patatas")}`
  );
  check(
    "mutatie met reden 'uitgifte' en de notitie erbij",
    naUitgifte.mutaties.some(
      (m) => m.reason === "uitgifte" && m.note === "Test pakken"
    )
  );

  console.log("\n8. Automatisch afboeken uit- en aanzetten");
  const uitgezet = await api("/api/voorraad/instellingen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ automatischAfboeken: false }),
  });
  check(
    "automatisch afboeken uitgezet",
    uitgezet.status === 200 && uitgezet.data.automatischAfboeken === false
  );

  const patatasVoorBestelling2 = voorraadVan(
    (await api("/api/voorraad")).data,
    "patatas"
  );
  const bestelling2 = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table: "98",
      items: [{ id: "patatas-bravas", quantity: 1 }],
    }),
  });
  check(
    "bestelling nog steeds gecontroleerd en geaccepteerd",
    bestelling2.status === 201,
    `status ${bestelling2.status}`
  );
  check(
    "geen automatische afboeking meer bij die bestelling",
    voorraadVan((await api("/api/voorraad")).data, "patatas") ===
      patatasVoorBestelling2
  );

  await api("/api/voorraad/instellingen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ automatischAfboeken: true }),
  });
  check(
    "automatisch afboeken weer aangezet",
    (await api("/api/voorraad")).data.automatischAfboeken === true
  );

  console.log("\n9. Rollen en goedkeuring van grote uitgiftes");
  const drempelAan = await api("/api/voorraad/instellingen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goedkeuringsdrempel: 5 }),
  });
  check(
    "goedkeuringsdrempel ingesteld op 5 euro",
    drempelAan.status === 200 && drempelAan.data.goedkeuringsdrempel === 5
  );

  const klein = await api("/api/voorraad/uitgifte", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: "patatas",
      amount: 250,
      door: "kok",
      note: "klein testje",
    }),
  });
  check(
    "kleine uitgifte gaat direct van de voorraad af",
    klein.status === 201 && klein.data.soort === "direct",
    `status ${klein.status}`
  );

  const entrecoteVoor = voorraadVan((await api("/api/voorraad")).data, "entrecote");
  const groot = await api("/api/voorraad/uitgifte", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: "entrecote",
      amount: 2000,
      door: "kok",
      note: "groot feest",
    }),
  });
  check(
    "grote uitgifte wordt een aanvraag",
    groot.status === 202 && groot.data.soort === "aanvraag",
    `status ${groot.status}`
  );

  const naGroot = (await api("/api/voorraad")).data;
  check(
    "voorraad nog niet afgeboekt bij een aanvraag",
    voorraadVan(naGroot, "entrecote") === entrecoteVoor
  );
  check(
    "aanvraag staat open met de vrager erbij",
    naGroot.aanvragen.some(
      (a) => a.status === "open" && a.aangevraagdDoor === "kok"
    )
  );

  const kokKeurt = await api(`/api/voorraad/aanvragen/${groot.data.aanvraag.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actie: "goedkeuren", door: "kok" }),
  });
  check("een kok mag niet goedkeuren (403)", kokKeurt.status === 403);

  const goedkeuring = await api(`/api/voorraad/aanvragen/${groot.data.aanvraag.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actie: "goedkeuren", door: "hoofdchef" }),
  });
  check("de hoofdchef keurt goed", goedkeuring.status === 200, `status ${goedkeuring.status}`);

  const naGoedkeuring = (await api("/api/voorraad")).data;
  check(
    "voorraad nu wel afgeboekt",
    voorraadVan(naGoedkeuring, "entrecote") === entrecoteVoor - 2000
  );
  check(
    "mutatie met reden uitgifte, rol en herkomst",
    naGoedkeuring.mutaties.some(
      (m) =>
        m.reason === "uitgifte" &&
        m.door === "hoofdchef" &&
        (m.note ?? "").includes("aangevraagd door de kok")
    )
  );

  const tweede = await api("/api/voorraad/uitgifte", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: "entrecote", amount: 1500, door: "kok" }),
  });
  const entrecoteVoorAfwijzen = voorraadVan(
    (await api("/api/voorraad")).data,
    "entrecote"
  );
  const afwijzing = await api(`/api/voorraad/aanvragen/${tweede.data.aanvraag.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actie: "afwijzen",
      door: "hoofdchef",
      reden: "Te duur vandaag",
    }),
  });
  check("de hoofdchef wijst af", afwijzing.status === 200);

  const naAfwijzing = (await api("/api/voorraad")).data;
  check(
    "voorraad blijft gelijk na afwijzen",
    voorraadVan(naAfwijzing, "entrecote") === entrecoteVoorAfwijzen
  );
  check(
    "afwijzing bewaard met reden",
    naAfwijzing.aanvragen.some(
      (a) => a.status === "afgewezen" && a.reden === "Te duur vandaag"
    )
  );

  const teVeelPakken = await api("/api/voorraad/uitgifte", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: "entrecote", amount: 99999, door: "kok" }),
  });
  check(
    "meer pakken dan er is wordt geweigerd",
    teVeelPakken.status === 400,
    `status ${teVeelPakken.status}`
  );

  await api("/api/voorraad/instellingen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goedkeuringsdrempel: 15 }),
  });
  check(
    "drempel weer terug op 15 euro",
    (await api("/api/voorraad")).data.goedkeuringsdrempel === 15
  );

  console.log("\n10. Beginvoorraad herstellen");
  const herstel = await api("/api/voorraad/reset", { method: "POST" });
  check("reset uitgevoerd", herstel.status === 200);

  const einde = (await api("/api/voorraad")).data;
  check(
    "aardappelen weer op de beginwaarde",
    voorraadVan(einde, "patatas") === patatasVoor,
    `${voorraadVan(einde, "patatas")}`
  );
  check("geen testproducten achtergebleven", !einde.producten.some((p) => p.id === "testproduct"));
  check(
    "aanvragen opgeruimd na het herstellen",
    einde.aanvragen.filter((a) => a.status === "open").length === 0
  );

  console.log(`\nResultaat: ${gelukt} gelukt, ${mislukt} mislukt`);
  // exitCode in plaats van process.exit(), anders sluit Node op Windows
  // af met een libuv-melding terwijl de testscripts al klaar zijn.
  process.exitCode = mislukt > 0 ? 1 : 0;
})();
