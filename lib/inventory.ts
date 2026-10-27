// Voorraadstore met opslag in een JSON-bestand.
//
// Waarom een bestand en geen externe dienst? Gratis databases (Supabase,
// MongoDB Atlas) vragen allemaal om een account. Een klein JSON-bestand werkt
// zonder account, is met de hand te lezen en overleeft een herstart van de
// server. Op een server met alleen-lezen schijf (zoals Vercel) blijft de
// voorraad in het geheugen werken; `persistent` in het overzicht vertelt of het
// echt bewaard wordt.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { RECEPTEN_SEED, VOORRAAD_SEED } from "./voorraad-seed";
import {
  berekenStatus,
  maakSamenvatting,
  moetGoedgekeurdWorden,
  rond,
  STANDAARD_DREMPEL,
  waardeVan,
  type Aanvraag,
  type Movement,
  type MovementReason,
  type Product,
  type Recipe,
  type Rol,
  type Tekort,
  type Unit,
  type VoorraadOverzicht,
} from "./voorraad-types";

// Vast pad binnen het project; via de omgevingsvariabele kun je ergens anders
// heen schrijven (bijvoorbeeld een map die je zelf back-upt).
const STANDAARD_BESTAND = path.join(process.cwd(), "data", "voorraad.json");
const BESTAND = process.env.VOORRAAD_BESTAND ?? STANDAARD_BESTAND;

const MAX_MUTATIES = 500;
const MAX_AANVRAGEN = 100;

type Bewaard = {
  versie: number;
  bijgewerkt: number;
  producten: Product[];
  mutaties: Movement[];
  aanvragen: Aanvraag[];
  automatischAfboeken?: boolean;
  goedkeuringsdrempel?: number;
};

let producten: Product[] = [];
let mutaties: Movement[] = [];
let aanvragen: Aanvraag[] = [];
let persistent = true;
let bijgewerkt = 0;
let geladen = false;

// Standaard rekent de app de recepten af bij een bestelling. Zet de manager dit
// uit, dan boekt de keuken zelf af via het uitgiftescherm.
let automatischAfboeken = true;

// Uitgiftes boven deze waarde moeten door de hoofdchef worden goedgekeurd.
let goedkeuringsdrempel = STANDAARD_DREMPEL;

const listeners = new Set<() => void>();

const EENHEDEN: Unit[] = ["gram", "ml", "stuk"];

function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // listener weggevallen? negeer
    }
  }
}

function schrijf() {
  bijgewerkt = Date.now();
  try {
    mkdirSync(path.dirname(BESTAND), { recursive: true });
    const inhoud: Bewaard = {
      versie: 2,
      bijgewerkt,
      producten,
      mutaties: mutaties.slice(-MAX_MUTATIES),
      aanvragen: aanvragen.slice(-MAX_AANVRAGEN),
      automatischAfboeken,
      goedkeuringsdrempel,
    };
    writeFileSync(
      /* turbopackIgnore: true */ BESTAND,
      JSON.stringify(inhoud, null, 2),
      "utf8"
    );
    persistent = true;
  } catch {
    // Alleen-lezen bestandssysteem: we draaien verder met het geheugen.
    persistent = false;
  }
}

/** Zorgt dat een product uit een bestand altijd compleet en geldig is. */
function normaliseer(ruw: Partial<Product>): Product | null {
  if (!ruw || typeof ruw.id !== "string" || !ruw.id) return null;
  const unit: Unit = EENHEDEN.includes(ruw.unit as Unit)
    ? (ruw.unit as Unit)
    : "stuk";
  return {
    id: ruw.id,
    name: typeof ruw.name === "string" && ruw.name ? ruw.name : ruw.id,
    unit,
    stock: Number.isFinite(ruw.stock) ? Number(ruw.stock) : 0,
    parLevel: Number.isFinite(ruw.parLevel) ? Number(ruw.parLevel) : 0,
    costPerUnit: Number.isFinite(ruw.costPerUnit) ? Number(ruw.costPerUnit) : 0,
    supplier: typeof ruw.supplier === "string" ? ruw.supplier : undefined,
    updatedAt: Number.isFinite(ruw.updatedAt) ? Number(ruw.updatedAt) : Date.now(),
  };
}

function laad() {
  if (geladen) return;
  geladen = true;

  let nieuwUitSeed = false;

  try {
    // De ignore-opmerking houdt de buildanalyse uit de war: het bestand staat
    // in /data en hoort verder nergens in de bundel terecht te komen.
    const ruw = JSON.parse(
      readFileSync(/* turbopackIgnore: true */ BESTAND, "utf8")
    ) as Partial<Bewaard>;
    const bewaard = Array.isArray(ruw.producten)
      ? ruw.producten.map(normaliseer).filter((p): p is Product => p !== null)
      : [];
    producten = bewaard;
    mutaties = Array.isArray(ruw.mutaties) ? ruw.mutaties : [];
    bijgewerkt = Number.isFinite(ruw.bijgewerkt) ? Number(ruw.bijgewerkt) : Date.now();
    automatischAfboeken = ruw.automatischAfboeken !== false;
    aanvragen = Array.isArray(ruw.aanvragen) ? ruw.aanvragen : [];
    goedkeuringsdrempel = Number.isFinite(ruw.goedkeuringsdrempel)
      ? Number(ruw.goedkeuringsdrempel)
      : STANDAARD_DREMPEL;

    // Producten die nieuw in de seed staan, komen er automatisch bij. Zo blijft
    // het aanpassen van lib/voorraad-seed.ts genoeg voor een nieuw artikel.
    for (const start of VOORRAAD_SEED) {
      if (!producten.some((p) => p.id === start.id)) {
        producten.push({ ...start, updatedAt: Date.now() });
        nieuwUitSeed = true;
      }
    }
  } catch {
    // Nog geen bestand: begin met de beginvoorraad uit de seed.
    producten = VOORRAAD_SEED.map((p) => ({ ...p, updatedAt: Date.now() }));
    mutaties = [];
    aanvragen = [];
    nieuwUitSeed = true;
  }

  sorteer();
  if (nieuwUitSeed) schrijf();
}

function sorteer() {
  producten.sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

function zoek(id: string): Product | undefined {
  return producten.find((p) => p.id === id);
}

function maakSlug(naam: string): string {
  const basis =
    naam
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "product";

  let id = basis;
  let teller = 2;
  while (producten.some((p) => p.id === id)) {
    id = `${basis}-${teller}`;
    teller += 1;
  }
  return id;
}

function boekIngredient(
  product: Product,
  delta: number,
  reason: MovementReason,
  note?: string,
  door?: Rol
): Movement {
  const werkelijk = rond(delta);
  product.stock = rond(Math.max(0, product.stock + werkelijk));
  product.updatedAt = Date.now();

  const movement: Movement = {
    id: crypto.randomUUID(),
    ingredientId: product.id,
    name: product.name,
    delta: werkelijk,
    reason,
    note: note?.trim() || undefined,
    door,
    createdAt: Date.now(),
  };
  mutaties.push(movement);
  if (mutaties.length > MAX_MUTATIES) {
    mutaties = mutaties.slice(-MAX_MUTATIES);
  }
  return movement;
}

function overzicht(): VoorraadOverzicht {
  laad();
  const recepten = RECEPTEN_SEED;
  const status = berekenStatus(recepten, producten);

  return {
    producten: [...producten],
    mutaties: [...mutaties].sort((a, b) => b.createdAt - a.createdAt).slice(0, 40),
    recepten,
    status,
    samenvatting: maakSamenvatting(producten, mutaties, status),
    persistent,
    automatischAfboeken,
    goedkeuringsdrempel,
    aanvragen: [...aanvragen].sort((a, b) => b.createdAt - a.createdAt),
    bijgewerkt,
  };
}

export function voorraadStore() {
  return {
    overzicht,

    producten(): Product[] {
      laad();
      return [...producten];
    },

    recepten(): Recipe[] {
      return RECEPTEN_SEED;
    },

    /** Beschikbaarheid per gerecht, gebruikt door de menukaart. */
    beschikbaarheid() {
      laad();
      const status = berekenStatus(RECEPTEN_SEED, producten);
      return {
        status,
        persistent,
        bijgewerkt,
        samenvatting: maakSamenvatting(producten, mutaties, status),
      };
    },

    voegProductToe(input: {
      name: string;
      unit: Unit;
      stock?: number;
      parLevel?: number;
      costPerUnit?: number;
      supplier?: string;
    }): Product {
      laad();
      const naam = input.name.trim();
      if (naam.length < 2) throw new Error("Naam is te kort");
      if (!EENHEDEN.includes(input.unit)) throw new Error("Onbekende eenheid");

      const stock = Math.max(0, Number(input.stock) || 0);
      const product: Product = {
        id: maakSlug(naam),
        name: naam,
        unit: input.unit,
        stock,
        parLevel: Math.max(0, Number(input.parLevel) || 0),
        costPerUnit: Math.max(0, Number(input.costPerUnit) || 0),
        supplier: input.supplier?.trim() || undefined,
        updatedAt: Date.now(),
      };

      producten.push(product);
      sorteer();

      if (stock > 0) {
        boekIngredient(product, stock, "levering", "Beginsaldo nieuw product");
      } else {
        mutaties.push({
          id: crypto.randomUUID(),
          ingredientId: product.id,
          name: product.name,
          delta: 0,
          reason: "correctie",
          note: "Product toegevoegd",
          createdAt: Date.now(),
        });
      }

      schrijf();
      notify();
      return product;
    },

    werkProductBij(
      id: string,
      patch: Partial<Pick<Product, "name" | "unit" | "parLevel" | "costPerUnit" | "supplier">>
    ): Product | undefined {
      laad();
      const product = zoek(id);
      if (!product) return undefined;

      if (typeof patch.name === "string" && patch.name.trim().length >= 2) {
        product.name = patch.name.trim();
      }
      if (patch.unit && EENHEDEN.includes(patch.unit)) product.unit = patch.unit;
      if (Number.isFinite(patch.parLevel)) {
        product.parLevel = Math.max(0, Number(patch.parLevel));
      }
      if (Number.isFinite(patch.costPerUnit)) {
        product.costPerUnit = Math.max(0, Number(patch.costPerUnit));
      }
      if (typeof patch.supplier === "string") {
        product.supplier = patch.supplier.trim() || undefined;
      }

      product.updatedAt = Date.now();
      sorteer();
      schrijf();
      notify();
      return product;
    },

    verwijderProduct(id: string): boolean {
      laad();
      const index = producten.findIndex((p) => p.id === id);
      if (index === -1) return false;
      const [verwijderd] = producten.splice(index, 1);
      mutaties.push({
        id: crypto.randomUUID(),
        ingredientId: verwijderd.id,
        name: verwijderd.name,
        delta: rond(-verwijderd.stock),
        reason: "correctie",
        note: "Product verwijderd",
        createdAt: Date.now(),
      });
      schrijf();
      notify();
      return true;
    },

    /**
     * Eén mutatie boeken. Geef `delta` mee voor levering of verlies, of `naar`
     * voor een telling (correctie naar een nieuw aantal).
     */
    boek(
      id: string,
      invoer: { delta?: number; naar?: number; reason: MovementReason; note?: string },
      door?: Rol
    ): Movement | undefined {
      laad();
      const product = zoek(id);
      if (!product) return undefined;

      const delta = Number.isFinite(invoer.naar)
        ? rond(Number(invoer.naar) - product.stock)
        : rond(Number(invoer.delta) || 0);

      const movement = boekIngredient(
        product,
        delta,
        invoer.reason,
        invoer.note,
        door
      );
      schrijf();
      notify();
      return movement;
    },

    /**
     * De keuken pakt iets uit de voorraad. Is de waarde hoger dan de
     * goedkeuringsdrempel, dan wordt er niets afgeboekt maar gaat er een
     * aanvraag naar de hoofdchef.
     */
    pak(
      id: string,
      invoer: { amount: number; note?: string; door: Rol }
    ):
      | { ok: true; soort: "direct"; waarde: number; movement: Movement }
      | { ok: true; soort: "aanvraag"; waarde: number; aanvraag: Aanvraag }
      | { ok: false; fout: string } {
      laad();
      const product = zoek(id);
      if (!product) return { ok: false, fout: "Product niet gevonden" };

      const amount = rond(Number(invoer.amount));
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, fout: "Vul een hoeveelheid groter dan nul in" };
      }
      if (product.stock < amount) {
        return {
          ok: false,
          fout: `Er is maar ${rond(product.stock)} in huis`,
        };
      }

      const waarde = waardeVan(amount, product);

      if (!moetGoedgekeurdWorden(waarde, goedkeuringsdrempel)) {
        const movement = boekIngredient(
          product,
          -amount,
          "uitgifte",
          invoer.note,
          invoer.door
        );
        schrijf();
        notify();
        return { ok: true, soort: "direct", waarde, movement };
      }

      const aanvraag: Aanvraag = {
        id: crypto.randomUUID(),
        ingredientId: product.id,
        name: product.name,
        unit: product.unit,
        amount,
        waarde,
        note: invoer.note?.trim() || undefined,
        aangevraagdDoor: invoer.door,
        status: "open",
        createdAt: Date.now(),
      };
      aanvragen.push(aanvraag);
      schrijf();
      notify();
      return { ok: true, soort: "aanvraag", waarde, aanvraag };
    },

    /** De hoofdchef keurt een aanvraag goed; dan wordt de uitgifte geboekt. */
    keurAanvraagGoed(
      aanvraagId: string,
      door: Rol
    ): { ok: boolean; fout?: string; movement?: Movement } {
      laad();
      if (door !== "hoofdchef") {
        return { ok: false, fout: "Alleen de hoofdchef kan goedkeuren" };
      }

      const aanvraag = aanvragen.find((a) => a.id === aanvraagId);
      if (!aanvraag) return { ok: false, fout: "Aanvraag niet gevonden" };
      if (aanvraag.status !== "open") {
        return { ok: false, fout: "Deze aanvraag is al behandeld" };
      }

      const product = zoek(aanvraag.ingredientId);
      if (!product) return { ok: false, fout: "Product niet gevonden" };
      if (product.stock < aanvraag.amount) {
        return { ok: false, fout: "Er is inmiddels niet genoeg voorraad meer" };
      }

      const movement = boekIngredient(
        product,
        -aanvraag.amount,
        "uitgifte",
        [aanvraag.note, `aangevraagd door de ${aanvraag.aangevraagdDoor}`]
          .filter(Boolean)
          .join(" · "),
        door
      );

      aanvraag.status = "goedgekeurd";
      aanvraag.behandeldDoor = door;
      aanvraag.behandeldOp = Date.now();

      schrijf();
      notify();
      return { ok: true, movement };
    },

    /** De hoofdchef wijst een aanvraag af; er verandert niets aan de voorraad. */
    wijsAanvraagAf(
      aanvraagId: string,
      door: Rol,
      reden?: string
    ): { ok: boolean; fout?: string } {
      laad();
      if (door !== "hoofdchef") {
        return { ok: false, fout: "Alleen de hoofdchef kan een aanvraag afwijzen" };
      }

      const aanvraag = aanvragen.find((a) => a.id === aanvraagId);
      if (!aanvraag) return { ok: false, fout: "Aanvraag niet gevonden" };
      if (aanvraag.status !== "open") {
        return { ok: false, fout: "Deze aanvraag is al behandeld" };
      }

      aanvraag.status = "afgewezen";
      aanvraag.behandeldDoor = door;
      aanvraag.behandeldOp = Date.now();
      aanvraag.reden = reden?.trim() || undefined;

      schrijf();
      notify();
      return { ok: true };
    },

    /** Goedkeuringsdrempel in euro's; 0 betekent: geen goedkeuring nodig. */
    zetGoedkeuringsdrempel(waarde: number): number {
      laad();
      goedkeuringsdrempel = Math.max(0, rond(Number(waarde) || 0));
      schrijf();
      notify();
      return goedkeuringsdrempel;
    },

    /** Alles wat onder het par-niveau zit in één keer bijvullen (levering). */
    vulAanTotPar(ids?: string[], door?: Rol): Movement[] {
      laad();
      const gedaan: Movement[] = [];

      for (const product of producten) {
        if (ids && !ids.includes(product.id)) continue;
        if (product.stock >= product.parLevel) continue;
        gedaan.push(
          boekIngredient(
            product,
            rond(product.parLevel - product.stock),
            "levering",
            "Bijgevuld tot par-niveau",
            door
          )
        );
      }

      if (gedaan.length > 0) {
        schrijf();
        notify();
      }
      return gedaan;
    },

    /**
     * Controleert (en boekt) een bestelling af op basis van de recepten.
     * Alles of niets. Met `boeken: false` wordt er alleen gekeken of het kan,
     * wat gebruikt wordt als de keuken zelf haar uitgiftes registreert.
     */
    verbruik(
      items: { id: string; quantity: number }[],
      tabel?: string,
      boeken = true
    ): { gelukt: boolean; tekorten: Tekort[]; mutaties: Movement[] } {
      laad();
      const perIngredient = new Map<string, number>();

      for (const item of items) {
        const recipe = RECEPTEN_SEED.find((r) => r.menuItemId === item.id);
        if (!recipe) continue;
        for (const line of recipe.lines) {
          perIngredient.set(
            line.ingredientId,
            rond((perIngredient.get(line.ingredientId) ?? 0) + line.amount * item.quantity)
          );
        }
      }

      const tekorten: Tekort[] = [];
      for (const [ingredientId, nodig] of perIngredient) {
        const product = zoek(ingredientId);
        if (!product) {
          tekorten.push({
            ingredientId,
            name: "onbekend ingrediënt",
            unit: "stuk",
            nodig,
            aanwezig: 0,
          });
          continue;
        }
        if (product.stock < nodig) {
          tekorten.push({
            ingredientId,
            name: product.name,
            unit: product.unit,
            nodig,
            aanwezig: rond(product.stock),
          });
        }
      }

      if (tekorten.length > 0) {
        return { gelukt: false, tekorten, mutaties: [] };
      }

      if (!boeken) {
        return { gelukt: true, tekorten: [], mutaties: [] };
      }

      const geboekt: Movement[] = [];
      const notitie = tabel ? `Bestelling tafel ${tabel}` : "Bestelling";
      for (const [ingredientId, nodig] of perIngredient) {
        const product = zoek(ingredientId);
        if (!product || nodig === 0) continue;
        geboekt.push(boekIngredient(product, -nodig, "verbruik", notitie));
      }

      schrijf();
      notify();
      return { gelukt: true, tekorten: [], mutaties: geboekt };
    },

    /** Aanzetten of uitzetten van automatisch afboeken bij bestellingen. */
    zetAutomatischAfboeken(waarde: boolean): boolean {
      laad();
      automatischAfboeken = waarde;
      schrijf();
      notify();
      return automatischAfboeken;
    },

    /** Rekent de app bestellingen automatisch af? */
    rekentAutomatischAf(): boolean {
      laad();
      return automatischAfboeken;
    },

    /** Zet de voorraad terug naar de beginvoorraad uit de seed. */
    reset(door?: Rol): void {
      laad();
      for (const product of producten) {
        const start = VOORRAAD_SEED.find((p) => p.id === product.id);
        if (start && product.stock !== start.stock) {
          boekIngredient(
            product,
            rond(start.stock - product.stock),
            "correctie",
            "Beginvoorraad hersteld",
            door
          );
        }
      }
      // Openstaande aanvragen horen bij de oude stand en vervallen daarom.
      aanvragen = [];
      schrijf();
      notify();
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
