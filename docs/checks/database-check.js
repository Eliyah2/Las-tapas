/**
 * Controle dat de app echt met de Supabase-database werkt.
 *
 * Loopt het hele proces door: bestelling plaatsen (en de recepten afboeken),
 * afrekenen met een geweigerde en een goede kaart, een uitgifte boven de
 * drempel aanvragen en goedkeuren. Daarna wordt alle testdata weer opgeruimd en
 * staat de voorraad terug op de beginwaarde.
 *
 * Gebruik: eerst de server aanzetten, daarna
 *   node docs/checks/database-check.js
 * Draait de server op een andere poort, geef die dan mee:
 *   BASIS=http://localhost:3100 node docs/checks/database-check.js
 *
 * Let op: dit script praat ook rechtstreeks met Supabase (met de sleutel uit
 * .env.local) om te controleren of de rijen er echt staan en om op te ruimen.
 */

const fs = require("fs");
const path = require("path");

const BASIS = process.env.BASIS || "http://localhost:3000";

// --- Omgevingsvariabelen lezen (zelfde als lib/supabase.ts) -------------------

function leesEnv() {
  const bestand = path.join(process.cwd(), ".env.local");
  const vars = {};
  let inhoud = "";
  try {
    inhoud = fs.readFileSync(bestand, "utf8");
  } catch {
    console.error("Geen .env.local gevonden. Zet eerst de Supabase-variabelen.");
    process.exit(1);
  }
  for (const regel of inhoud.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/.exec(regel);
    if (m && !regel.trim().startsWith("#")) {
      vars[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  const url = vars.SUPABASE_URL || vars.NEXT_PUBLIC_SUPABASE_URL;
  const sleutel = vars.SUPABASE_SECRET_KEY || vars.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !sleutel) {
    console.error("SUPABASE_URL of de secret key ontbreekt in .env.local.");
    process.exit(1);
  }
  return { url, sleutel };
}

const { url: SUPA_URL, sleutel: SUPA_KEY } = leesEnv();
const kop = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

let fouten = 0;
function check(naam, gelukt, extra = "") {
  if (!gelukt) fouten += 1;
  console.log(
    (gelukt ? "  OK   " : "  FOUT ") + naam + (extra ? ` — ${extra}` : "")
  );
}

async function api(pad, methode = "GET", body) {
  const antwoord = await fetch(`${BASIS}${pad}`, {
    method: methode,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const tekst = await antwoord.text();
  let json = null;
  try {
    json = JSON.parse(tekst);
  } catch {
    // Geen JSON (bijvoorbeeld de CSV-export).
  }
  return { status: antwoord.status, body: json, tekst };
}

/** Rechtstreeks bij Supabase, om te zien of de rij er echt staat. */
async function rest(pad, opties = {}) {
  const antwoord = await fetch(`${SUPA_URL}/rest/v1/${pad}`, {
    method: opties.method || "GET",
    headers: { ...kop, ...(opties.headers || {}) },
    body: opties.body,
  });
  const tekst = await antwoord.text();
  let json = null;
  try {
    json = JSON.parse(tekst);
  } catch {
    // Leeg of geen JSON.
  }
  return { status: antwoord.status, body: json, tekst };
}

async function aantalRijen(tabel) {
  const antwoord = await rest(`${tabel}?select=id`);
  return Array.isArray(antwoord.body) ? antwoord.body.length : -1;
}

(async () => {
  let snapshot = null;
  let orderId = null;
  let sessieId = null;
  let aanvraagId = null;

  try {
    console.log("=== 0. uitgangssituatie ===");
    const voor = await api("/api/voorraad");
    check(
      "GET /api/voorraad geeft 200",
      voor.status === 200,
      `status ${voor.status} ${voor.tekst.slice(0, 120)}`
    );
    if (!voor.body || !voor.body.producten) {
      throw new Error(`geen voorraadresponse: ${voor.tekst.slice(0, 200)}`);
    }

    const overzicht = voor.body;
    check("30 producten uit de database", overzicht.producten.length === 30);
    check("de voorraad is persistent", overzicht.persistent === true);
    check(
      "goedkeuringsdrempel 15 uit de database",
      overzicht.goedkeuringsdrempel === 15,
      `drempel ${overzicht.goedkeuringsdrempel}`
    );
    check("automatisch afboeken staat aan", overzicht.automatischAfboeken === true);

    snapshot = Object.fromEntries(
      overzicht.producten.map((product) => [product.id, product.stock])
    );
    console.log(
      "  uitgangsstand: " +
        `orders=${await aantalRijen("orders")} ` +
        `payment_sessions=${await aantalRijen("payment_sessions")} ` +
        `stock_movements=${await aantalRijen("stock_movements")} ` +
        `stock_requests=${await aantalRijen("stock_requests")}`
    );

    console.log("=== 1. bestelling plaatsen ===");
    const bestel = await api("/api/orders", "POST", {
      table: "TEST-99",
      items: [{ id: "gambas-al-ajillo", quantity: 1 }],
      note: "controle na migratie",
    });
    check(
      "POST /api/orders geeft 201",
      bestel.status === 201,
      `status ${bestel.status} ${JSON.stringify(bestel.body).slice(0, 150)}`
    );
    orderId = bestel.body && bestel.body.order ? bestel.body.order.id : null;
    check("de bestelling heeft een id uit de database", Boolean(orderId));

    const dbOrder = await rest(
      `orders?id=eq.${orderId}&select=id,table_number,status,note,` +
        "order_items(menu_item_id,quantity)"
    );
    check(
      "de bestelling staat in Supabase",
      Array.isArray(dbOrder.body) && dbOrder.body.length === 1,
      JSON.stringify(dbOrder.body).slice(0, 150)
    );
    check(
      "de orderregels zijn mee opgeslagen",
      dbOrder.body && dbOrder.body[0].order_items.length === 1,
      `regels: ${dbOrder.body ? dbOrder.body[0].order_items.length : "?"}`
    );

    const naBestelling = await api("/api/voorraad");
    const stock = Object.fromEntries(
      naBestelling.body.producten.map((product) => [product.id, product.stock])
    );
    check("garnalen 180 g afgeboekt (700 naar 520)", stock.gambas === 520, `nu ${stock.gambas}`);
    check("knoflook 20 g afgeboekt (1400 naar 1380)", stock.knoflook === 1380, `nu ${stock.knoflook}`);
    check(
      "er is een verbruik-mutatie geboekt",
      naBestelling.body.mutaties.some(
        (m) => m.reason === "verbruik" && m.ingredientId === "gambas"
      ),
      `${naBestelling.body.mutaties.length} mutaties in beeld`
    );

    console.log("=== 2. afrekenen ===");
    const start = await api("/api/betalen", "POST", { table: "TEST-99" });
    check(
      "POST /api/betalen geeft 201",
      start.status === 201,
      `status ${start.status} ${JSON.stringify(start.body).slice(0, 150)}`
    );
    sessieId = start.body && start.body.sessie ? start.body.sessie.id : null;
    check(
      "het bedrag is server-side berekend (9,00)",
      Number(start.body && start.body.sessie ? start.body.sessie.bedrag : 0) === 9,
      `bedrag ${start.body && start.body.sessie ? start.body.sessie.bedrag : "?"}`
    );

    const dbSessie = await rest(
      `payment_sessions?id=eq.${sessieId}&select=id,status,amount`
    );
    check(
      "de betaalsessie staat in Supabase",
      Array.isArray(dbSessie.body) && dbSessie.body.length === 1
    );

    const kaart = (nummer) => ({
      nummer,
      houder: "Test Gast",
      vervalt: "12/30",
      cvc: "123",
    });

    const geweigerd = await api(`/api/betalen/${sessieId}`, "PATCH", {
      kaart: kaart("4000000000000002"),
    });
    check(
      "een geweigerde kaart geeft 400",
      geweigerd.status === 400,
      JSON.stringify(geweigerd.body)
    );
    const nogOpen = await rest(
      `payment_sessions?id=eq.${sessieId}&select=status`
    );
    check(
      "de sessie blijft open na een weigering",
      nogOpen.body && nogOpen.body[0].status === "open"
    );

    const betaald = await api(`/api/betalen/${sessieId}`, "PATCH", {
      kaart: kaart("4242424242424242"),
    });
    check(
      "een geldige kaart geeft 200",
      betaald.status === 200,
      `status ${betaald.status} ${JSON.stringify(betaald.body).slice(0, 150)}`
    );
    check(
      "alleen de laatste vier cijfers worden bewaard",
      betaald.body && betaald.body.sessie.laatsteVier === "4242",
      `laatsteVier ${betaald.body && betaald.body.sessie.laatsteVier}`
    );

    const dubbel = await api(`/api/betalen/${sessieId}`, "PATCH", {
      kaart: kaart("4242424242424242"),
    });
    check(
      "een tweede keer betalen geeft 409",
      dubbel.status === 409,
      `status ${dubbel.status}`
    );

    console.log("=== 3. uitgifte boven de drempel ===");
    const uitgifte = await api("/api/voorraad/uitgifte", "POST", {
      productId: "entrecote",
      amount: 1000,
      door: "kok",
      note: "controle",
    });
    check(
      "een uitgifte van 26 euro wordt een aanvraag (202)",
      uitgifte.status === 202,
      `status ${uitgifte.status} soort ${uitgifte.body && uitgifte.body.soort}`
    );
    aanvraagId =
      uitgifte.body && uitgifte.body.aanvraag ? uitgifte.body.aanvraag.id : null;

    const tussenstand = await api("/api/voorraad");
    const entrecote = (overzicht) =>
      overzicht.producten.find((product) => product.id === "entrecote").stock;
    check(
      "de voorraad is nog niet afgeboekt",
      entrecote(tussenstand.body) === 6400,
      `nu ${entrecote(tussenstand.body)}`
    );
    check(
      "de aanvraag staat in Supabase",
      (await aantalRijen("stock_requests")) === 1
    );

    const alsKok = await api(`/api/voorraad/aanvragen/${aanvraagId}`, "POST", {
      actie: "goedkeuren",
      door: "kok",
    });
    check(
      "een kok mag niet goedkeuren (403)",
      alsKok.status === 403,
      `status ${alsKok.status}`
    );

    const alsChef = await api(`/api/voorraad/aanvragen/${aanvraagId}`, "POST", {
      actie: "goedkeuren",
      door: "hoofdchef",
    });
    check(
      "de hoofdchef keurt goed",
      alsChef.status === 200,
      JSON.stringify(alsChef.body).slice(0, 150)
    );

    const eind = await api("/api/voorraad");
    check(
      "entrecote staat nu op 5400 g",
      entrecote(eind.body) === 5400,
      `nu ${entrecote(eind.body)}`
    );
    const dbAanvraag = await rest(
      `stock_requests?id=eq.${aanvraagId}&select=status,handled_by,handled_at`
    );
    check(
      "de aanvraag staat op goedgekeurd in de database",
      dbAanvraag.body &&
        dbAanvraag.body[0].status === "goedgekeurd" &&
        dbAanvraag.body[0].handled_by === "hoofdchef",
      JSON.stringify(dbAanvraag.body)
    );

    console.log("=== 4. menu en gerechtbeschikbaarheid ===");
    const beschikbaar = await api("/api/voorraad/beschikbaar");
    check(
      "de beschikbaarheid geeft 200",
      beschikbaar.status === 200,
      `status ${beschikbaar.status}`
    );
    check(
      "13 gerechten hebben een status",
      Object.keys((beschikbaar.body && beschikbaar.body.status) || {}).length === 13
    );
    const menu = await api("/api/menu");
    check(
      "het menu komt nog uit de code (13 gerechten)",
      (menu.body ? menu.body.categories : []).reduce(
        (aantal, categorie) => aantal + categorie.items.length,
        0
      ) === 13
    );
    const csv = await fetch(`${BASIS}/api/voorraad/export`);
    const csvTekst = await csv.text();
    check(
      "de CSV-export werkt",
      csv.status === 200 && csvTekst.split("\r\n").length > 30,
      `regels ${csvTekst.split("\r\n").length}`
    );
  } catch (fout) {
    fouten += 1;
    console.log(`  FOUT onverwacht: ${fout.message}`);
  } finally {
    console.log("=== 5. testdata opruimen ===");
    if (orderId) {
      const weg = await rest(`orders?id=eq.${orderId}`, { method: "DELETE" });
      console.log(`  bestelling verwijderen: ${weg.status}`);
    }
    if (sessieId) {
      const weg = await rest(`payment_sessions?id=eq.${sessieId}`, {
        method: "DELETE",
      });
      console.log(`  betaalsessie verwijderen: ${weg.status}`);
    }
    if (aanvraagId) {
      const weg = await rest(`stock_requests?id=eq.${aanvraagId}`, {
        method: "DELETE",
      });
      console.log(`  aanvraag verwijderen: ${weg.status}`);
    }
    await rest("stock_movements?created_at=gte.1970-01-01T00:00:00Z", {
      method: "DELETE",
    });

    // De voorraad terugzetten op de waarden van vóór de test.
    if (snapshot) {
      for (const [id, waarde] of Object.entries(snapshot)) {
        await rest(`ingredients?id=eq.${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock: waarde }),
        });
      }
    }

    const eindstand = {
      orders: await aantalRijen("orders"),
      payment_sessions: await aantalRijen("payment_sessions"),
      stock_movements: await aantalRijen("stock_movements"),
      stock_requests: await aantalRijen("stock_requests"),
    };
    console.log(
      "  eindstand: " +
        Object.entries(eindstand)
          .map(([tabel, aantal]) => `${tabel}=${aantal}`)
          .join(" ")
    );

    const controle = await api("/api/voorraad");
    check(
      "de voorraad staat weer op de beginwaarde",
      Boolean(controle.body) &&
        controle.body.producten.every(
          (product) => product.stock === snapshot[product.id]
        )
    );
    check(
      "alle testtabellen zijn weer leeg",
      Object.values(eindstand).every((aantal) => aantal === 0)
    );

    console.log(
      fouten === 0
        ? "RESULTAAT: alles goed (0 fouten)"
        : `RESULTAAT: ${fouten} fout(en)`
    );
    process.exit(fouten === 0 ? 0 : 1);
  }
})();
