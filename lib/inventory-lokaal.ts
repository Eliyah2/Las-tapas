// Voorraad zonder database: dezelfde handelingen, maar in het geheugen.
//
// Staat Supabase niet ingesteld (lokaal zonder .env.local), dan gebruikt de app
// deze winkel in plaats van de database. Hij begint met de beginvoorraad en de
// recepten uit lib/voorraad-seed.ts, zodat /voorraad meteen laat zien wat de
// menukaart nodig heeft in plaats van een leeg scherm.
//
// Wat je hier doet (tellen, levering, uitgifte, aanvragen) werkt hetzelfde als
// met de database; alleen overleeft het een herstart van de server niet. Zet
// NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local en
// draai supabase/schema.sql om de aantallen wel te bewaren.

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
  type Rol,
  type Tekort,
  type Unit,
  type VoorraadOverzicht,
} from "./voorraad-types";

const MAX_MUTATIES_IN_BEELD = 40;

type Winkel = {
  producten: Product[];
  mutaties: Movement[];
  aanvragen: Aanvraag[];
  automatischAfboeken: boolean;
  goedkeuringsdrempel: number;
  teller: number;
};

function beginstand(): Winkel {
  const nu = Date.now();
  return {
    producten: VOORRAAD_SEED.map((product) => ({ ...product, updatedAt: nu })),
    mutaties: [],
    aanvragen: [],
    automatischAfboeken: true,
    goedkeuringsdrempel: STANDAARD_DREMPEL,
    teller: 0,
  };
}

const winkel: Winkel = beginstand();

function opNaam(a: Product, b: Product): number {
  return a.name.localeCompare(b.name, "nl");
}

function vindProduct(id: string): Product | undefined {
  return winkel.producten.find((product) => product.id === id);
}

function laatsteWijziging(producten: Product[]): number {
  const tijden = producten
    .map((product) => product.updatedAt ?? 0)
    .filter((tijd) => tijd > 0);
  return tijden.length > 0 ? Math.max(...tijden) : Date.now();
}

function telMutatiesVandaag(): number {
  const begin = new Date();
  begin.setHours(0, 0, 0, 0);
  return winkel.mutaties.filter((m) => m.createdAt >= begin.getTime()).length;
}

/** Voorraad bijstellen en de mutatie vastleggen; onder nul gaat niet. */
function boekIn(
  product: Product,
  delta: number,
  reason: MovementReason,
  note?: string,
  door?: Rol
): Movement {
  const werkelijk = rond(delta);
  product.stock = Math.max(0, rond(product.stock + werkelijk));
  product.updatedAt = Date.now();

  winkel.teller += 1;
  const mutatie: Movement = {
    id: `lokaal-m${winkel.teller}`,
    ingredientId: product.id,
    name: product.name,
    delta: werkelijk,
    reason,
    note: note?.trim() || undefined,
    door,
    createdAt: Date.now(),
  };
  winkel.mutaties.unshift(mutatie);
  return mutatie;
}

function maakSlug(naam: string, bestaande: string[]): string {
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
  while (bestaande.includes(id)) {
    id = `${basis}-${teller}`;
    teller += 1;
  }
  return id;
}

const EENHEDEN: Unit[] = ["gram", "ml", "stuk"];

export function lokaleInventoryStore() {
  return {
    async overzicht(): Promise<VoorraadOverzicht> {
      const producten = [...winkel.producten].sort(opNaam);
      const status = berekenStatus(RECEPTEN_SEED, producten);
      const mutaties = winkel.mutaties.slice(0, MAX_MUTATIES_IN_BEELD);

      return {
        producten,
        mutaties,
        recepten: RECEPTEN_SEED,
        status,
        samenvatting: {
          ...maakSamenvatting(producten, mutaties, status),
          mutatiesVandaag: telMutatiesVandaag(),
        },
        // Geen database: de aantallen leven alleen zolang de server draait.
        persistent: false,
        automatischAfboeken: winkel.automatischAfboeken,
        goedkeuringsdrempel: winkel.goedkeuringsdrempel,
        aanvragen: [...winkel.aanvragen].sort((a, b) => b.createdAt - a.createdAt),
        bijgewerkt: laatsteWijziging(producten),
      };
    },

    async producten(): Promise<Product[]> {
      return [...winkel.producten].sort(opNaam);
    },

    async recepten() {
      return RECEPTEN_SEED;
    },

    /** Beschikbaarheid per gerecht, gebruikt door de menukaart. */
    async beschikbaarheid() {
      const producten = [...winkel.producten].sort(opNaam);
      const status = berekenStatus(RECEPTEN_SEED, producten);
      const mutaties = winkel.mutaties.slice(0, MAX_MUTATIES_IN_BEELD);

      return {
        status,
        persistent: false,
        bijgewerkt: laatsteWijziging(producten),
        samenvatting: {
          ...maakSamenvatting(producten, mutaties, status),
          mutatiesVandaag: telMutatiesVandaag(),
        },
      };
    },

    async voegProductToe(input: {
      name: string;
      unit: Unit;
      stock?: number;
      parLevel?: number;
      costPerUnit?: number;
      supplier?: string;
    }): Promise<Product> {
      const naam = input.name.trim();
      if (naam.length < 2) throw new Error("Naam is te kort");
      if (!EENHEDEN.includes(input.unit)) throw new Error("Onbekende eenheid");

      const stock = Math.max(0, Number(input.stock) || 0);
      const product: Product = {
        id: maakSlug(
          naam,
          winkel.producten.map((rij) => rij.id)
        ),
        name: naam,
        unit: input.unit,
        stock: 0,
        parLevel: Math.max(0, Number(input.parLevel) || 0),
        costPerUnit: Math.max(0, Number(input.costPerUnit) || 0),
        supplier: input.supplier?.trim() || undefined,
        updatedAt: Date.now(),
      };
      winkel.producten.push(product);

      if (stock > 0) {
        boekIn(product, stock, "levering", "Beginsaldo nieuw product");
      } else {
        boekIn(product, 0, "correctie", "Product toegevoegd");
      }

      return product;
    },

    async werkProductBij(
      id: string,
      patch: Partial<
        Pick<Product, "name" | "unit" | "parLevel" | "costPerUnit" | "supplier">
      >
    ): Promise<Product | undefined> {
      const product = vindProduct(id);
      if (!product) return undefined;

      if (typeof patch.name === "string" && patch.name.trim().length >= 2) {
        product.name = patch.name.trim();
      }
      if (patch.unit && EENHEDEN.includes(patch.unit)) {
        product.unit = patch.unit;
      }
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
      return product;
    },

    async verwijderProduct(id: string): Promise<boolean> {
      const index = winkel.producten.findIndex((product) => product.id === id);
      if (index === -1) return false;

      winkel.producten.splice(index, 1);
      // Net als in de database (on delete cascade) verdwijnt de historie mee.
      winkel.mutaties = winkel.mutaties.filter((m) => m.ingredientId !== id);
      winkel.aanvragen = winkel.aanvragen.filter((a) => a.ingredientId !== id);
      return true;
    },

    async boek(
      id: string,
      invoer: {
        delta?: number;
        naar?: number;
        reason: MovementReason;
        note?: string;
      },
      door?: Rol
    ): Promise<Movement | undefined> {
      const product = vindProduct(id);
      if (!product) return undefined;

      const delta = Number.isFinite(invoer.naar)
        ? rond(Number(invoer.naar) - product.stock)
        : rond(Number(invoer.delta) || 0);

      return boekIn(product, delta, invoer.reason, invoer.note, door);
    },

    /** De keuken pakt iets: boven de drempel wordt het een aanvraag. */
    async pak(
      id: string,
      invoer: { amount: number; note?: string; door: Rol }
    ): Promise<
      | { ok: true; soort: "direct"; waarde: number; movement: Movement }
      | { ok: true; soort: "aanvraag"; waarde: number; aanvraag: Aanvraag }
      | { ok: false; fout: string }
    > {
      const product = vindProduct(id);
      if (!product) return { ok: false, fout: "Product niet gevonden" };

      const amount = rond(Number(invoer.amount));
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, fout: "Vul een hoeveelheid groter dan nul in" };
      }
      if (product.stock < amount) {
        return { ok: false, fout: `Er is maar ${rond(product.stock)} in huis` };
      }

      const waarde = waardeVan(amount, product);

      if (!moetGoedgekeurdWorden(waarde, winkel.goedkeuringsdrempel)) {
        const movement = boekIn(
          product,
          -amount,
          "uitgifte",
          invoer.note,
          invoer.door
        );
        return { ok: true, soort: "direct", waarde, movement };
      }

      winkel.teller += 1;
      const aanvraag: Aanvraag = {
        id: `lokaal-a${winkel.teller}`,
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
      winkel.aanvragen.unshift(aanvraag);
      return { ok: true, soort: "aanvraag", waarde, aanvraag };
    },

    async keurAanvraagGoed(
      aanvraagId: string,
      door: Rol
    ): Promise<{ ok: boolean; fout?: string; movement?: Movement }> {
      if (door !== "hoofdchef") {
        return { ok: false, fout: "Alleen de hoofdchef kan goedkeuren" };
      }

      const aanvraag = winkel.aanvragen.find((rij) => rij.id === aanvraagId);
      if (!aanvraag) return { ok: false, fout: "Aanvraag niet gevonden" };
      if (aanvraag.status !== "open") {
        return { ok: false, fout: "Deze aanvraag is al behandeld" };
      }

      const product = vindProduct(aanvraag.ingredientId);
      if (!product) return { ok: false, fout: "Product niet gevonden" };
      if (product.stock < aanvraag.amount) {
        return { ok: false, fout: "Er is inmiddels niet genoeg voorraad meer" };
      }

      const movement = boekIn(
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

      return { ok: true, movement };
    },

    async wijsAanvraagAf(
      aanvraagId: string,
      door: Rol,
      reden?: string
    ): Promise<{ ok: boolean; fout?: string }> {
      if (door !== "hoofdchef") {
        return { ok: false, fout: "Alleen de hoofdchef kan een aanvraag afwijzen" };
      }

      const aanvraag = winkel.aanvragen.find((rij) => rij.id === aanvraagId);
      if (!aanvraag) return { ok: false, fout: "Aanvraag niet gevonden" };
      if (aanvraag.status !== "open") {
        return { ok: false, fout: "Deze aanvraag is al behandeld" };
      }

      aanvraag.status = "afgewezen";
      aanvraag.behandeldDoor = door;
      aanvraag.behandeldOp = Date.now();
      aanvraag.reden = reden?.trim() || undefined;

      return { ok: true };
    },

    async zetGoedkeuringsdrempel(waarde: number): Promise<number> {
      winkel.goedkeuringsdrempel = Math.max(0, rond(Number(waarde) || 0));
      return winkel.goedkeuringsdrempel;
    },

    async vulAanTotPar(ids?: string[], door?: Rol): Promise<Movement[]> {
      const gedaan: Movement[] = [];

      for (const product of [...winkel.producten].sort(opNaam)) {
        if (ids && !ids.includes(product.id)) continue;
        if (product.stock >= product.parLevel) continue;
        gedaan.push(
          boekIn(
            product,
            rond(product.parLevel - product.stock),
            "levering",
            "Bijgevuld tot par-niveau",
            door
          )
        );
      }

      return gedaan;
    },

    /** Controleert (en boekt) een bestelling af op basis van de recepten. */
    async verbruik(
      items: { id: string; quantity: number }[],
      tabel?: string,
      boeken = true
    ): Promise<{ gelukt: boolean; tekorten: Tekort[]; mutaties: Movement[] }> {
      const perIngredient = new Map<string, number>();

      for (const item of items) {
        const recipe = RECEPTEN_SEED.find((r) => r.menuItemId === item.id);
        if (!recipe) continue;
        for (const line of recipe.lines) {
          perIngredient.set(
            line.ingredientId,
            rond(
              (perIngredient.get(line.ingredientId) ?? 0) +
                line.amount * item.quantity
            )
          );
        }
      }

      const tekorten: Tekort[] = [];
      for (const [ingredientId, nodig] of perIngredient) {
        const product = vindProduct(ingredientId);
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
        const product = vindProduct(ingredientId);
        if (!product || nodig === 0) continue;
        geboekt.push(boekIn(product, -nodig, "verbruik", notitie));
      }

      return { gelukt: true, tekorten: [], mutaties: geboekt };
    },

    async zetAutomatischAfboeken(waarde: boolean): Promise<boolean> {
      winkel.automatischAfboeken = waarde;
      return waarde;
    },

    async rekentAutomatischAf(): Promise<boolean> {
      return winkel.automatischAfboeken;
    },

    /** Terug naar de beginvoorraad uit de seed. */
    async reset(door?: Rol): Promise<void> {
      for (const product of winkel.producten) {
        const start = VOORRAAD_SEED.find((rij) => rij.id === product.id);
        if (start && product.stock !== start.stock) {
          boekIn(
            product,
            rond(start.stock - product.stock),
            "correctie",
            "Beginvoorraad hersteld",
            door
          );
        }
      }

      // Openstaande aanvragen horen bij de oude stand en vervallen daarom.
      winkel.aanvragen = [];
    },
  };
}
