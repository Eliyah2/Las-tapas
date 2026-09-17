const { chromium } = require("playwright");
const fs = require("fs");

const BASE = "http://localhost:3000";
const OUT = "C:/Users/simo0/Downloads/las tapas/docs/screenshots";

const pages = [
  { name: "home", url: "/" },
  { name: "welkom", url: "/welkom?tafel=7" },
  { name: "menu", url: "/menu?tafel=7" },
  { name: "keuken", url: "/keuken" },
  { name: "voorraad", url: "/voorraad" },
  { name: "uitgifte", url: "/uitgifte" },
  { name: "qr", url: "/qr" },
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobiel", width: 390, height: 844 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const problems = [];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    page.on("console", (msg) => {
      if (msg.type() === "error") problems.push(`[console] ${vp.name} ${page.url()}: ${msg.text()}`);
    });
    page.on("pageerror", (err) => problems.push(`[pageerror] ${vp.name}: ${err.message}`));

    for (const p of pages) {
      // De keukenpagina houdt een SSE-stream open, dus "networkidle" komt daar nooit.
      await page.goto(`${BASE}${p.url}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/${p.name}-${vp.name}.png`, fullPage: true });

      // Controle dat de fotolaag écht zichtbaar is: screenshot vergelijken met
      // dezelfde pagina waarin de fotolaag verborgen is.
      const before = await page.screenshot();
      const hadPhoto = await page.evaluate(() => {
        const layer = document.querySelector(".page-photo");
        if (!layer) return false;
        layer.style.visibility = "hidden";
        return true;
      });
      let photoRenders = true;
      if (hadPhoto) {
        const after = await page.screenshot();
        photoRenders = !before.equals(after);
        await page.evaluate(() => {
          document.querySelector(".page-photo").style.visibility = "visible";
        });
      }

      const info = await page.evaluate(() => {
        const el = document.querySelector(".page-photo");
        const btn = document.querySelector(".button, .add-button, .order-button");
        const style = (node, prop) =>
          node ? getComputedStyle(node).getPropertyValue(prop).trim() : "-";
        const hero = document.querySelector(".welcome-page");
        return {
          overflowX: document.documentElement.scrollWidth - window.innerWidth,
          foto: (style(el, "background-image") + style(hero, "background-image")).includes("tapas.jpg"),
          h1Color: style(document.querySelector("h1"), "color"),
          btnBg: style(btn, "background-color"),
          btnColor: style(btn, "color"),
          fonts: style(document.querySelector("h1"), "font-family"),
          pageH: document.documentElement.scrollHeight,
        };
      });

      if (info.overflowX > 1) problems.push(`[overflow] ${vp.name} ${p.url}: ${info.overflowX}px horizontale scroll`);
      if (info.btnBg !== "-" && info.btnBg !== "rgb(23, 17, 15)")
        problems.push(`[knop] ${vp.name} ${p.url}: achtergrond ${info.btnBg}`);
      if (info.btnBg === "rgb(23, 17, 15)" && info.btnColor !== "rgb(255, 253, 249)")
        problems.push(`[knop] ${vp.name} ${p.url}: zwarte knop met tekstkleur ${info.btnColor}`);

      if (hadPhoto && !photoRenders)
        problems.push(`[foto] ${vp.name} ${p.url}: fotolaag is niet zichtbaar`);

      console.log(
        `${vp.name.padEnd(8)} ${p.url.padEnd(18)} page:${String(info.pageH).padStart(5)}px ` +
          `overloopX:${String(info.overflowX).padStart(3)}px foto:${info.foto ? "ja" : "-"} ` +
          `zichtbaar:${hadPhoto ? (photoRenders ? "ja" : "NEE") : "-"} ` +
          `knop:${info.btnBg} tekst:${info.btnColor} h1:${info.h1Color}`
      );
    }
    await page.close();
  }

  await browser.close();
  console.log("\n--- problemen ---");
  console.log(problems.length ? problems.join("\n") : "geen");
})();
