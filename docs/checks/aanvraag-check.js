/**
 * Controle van rollen en goedkeuring in de browser.
 *
 * Zet de drempel laag, vraagt als kok een grote uitgifte aan, kijkt of de
 * goedkeuringsknop alleen bij de hoofdchef staat en of goedkeuren de voorraad
 * echt afboekt. Daarna wordt alles teruggezet.
 *
 * Gebruik: `npm run dev` aan, daarna
 *   node docs/checks/aanvraag-check.js
 */

const { chromium } = require("playwright");
const fs = require("fs");

const BASIS = "http://localhost:3000";
const UIT = "C:/Users/simo0/Downloads/las tapas/docs/screenshots";

async function api(pad, methode, body) {
  const antwoord = await fetch(`${BASIS}${pad}`, {
    method: methode,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return antwoord.json().catch(() => ({}));
}

function voorraadVan(overzicht, id) {
  return overzicht.producten.find((p) => p.id === id)?.stock;
}

(async () => {
  fs.mkdirSync(UIT, { recursive: true });
  const problemen = [];

  // Drempel laag zetten en een grote aanvraag klaarzetten.
  await api("/api/voorraad/instellingen", "POST", { goedkeuringsdrempel: 5 });
  const voor = await api("/api/voorraad", "GET");
  const entrecoteVoor = voorraadVan(voor, "entrecote");

  const aanvraag = await api("/api/voorraad/uitgifte", "POST", {
    productId: "entrecote",
    amount: 1000,
    door: "kok",
    note: "voor de churrasco van vanavond",
  });

  if (aanvraag.soort !== "aanvraag") {
    problemen.push("de aanvraag werd niet aangemaakt");
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (fout) => problemen.push(`[pageerror] ${fout.message}`));

  await page.goto(`${BASIS}/uitgifte`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".aanvraag-rij", { timeout: 10_000 });

  // Als kok: wel zien, niet mogen goedkeuren.
  await page.locator(".rol-knop", { hasText: "Kok" }).click();
  await page.waitForTimeout(300);
  // Let op: text=-selectors zijn hoofdletterongevoelig, dus we zoeken op de
  // knop zelf en niet op het woord in de uitleg erboven.
  const kokKnop = await page.getByRole("button", { name: "Goedkeuren" }).count();
  const wachtLabel = await page.locator(".aanvraag-rij .status-badge").count();
  console.log(`kok: goedkeurknop ${kokKnop}, wacht-label ${wachtLabel}`);
  if (kokKnop !== 0) problemen.push("een kok ziet toch een goedkeurknop");
  if (wachtLabel === 0) problemen.push("de kok ziet niet dat er op de hoofdchef gewacht wordt");

  await page.screenshot({ path: `${UIT}/uitgifte-aanvraag-kok.png`, fullPage: true });

  // Als hoofdchef: goedkeuren.
  await page.locator(".rol-knop", { hasText: "Hoofdchef" }).click();
  const goedkeurKnop = page.getByRole("button", { name: "Goedkeuren" });
  await goedkeurKnop.waitFor({ timeout: 10_000 });
  await page.screenshot({ path: `${UIT}/uitgifte-goedkeuren.png`, fullPage: true });

  await goedkeurKnop.first().click();
  await page
    .locator(".aanvraag-rij")
    .first()
    .waitFor({ state: "detached", timeout: 10_000 })
    .catch(() => problemen.push("de aanvraag bleef staan na goedkeuren"));
  await page.waitForTimeout(600);

  await page.screenshot({ path: `${UIT}/uitgifte-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${UIT}/uitgifte-mobiel.png`, fullPage: true });

  const na = await api("/api/voorraad", "GET");
  const entrecoteNa = voorraadVan(na, "entrecote");
  console.log(`entrecote: ${entrecoteVoor} -> ${entrecoteNa} gram`);
  if (entrecoteNa !== entrecoteVoor - 1000) {
    problemen.push("de voorraad is niet met 1000 g afgeboekt na goedkeuren");
  }
  if (na.aanvragen.some((a) => a.status === "open")) {
    problemen.push("er staat nog een open aanvraag na goedkeuren");
  }
  if (!na.mutaties.some((m) => m.reason === "uitgifte" && m.door === "hoofdchef")) {
    problemen.push("de mutatie mist de rol van de hoofdchef");
  }

  await page.close();
  await browser.close();

  // Alles terugzetten voor een schone demo.
  await api("/api/voorraad/instellingen", "POST", { goedkeuringsdrempel: 15 });
  await api("/api/voorraad/reset", "POST", { door: "manager" });

  console.log("\n--- problemen ---");
  console.log(problemen.length ? problemen.join("\n") : "geen");
  process.exitCode = problemen.length > 0 ? 1 : 0;
})();
