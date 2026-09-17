/**
 * Controle van de koppeling tussen voorraad en menukaart.
 *
 * Zet de inktvisringen op een lege voorraad, kijkt of de paella op de menukaart
 * als uitverkocht verschijnt (met melding) en zet de voorraad daarna terug.
 *
 * Gebruik: `npm run dev` aan, daarna
 *   node docs/checks/uitverkocht-check.js
 */

const { chromium } = require("playwright");
const fs = require("fs");

const BASIS = "http://localhost:3000";
const UIT = "C:/Users/simo0/Downloads/las tapas/docs/screenshots";

(async () => {
  fs.mkdirSync(UIT, { recursive: true });

  // Inktvis bijna op, zodat de paella niet meer gemaakt kan worden.
  await fetch(`${BASIS}/api/voorraad/calamares`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ naar: 10, reason: "correctie", note: "Test uitverkocht" }),
  });

  const browser = await chromium.launch({ headless: true });
  const problemen = [];

  for (const viewport of [
    { naam: "desktop", width: 1440, height: 900 },
    { naam: "mobiel", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${BASIS}/menu?tafel=7`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const uitverkocht = await page.locator(".menu-item.uitverkocht").count();
    const opLabel = await page.locator(".menu-item-uit").count();
    const melding = await page
      .locator(".menu-uitverkocht-melding")
      .first()
      .textContent()
      .catch(() => null);

    await page.screenshot({
      path: `${UIT}/menu-uitverkocht-${viewport.naam}.png`,
      fullPage: true,
    });

    console.log(
      `${viewport.naam.padEnd(8)} uitverkochte gerechten: ${uitverkocht}, ` +
        `"vandaag op"-labels: ${opLabel}, melding: ${melding?.trim() ?? "geen"}`
    );

    if (uitverkocht !== 1) {
      problemen.push(`[${viewport.naam}] verwachtte 1 uitverkocht gerecht, vond ${uitverkocht}`);
    }
    if (!melding?.includes("Paella Mixta")) {
      problemen.push(`[${viewport.naam}] de melding noemt de paella niet`);
    }
    if (opLabel < 1) {
      problemen.push(`[${viewport.naam}] geen "vandaag op"-label bij het gerecht`);
    }

    await page.close();
  }

  await browser.close();

  // Voorraad weer netjes terugzetten.
  await fetch(`${BASIS}/api/voorraad/reset`, { method: "POST" });
  const controle = await fetch(`${BASIS}/api/voorraad/beschikbaar`).then((r) => r.json());
  const paellaWeer = controle.status["paella-mixta"].maakbaar;

  console.log(`\nNa herstellen: paella weer maakbaar: ${paellaWeer ? "ja" : "nee"}`);
  if (!paellaWeer) problemen.push("paella bleef uitverkocht na het herstellen");

  console.log("\n--- problemen ---");
  console.log(problemen.length ? problemen.join("\n") : "geen");
  process.exitCode = problemen.length > 0 ? 1 : 0;
})();
