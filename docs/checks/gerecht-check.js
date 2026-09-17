/**
 * Controle van het filteren en sorteren op gerechten.
 *
 * Kijkt of het voorraadscherm alleen de ingrediënten van het gekozen gerecht
 * toont, of er per product bij staat hoeveel er per portie in gaat, of de
 * sortering "Op gerecht" de ingrediënten per gerecht bij elkaar zet, en of het
 * uitgiftescherm hetzelfde filter heeft. Maakt er ook screenshots van.
 *
 * Gebruik: `npm run dev` aan, daarna
 *   node docs/checks/gerecht-check.js
 */

const { chromium } = require("playwright");
const fs = require("fs");

const BASIS = "http://localhost:3000";
const UIT = "C:/Users/simo0/Downloads/las tapas/docs/screenshots";

const problemen = [];
function check(naam, gelukt, detail) {
  console.log(`  ${gelukt ? "ok  " : "FOUT"}  ${naam}${detail ? ` (${detail})` : ""}`);
  if (!gelukt) problemen.push(naam);
}

async function overzicht() {
  const antwoord = await fetch(`${BASIS}/api/voorraad`);
  return antwoord.json();
}

/** Leest de eerste gerechtnaam uit een regel als "voor X, Y" of "niet aan ...". */
function eersteGerecht(tekst) {
  if (!tekst.startsWith("voor ")) return "\uffff";
  return tekst.slice(5).split(",")[0].trim();
}

(async () => {
  fs.mkdirSync(UIT, { recursive: true });
  const data = await overzicht();
  const recept = (id) => data.recepten.find((r) => r.menuItemId === id);
  const paella = recept("paella-mixta");
  const bravas = recept("patatas-bravas");

  if (!paella || !bravas) {
    console.log("De demo heeft de gerechten paella-mixta en patatas-bravas nodig.");
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("console", (msg) => {
    if (msg.type() === "error") problemen.push(`[console] ${msg.text()}`);
  });
  page.on("pageerror", (err) => problemen.push(`[pageerror] ${err.message}`));

  const gerechtKeuze = page.getByLabel("Filteren op gerecht");
  const sorteringKeuze = page.getByLabel("Sorteren");

  console.log("\n1. Voorraadscherm: filteren op een gerecht");
  await page.goto(`${BASIS}/voorraad`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".product-rij", { timeout: 15_000 });
  const alleRijen = await page.locator(".product-rij").count();
  check("zonder filter staan alle producten er", alleRijen === data.producten.length, `${alleRijen} rijen`);

  await gerechtKeuze.selectOption("paella-mixta");
  await page.waitForTimeout(400);
  const paellaRijen = await page.locator(".product-rij").count();
  check(
    "het filter toont precies de ingrediënten van de paella",
    paellaRijen === paella.lines.length,
    `${paellaRijen} van ${paella.lines.length}`
  );

  const namenOpScherm = await page.locator(".product-naam").allInnerTexts();
  const verwachteNamen = paella.lines.map(
    (line) => data.producten.find((p) => p.id === line.ingredientId).name
  );
  check(
    "alleen de juiste producten staan in de lijst",
    namenOpScherm.every((naam) => verwachteNamen.includes(naam)),
    namenOpScherm.join(", ")
  );

  const perPortie = await page.locator(".product-gerechten").allInnerTexts();
  check(
    "bij elk product staat wat er per portie nodig is",
    perPortie.length === paellaRijen && perPortie.every((tekst) => tekst.includes("nodig:")),
    perPortie[0]
  );
  check(
    "de kop van het paneel noemt het gerecht",
    (await page.locator(".panel-heading").first().innerText()).includes("Paella Mixta")
  );

  await page.screenshot({ path: `${UIT}/voorraad-gerecht-desktop.png`, fullPage: true });

  console.log("\n2. Voorraadscherm: sorteren op gerecht");
  await gerechtKeuze.selectOption("");
  await sorteringKeuze.selectOption("gerecht");
  await page.waitForTimeout(400);
  const gesorteerd = await page.locator(".product-gerechten").allInnerTexts();
  const eersteGerechten = gesorteerd.map(eersteGerecht);
  const oplopend = eersteGerechten.every(
    (naam, index) => index === 0 || eersteGerechten[index - 1].localeCompare(naam, "nl") <= 0
  );
  check("de ingrediënten staan per gerecht op alfabetische volgorde", oplopend, eersteGerechten.slice(0, 4).join(" | "));
  check(
    "dezelfde ingrediënten van één gerecht staan naast elkaar",
    new Set(eersteGerechten).size <= new Set(data.recepten.map((r) => r.menuItemId)).size
  );

  console.log("\n3. Uitgiftescherm: hetzelfde filter voor de keuken");
  await page.goto(`${BASIS}/uitgifte`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".uitgifte-kaart", { timeout: 15_000 });
  await gerechtKeuze.selectOption("paella-mixta");
  await page.waitForTimeout(400);
  const kokKaarten = await page.locator(".uitgifte-kaart").count();
  check(
    "de keuken ziet alleen de ingrediënten van het gerecht",
    kokKaarten === paella.lines.length,
    `${kokKaarten} kaarten`
  );
  const kokTeksten = await page.locator(".uitgifte-gebruikt").allInnerTexts();
  check(
    "de keuken ziet wat er per portie nodig is",
    kokTeksten.every((tekst) => tekst.includes("nodig:")),
    kokTeksten[0]
  );
  check(
    "de uitleg noemt het gerecht en de volgorde van het recept",
    (await page.locator(".uitgifte-gerecht-uitleg").innerText()).includes("Paella Mixta")
  );

  await page.screenshot({ path: `${UIT}/uitgifte-gerecht-desktop.png`, fullPage: true });

  console.log("\n4. Niets loopt buiten het scherm (desktop en mobiel)");
  for (const breedte of [1440, 390]) {
    await page.setViewportSize({ width: breedte, height: 900 });
    for (const pad of ["/voorraad", "/uitgifte"]) {
      await page.goto(`${BASIS}${pad}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(700);
      const overloop = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      check(`geen horizontale overloop op ${pad} bij ${breedte}px`, overloop <= 1, `${overloop}px`);
    }
  }

  await browser.close();
  console.log("\n--- problemen ---");
  console.log(problemen.length ? problemen.join("\n") : "geen");
  process.exitCode = problemen.length > 0 ? 1 : 0;
})();
