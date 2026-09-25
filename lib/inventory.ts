// Voorraadstore met opslag in Supabase (PostgreSQL).
//
// Wat er in de database staat: de producten (ingredients), elke mutatie
// (stock_movements), de aanvragen voor grote uitgiftes (stock_requests) en de
// twee instellingen (app_settings). Het schema staat in supabase/schema.sql.
//
// De recepten en de beginvoorraad blijven in lib/voorraad-seed.ts staan: dat is
// vaste bedrijfsinformatie die bij de menukaart hoort (lib/menu.ts), niet iets
// wat je tijdens het bedienen aanpast. De database bewaart wel de aantallen.
//
// Alle methodes zijn async geworden en er is geen in-memory pub/sub meer: de
// schermen worden via de SSE-routes bijgewerkt door de database te pollen
// (zie app/api/voorraad/stream/route.ts).

import { db, dbFout } from "@/lib/supabase";
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

const MAX_MUTATIES_IN_BEELD = 40;

const EENHEDEN: Unit[] = ["gram", "ml", "stuk"];

type IngredientRij = {
  id: string;
  name: string;
  unit: Unit;
  stock: number | string;
  par_level: number | string;
  cost_per_unit: number | string;
  supplier: string | null;
  updated_at: string;
};

type MovementRij = {
  id: string;
  ingredient_id: string;
  name: string;
  delta: number | string;
  reason: MovementReason;
  note: string | null;
  performed_by: Rol | null;
  created_at: string;
};

type AanvraagRij = {
  id: string;
  ingredient_id: string;
  name: string;
  unit: Unit;
  amount: number | string;
  estimated_value: number | string;
  note: string | null;
  requested_by: Rol;
  status: Aanvraag["status"];
  created_at: string;
  handled_by: Rol | null;
  handled_at: string | null;
  reason: string | null;
};

const INGREDIENT_VELDEN =
  "id, name, unit, stock, par_level, cost_per_unit, supplier, updated_at";
const MOVEMENT_VELDEN =
  "id, ingredient_id, name, delta, reason, note, performed_by, created_at";
const AANVRAAG_VELDEN =
  "id, ingredient_id, name, unit, amount, estimated_value, note, " +
  "requested_by, status, created_at, handled_by, handled_at, reason";

function naarProduct(rij: IngredientRij): Product {
  return {
    id: rij.id,
    name: rij.name,
    unit: rij.unit,
    stock: Number(rij.stock),
    parLevel: Number(rij.par_level),
    costPerUnit: Number(rij.cost_per_unit),
    supplier: rij.supplier ?? undefined,
    updatedAt: Date.parse(rij.updated_at),
  };
}

function naarMovement(rij: MovementRij): Movement {
  return {
    id: rij.id,
    ingredientId: rij.ingredient_id,
    name: rij.name,
    delta: Number(rij.delta),
    reason: rij.reason,
    note: rij.note ?? undefined,
    door: rij.performed_by ?? undefined,
    createdAt: Date.parse(rij.created_at),
  };
}

function naarAanvraag(rij: AanvraagRij): Aanvraag {
  return {
    id: rij.id,
    ingredientId: rij.ingredient_id,
    name: rij.name,
    unit: rij.unit,
    amount: Number(rij.amount),
    waarde: Number(rij.estimated_value),
    note: rij.note ?? undefined,
    aangevraagdDoor: rij.requested_by,
    status: rij.status,
    createdAt: Date.parse(rij.created_at),
    behandeldDoor: rij.handled_by ?? undefined,
    behandeldOp: rij.handled_at ? Date.parse(rij.handled_at) : undefined,
    reden: rij.reason ?? undefined,
  };
}

// --- Lezen -------------------------------------------------------------------

async function haalProducten(): Promise<Product[]> {
  const { data, error } = await db()
    .from("ingredients")
    .select(INGREDIENT_VELDEN)
    .order("name");

  if (error) throw dbFout("Voorraad ophalen", error);
  return (data as unknown as IngredientRij[]).map(naarProduct);
}

async function haalProduct(id: string): Promise<Product | undefined> {
  const { data, error } = await db()
    .from("ingredients")
    .select(INGREDIENT_VELDEN)
    .eq("id", id)
    .maybeSingle();

  if (error) throw dbFout("Product ophalen", error);
  return data ? naarProduct(data as unknown as IngredientRij) : undefined;
}

async function haalMutaties(limiet = MAX_MUTATIES_IN_BEELD): Promise<Movement[]> {
  const { data, error } = await db()
    .from("stock_movements")
    .select(MOVEMENT_VELDEN)
    .order("created_at", { ascending: false })
    .limit(limiet);

  if (error) throw dbFout("Mutaties ophalen", error);
  return (data as unknown as MovementRij[]).map(naarMovement);
}

/** Hoeveel mutaties er vandaag geboekt zijn (telt, haalt geen rijen op). */
async function telMutatiesVandaag(): Promise<number> {
  const begin = new Date();
  begin.setHours(0, 0, 0, 0);

  const { count, error } = await db()
    .from("stock_movements")
    .select("id", { count: "exact", head: true })
    .gte("created_at", begin.toISOString());

  if (error) throw dbFout("Mutaties van vandaag tellen", error);
  return count ?? 0;
}

async function haalAanvragen(): Promise<Aanvraag[]> {
  const { data, error } = await db()
    .from("stock_requests")
    .select(AANVRAAG_VELDEN)
    .order("created_at", { ascending: false });

  if (error) throw dbFout("Aanvragen ophalen", error);
  return (data as unknown as AanvraagRij[]).map(naarAanvraag);
}

async function haalAanvraag(id: string): Promise<Aanvraag | undefined> {
  const { data, error } = await db()
    .from("stock_requests")
    .select(AANVRAAG_VELDEN)
    .eq("id", id)
    .maybeSingle();

  if (error) throw dbFout("Aanvraag ophalen", error);
  return data ? naarAanvraag(data as unknown as AanvraagRij) : undefined;
}

type Instellingen = { automatischAfboeken: boolean; goedkeuringsdrempel: number };

async function haalInstellingen(): Promise<Instellingen> {
  const { data, error } = await db()
    .from("app_settings")
    .select("auto_stock_deduction, approval_threshold")
    .eq("id", true)
    .maybeSingle();

  if (error) throw dbFout("Instellingen ophalen", error);

  // Ontbreekt de rij (bijvoorbeeld na een handmatige wipe), dan gelden de
  // standaardwaarden uit de code in plaats van een crash.
  if (!data) {
    return {
      automatischAfboeken: true,
      goedkeuringsdrempel: STANDAARD_DREMPEL,
    };
  }

  const rij = data as {
    auto_stock_deduction: boolean;
    approval_threshold: number | string;
  };
  return {
    automatischAfboeken: rij.auto_stock_deduction,
    goedkeuringsdrempel: Number(rij.approval_threshold),
  };
}

async function zetInstellingen(patch: Partial<{
  auto_stock_deduction: boolean;
  approval_threshold: number;
}>): Promise<void> {
  // Upsert op de vaste sleutel: zo werkt dit ook als de rij ooit verdwenen is.
  const { error } = await db()
    .from("app_settings")
    .upsert({ id: true, ...patch }, { onConflict: "id" });

  if (error) throw dbFout("Instellingen opslaan", error);
}

/** Nieuwste wijzigingsmoment van de producten, voor "bijgewerkt om ...". */
function laatsteWijziging(producten: Product[]): number {
  const tijden = producten
    .map((product) => product.updatedAt ?? 0)
    .filter((tijd) => tijd > 0);
  return tijden.length > 0 ? Math.max(...tijden) : Date.now();
}

// --- Schrijven ---------------------------------------------------------------

async function zetVoorraad(id: string, waarde: number): Promise<void> {
  // updated_at wordt door de database zelf bijgehouden (trigger).
  const { error } = await db()
    .from("ingredients")
    .update({ stock: rond(waarde) })
    .eq("id", id);

  if (error) throw dbFout("Voorraad bijwerken", error);
}

async function voegMutatieToe(
  product: Product,
  delta: number,
  reason: MovementReason,
  note?: string,
  door?: Rol
): Promise<Movement> {
  const { data, error } = await db()
    .from("stock_movements")
    .insert({
      ingredient_id: product.id,
      // De naam gaat mee als momentopname: een mutatie is geschiedenis en mag
      // niet veranderen als het product later hernoemd wordt.
      name: product.name,
      delta: rond(delta),
      reason,
      note: note?.trim() || null,
      performed_by: door ?? null,
    })
    .select(MOVEMENT_VELDEN)
    .single();

  if (error) throw dbFout("Mutatie boeken", error);
  return naarMovement(data as unknown as MovementRij);
}

/**
 * Voorraad bijstellen én de mutatie vastleggen. De delta die in het log komt is
 * de gevraagde delta; gaat de voorraad daardoor onder nul, dan stopt hij op nul
 * (er kan niet meer uit dan er is), net als voorheen.
 */
async function boekIngredient(
  product: Product,
  delta: number,
  reason: MovementReason,
  note?: string,
  door?: Rol
): Promise<Movement> {
  const werkelijk = rond(delta);
  await zetVoorraad(product.id, Math.max(0, product.stock + werkelijk));
  return voegMutatieToe(product, werkelijk, reason, note, door);
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

export function voorraadStore() {
  return {
    async overzicht(): Promise<VoorraadOverzicht> {
      const [producten, mutaties, aanvragen, instellingen, mutatiesVandaag] =
        await Promise.all([
          haalProducten(),
          haalMutaties(MAX_MUTATIES_IN_BEELD),
          haalAanvragen(),
          haalInstellingen(),
          telMutatiesVandaag(),
        ]);

      const recepten = RECEPTEN_SEED;
      const status = berekenStatus(recepten, producten);

      return {
        producten,
        mutaties,
        recepten,
        status,
        samenvatting: {
          ...maakSamenvatting(producten, mutaties, status),
          // Uit een telquery, niet uit de laatste 40 mutaties die in beeld staan.
          mutatiesVandaag,
        },
        // De voorraad staat nu in een database, dus altijd bewaard.
        persistent: true,
        automatischAfboeken: instellingen.automatischAfboeken,
        goedkeuringsdrempel: instellingen.goedkeuringsdrempel,
        aanvragen,
        bijgewerkt: laatsteWijziging(producten),
      };
    },

    async producten(): Promise<Product[]> {
      return haalProducten();
    },

    async recepten(): Promise<Recipe[]> {
      return RECEPTEN_SEED;
    },

    /** Beschikbaarheid per gerecht, gebruikt door de menukaart. */
    async beschikbaarheid() {
      const [producten, mutaties, mutatiesVandaag] = await Promise.all([
        haalProducten(),
        haalMutaties(MAX_MUTATIES_IN_BEELD),
        telMutatiesVandaag(),
      ]);

      const status = berekenStatus(RECEPTEN_SEED, producten);

      return {
        status,
        persistent: true,
        bijgewerkt: laatsteWijziging(producten),
        samenvatting: {
          ...maakSamenvatting(producten, mutaties, status),
          mutatiesVandaag,
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

      const bestaande = (await haalProducten()).map((product) => product.id);
      const stock = Math.max(0, Number(input.stock) || 0);

      const { data, error } = await db()
        .from("ingredients")
        .insert({
          id: maakSlug(naam, bestaande),
          name: naam,
          unit: input.unit,
          stock,
          par_level: Math.max(0, Number(input.parLevel) || 0),
          cost_per_unit: Math.max(0, Number(input.costPerUnit) || 0),
          supplier: input.supplier?.trim() || null,
        })
        .select(INGREDIENT_VELDEN)
        .single();

      if (error) throw dbFout("Product toevoegen", error);
      const product = naarProduct(data as unknown as IngredientRij);

      if (stock > 0) {
        await voegMutatieToe(product, stock, "levering", "Beginsaldo nieuw product");
      } else {
        await voegMutatieToe(product, 0, "correctie", "Product toegevoegd");
      }

      return product;
    },

    async werkProductBij(
      id: string,
      patch: Partial<
        Pick<Product, "name" | "unit" | "parLevel" | "costPerUnit" | "supplier">
      >
    ): Promise<Product | undefined> {
      const wijziging: Record<string, unknown> = {};

      if (typeof patch.name === "string" && patch.name.trim().length >= 2) {
        wijziging.name = patch.name.trim();
      }
      if (patch.unit && EENHEDEN.includes(patch.unit)) {
        wijziging.unit = patch.unit;
      }
      if (Number.isFinite(patch.parLevel)) {
        wijziging.par_level = Math.max(0, Number(patch.parLevel));
      }
      if (Number.isFinite(patch.costPerUnit)) {
        wijziging.cost_per_unit = Math.max(0, Number(patch.costPerUnit));
      }
      if (typeof patch.supplier === "string") {
        wijziging.supplier = patch.supplier.trim() || null;
      }

      if (Object.keys(wijziging).length === 0) return haalProduct(id);

      const { data, error } = await db()
        .from("ingredients")
        .update(wijziging)
        .eq("id", id)
        .select(INGREDIENT_VELDEN)
        .maybeSingle();

      if (error) throw dbFout("Product bijwerken", error);
      return data ? naarProduct(data as unknown as IngredientRij) : undefined;
    },

    /**
     * Product van de lijst halen.
     *
     * Let op: de mutaties van dit product verdwijnen mee. De database ruimi die
     * op via `on delete cascade` (zie supabase/schema.sql). Wil je de historie
     * bewaren, dan is een kolom als `verwijderd_op` (soft delete) nodig in
     * plaats van een echte delete.
     */
    async verwijderProduct(id: string): Promise<boolean> {
      const { data, error } = await db()
        .from("ingredients")
        .delete()
        .eq("id", id)
        .select("id");

      if (error) throw dbFout("Product verwijderen", error);
      return (data?.length ?? 0) > 0;
    },

    /**
     * Eén mutatie boeken. Geef `delta` mee voor levering of verlies, of `naar`
     * voor een telling (correctie naar een nieuw aantal).
     */
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
      const product = await haalProduct(id);
      if (!product) return undefined;

      const delta = Number.isFinite(invoer.naar)
        ? rond(Number(invoer.naar) - product.stock)
        : rond(Number(invoer.delta) || 0);

      return boekIngredient(product, delta, invoer.reason, invoer.note, door);
    },

    /**
     * De keuken pakt iets uit de voorraad. Is de waarde hoger dan de
     * goedkeuringsdrempel, dan wordt er niets afgeboekt maar gaat er een
     * aanvraag naar de hoofdchef.
     */
    async pak(
      id: string,
      invoer: { amount: number; note?: string; door: Rol }
    ): Promise<
      | { ok: true; soort: "direct"; waarde: number; movement: Movement }
      | { ok: true; soort: "aanvraag"; waarde: number; aanvraag: Aanvraag }
      | { ok: false; fout: string }
    > {
      const product = await haalProduct(id);
      if (!product) return { ok: false, fout: "Product niet gevonden" };

      const amount = rond(Number(invoer.amount));
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, fout: "Vul een hoeveelheid groter dan nul in" };
      }
      if (product.stock < amount) {
        return { ok: false, fout: `Er is maar ${rond(product.stock)} in huis` };
      }

      const waarde = waardeVan(amount, product);
      const { goedkeuringsdrempel } = await haalInstellingen();

      if (!moetGoedgekeurdWorden(waarde, goedkeuringsdrempel)) {
        const movement = await boekIngredient(
          product,
          -amount,
          "uitgifte",
          invoer.note,
          invoer.door
        );
        return { ok: true, soort: "direct", waarde, movement };
      }

      const { data, error } = await db()
        .from("stock_requests")
        .insert({
          ingredient_id: product.id,
          name: product.name,
          unit: product.unit,
          amount,
          estimated_value: waarde,
          note: invoer.note?.trim() || null,
          requested_by: invoer.door,
          status: "open",
        })
        .select(AANVRAAG_VELDEN)
        .single();

      if (error) throw dbFout("Aanvraag opslaan", error);
      return {
        ok: true,
        soort: "aanvraag",
        waarde,
        aanvraag: naarAanvraag(data as unknown as AanvraagRij),
      };
    },

    /** De hoofdchef keurt een aanvraag goed; dan wordt de uitgifte geboekt. */
    async keurAanvraagGoed(
      aanvraagId: string,
      door: Rol
    ): Promise<{ ok: boolean; fout?: string; movement?: Movement }> {
      if (door !== "hoofdchef") {
        return { ok: false, fout: "Alleen de hoofdchef kan goedkeuren" };
      }

      const aanvraag = await haalAanvraag(aanvraagId);
      if (!aanvraag) return { ok: false, fout: "Aanvraag niet gevonden" };
      if (aanvraag.status !== "open") {
        return { ok: false, fout: "Deze aanvraag is al behandeld" };
      }

      const product = await haalProduct(aanvraag.ingredientId);
      if (!product) return { ok: false, fout: "Product niet gevonden" };
      if (product.stock < aanvraag.amount) {
        return { ok: false, fout: "Er is inmiddels niet genoeg voorraad meer" };
      }

      const movement = await boekIngredient(
        product,
        -aanvraag.amount,
        "uitgifte",
        [aanvraag.note, `aangevraagd door de ${aanvraag.aangevraagdDoor}`]
          .filter(Boolean)
          .join(" · "),
        door
      );

      const { error } = await db()
        .from("stock_requests")
        .update({
          status: "goedgekeurd",
          handled_by: door,
          handled_at: new Date().toISOString(),
        })
        .eq("id", aanvraagId);

      if (error) throw dbFout("Aanvraag goedkeuren", error);
      return { ok: true, movement };
    },

    /** De hoofdchef wijst een aanvraag af; er verandert niets aan de voorraad. */
    async wijsAanvraagAf(
      aanvraagId: string,
      door: Rol,
      reden?: string
    ): Promise<{ ok: boolean; fout?: string }> {
      if (door !== "hoofdchef") {
        return { ok: false, fout: "Alleen de hoofdchef kan een aanvraag afwijzen" };
      }

      const aanvraag = await haalAanvraag(aanvraagId);
      if (!aanvraag) return { ok: false, fout: "Aanvraag niet gevonden" };
      if (aanvraag.status !== "open") {
        return { ok: false, fout: "Deze aanvraag is al behandeld" };
      }

      const { error } = await db()
        .from("stock_requests")
        .update({
          status: "afgewezen",
          handled_by: door,
          handled_at: new Date().toISOString(),
          reason: reden?.trim() || null,
        })
        .eq("id", aanvraagId);

      if (error) throw dbFout("Aanvraag afwijzen", error);
      return { ok: true };
    },

    /** Goedkeuringsdrempel in euro's; 0 betekent: geen goedkeuring nodig. */
    async zetGoedkeuringsdrempel(waarde: number): Promise<number> {
      const drempel = Math.max(0, rond(Number(waarde) || 0));
      await zetInstellingen({ approval_threshold: drempel });
      return drempel;
    },

    /** Alles wat onder het par-niveau zit in één keer bijvullen (levering). */
    async vulAanTotPar(ids?: string[], door?: Rol): Promise<Movement[]> {
      const producten = await haalProducten();
      const gedaan: Movement[] = [];

      for (const product of producten) {
        if (ids && !ids.includes(product.id)) continue;
        if (product.stock >= product.parLevel) continue;
        gedaan.push(
          await boekIngredient(
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

    /**
     * Controleert (en boekt) een bestelling af op basis van de recepten.
     * Alles of niets. Met `boeken: false` wordt er alleen gekeken of het kan,
     * wat gebruikt wordt als de keuken zelf haar uitgiftes registreert.
     */
    async verbruik(
      items: { id: string; quantity: number }[],
      tabel?: string,
      boeken = true
    ): Promise<{ gelukt: boolean; tekorten: Tekort[]; mutaties: Movement[] }> {
      const producten = await haalProducten();
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
        const product = producten.find((p) => p.id === ingredientId);
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
        const product = producten.find((p) => p.id === ingredientId);
        if (!product || nodig === 0) continue;
        geboekt.push(
          await boekIngredient(product, -nodig, "verbruik", notitie)
        );
      }

      return { gelukt: true, tekorten: [], mutaties: geboekt };
    },

    /** Aanzetten of uitzetten van automatisch afboeken bij bestellingen. */
    async zetAutomatischAfboeken(waarde: boolean): Promise<boolean> {
      await zetInstellingen({ auto_stock_deduction: waarde });
      return waarde;
    },

    /** Rekent de app bestellingen automatisch af? */
    async rekentAutomatischAf(): Promise<boolean> {
      const { automatischAfboeken } = await haalInstellingen();
      return automatischAfboeken;
    },

    /** Zet de voorraad terug naar de beginvoorraad uit de seed. */
    async reset(door?: Rol): Promise<void> {
      const producten = await haalProducten();

      for (const product of producten) {
        const start = VOORRAAD_SEED.find((p) => p.id === product.id);
        if (start && product.stock !== start.stock) {
          await boekIngredient(
            product,
            rond(start.stock - product.stock),
            "correctie",
            "Beginvoorraad hersteld",
            door
          );
        }
      }

      // Openstaande aanvragen horen bij de oude stand en vervallen daarom.
      const { error } = await db()
        .from("stock_requests")
        .delete()
        .gte("created_at", "1970-01-01T00:00:00Z");

      if (error) throw dbFout("Aanvragen opruimen", error);
    },
  };
}
