/**
 * Types en rekenwerk voor het voorraadsysteem.
 *
 * Dit bestand bevat géén Node-code, zodat het ook in de browser gebruikt kan
 * worden (menukaart, voorraadscherm). De opslag staat in `lib/inventory.ts`.
 */

export type Unit = "gram" | "ml" | "stuk";

/**
 * Wie werkt er in het systeem? Zonder inlog (dat vraagt een account) kiest de
 * gebruiker zijn rol. De rol bepaalt wat je mag: een kok mag pakken, de
 * hoofdchef keurt grote uitgiftes goed, de manager beheert de voorraad.
 */
export type Rol = "kok" | "hoofdchef" | "manager";

export const ROLLEN: Rol[] = ["kok", "hoofdchef", "manager"];

export function isRol(waarde: unknown): waarde is Rol {
  return typeof waarde === "string" && (ROLLEN as string[]).includes(waarde);
}

export const ROL_LABEL: Record<Rol, string> = {
  kok: "Kok",
  hoofdchef: "Hoofdchef",
  manager: "Manager",
};

/** Vanaf welke waarde (in euro's) moet de hoofdchef een uitgifte goedkeuren? */
export const STANDAARD_DREMPEL = 15;

export type Product = {
  id: string;
  name: string;
  unit: Unit;
  /** Huidige voorraad in de eenheid hierboven. */
  stock: number;
  /** Gewenste voorraad: hieronder moet er bijbesteld worden. */
  parLevel: number;
  /** Inkoopprijs per eenheid (dus per gram, per ml of per stuk). */
  costPerUnit: number;
  supplier?: string;
  updatedAt?: number;
};

/**
 * `verbruik` komt automatisch uit een bestelling (via de recepten),
 * `uitgifte` is wat de keuken zelf uit de voorraad pakt.
 */
export type MovementReason =
  | "levering"
  | "verbruik"
  | "uitgifte"
  | "verlies"
  | "correctie";

export type Movement = {
  id: string;
  ingredientId: string;
  name: string;
  /** Positief bij levering, negatief bij verbruik of verlies. */
  delta: number;
  reason: MovementReason;
  note?: string;
  /** Wie de mutatie boekte, zodat er een spoor is wie wat deed. */
  door?: Rol;
  createdAt: number;
};

export type AanvraagStatus = "open" | "goedgekeurd" | "afgewezen";

/** Een uitgifte die te groot is om zonder toestemming te pakken. */
export type Aanvraag = {
  id: string;
  ingredientId: string;
  name: string;
  unit: Unit;
  amount: number;
  /** Waarde in euro's op het moment van aanvragen. */
  waarde: number;
  note?: string;
  /** Wie het pakken aanvroeg. */
  aangevraagdDoor: Rol;
  status: AanvraagStatus;
  createdAt: number;
  behandeldDoor?: Rol;
  behandeldOp?: number;
  /** Reden van afwijzen, zodat de keuken weet waarom. */
  reden?: string;
};

export type RecipeLine = { ingredientId: string; amount: number };
export type Recipe = { menuItemId: string; lines: RecipeLine[] };

export type VoorraadNiveau = "leeg" | "kritiek" | "laag" | "ok";

export type Tekort = {
  ingredientId: string;
  name: string;
  unit: Unit;
  nodig: number;
  aanwezig: number;
};

export type GerechtStatus = {
  menuItemId: string;
  maakbaar: boolean;
  /** Hoeveel porties er nog gemaakt kunnen worden. */
  porties: number;
  tekort: Tekort[];
};

export type VoorraadSamenvatting = {
  waarde: number;
  onderPar: number;
  leeg: number;
  mutatiesVandaag: number;
  uitverkochteGerechten: number;
};

export type VoorraadOverzicht = {
  producten: Product[];
  mutaties: Movement[];
  recepten: Recipe[];
  status: Record<string, GerechtStatus>;
  samenvatting: VoorraadSamenvatting;
  /** Staat de voorraad in een bestand, of alleen in het geheugen? */
  persistent: boolean;
  /**
   * Rekent de app bij elke bestelling automatisch de recepten af? Staat dit uit,
   * dan is de uitgifte van de keuken de enige afboeking (nooit allebei).
   */
  automatischAfboeken: boolean;
  /** Uitgiftes vanaf deze waarde in euro's moeten worden goedgekeurd (0 = uit). */
  goedkeuringsdrempel: number;
  /** Aanvragen voor grote uitgiftes, oud en nieuw. */
  aanvragen: Aanvraag[];
  bijgewerkt: number;
};

/** Waarde van een pak-hoeveelheid, gebruikt voor de goedkeuringsdrempel. */
export function waardeVan(amount: number, product: Product): number {
  return rond(amount * product.costPerUnit);
}

export function moetGoedgekeurdWorden(
  waarde: number,
  drempel: number
): boolean {
  return drempel > 0 && waarde > drempel;
}

/** Rondt af op 3 decimalen, zodat 0.1 + 0.2 geen 0.30000000000000004 wordt. */
export function rond(waarde: number): number {
  return Math.round(waarde * 1000) / 1000;
}

export function voorraadNiveau(product: Product): VoorraadNiveau {
  if (product.stock <= 0) return "leeg";
  if (product.stock < product.parLevel * 0.5) return "kritiek";
  if (product.stock < product.parLevel) return "laag";
  return "ok";
}

export function voorraadWaarde(producten: Product[]): number {
  return rond(
    producten.reduce((som, p) => som + p.stock * p.costPerUnit, 0)
  );
}

/** Hoeveel porties van dit gerecht kunnen er nog gemaakt worden? */
export function portiesMogelijk(recipe: Recipe, producten: Product[]): number {
  if (recipe.lines.length === 0) return Infinity;

  let min = Infinity;
  for (const line of recipe.lines) {
    const product = producten.find((p) => p.id === line.ingredientId);
    if (!product || line.amount <= 0) continue;
    min = Math.min(min, Math.floor(product.stock / line.amount));
  }
  return min === Infinity ? 0 : Math.max(0, min);
}

export function statusVoorGerecht(
  recipe: Recipe,
  producten: Product[]
): GerechtStatus {
  const tekort: Tekort[] = [];

  for (const line of recipe.lines) {
    const product = producten.find((p) => p.id === line.ingredientId);
    if (!product) {
      tekort.push({
        ingredientId: line.ingredientId,
        name: "onbekend ingrediënt",
        unit: "stuk",
        nodig: line.amount,
        aanwezig: 0,
      });
      continue;
    }
    if (product.stock < line.amount) {
      tekort.push({
        ingredientId: product.id,
        name: product.name,
        unit: product.unit,
        nodig: rond(line.amount),
        aanwezig: rond(product.stock),
      });
    }
  }

  const porties = portiesMogelijk(recipe, producten);

  return {
    menuItemId: recipe.menuItemId,
    maakbaar: tekort.length === 0,
    porties: Number.isFinite(porties) ? porties : 0,
    tekort,
  };
}

export function berekenStatus(
  recepten: Recipe[],
  producten: Product[]
): Record<string, GerechtStatus> {
  const status: Record<string, GerechtStatus> = {};
  for (const recipe of recepten) {
    status[recipe.menuItemId] = statusVoorGerecht(recipe, producten);
  }
  return status;
}

/** Waar gebruikt dit ingrediënt? Nodig om de voorraad op gerechten te sorteren. */
export type IngredientGebruik = {
  menuItemId: string;
  /** Hoeveel er per portie van dat gerecht nodig is. */
  amount: number;
};

/**
 * Draait de recepten om: per ingrediënt welke gerechten het gebruiken.
 * Eén ingrediënt kan in meerdere gerechten zitten (knoflook in bijna alles).
 */
export function gebruikPerIngredient(
  recepten: Recipe[]
): Record<string, IngredientGebruik[]> {
  const kaart: Record<string, IngredientGebruik[]> = {};
  for (const recipe of recepten) {
    for (const line of recipe.lines) {
      kaart[line.ingredientId] = [
        ...(kaart[line.ingredientId] ?? []),
        { menuItemId: recipe.menuItemId, amount: line.amount },
      ];
    }
  }
  return kaart;
}

/** De ingrediënten van één gerecht, met de hoeveelheid per portie. */
export function ingredientenVanGerecht(
  recepten: Recipe[],
  menuItemId: string
): Record<string, number> {
  const kaart: Record<string, number> = {};
  const recipe = recepten.find((r) => r.menuItemId === menuItemId);
  for (const line of recipe?.lines ?? []) kaart[line.ingredientId] = line.amount;
  return kaart;
}

export function maakSamenvatting(
  producten: Product[],
  mutaties: Movement[],
  status: Record<string, GerechtStatus>
): VoorraadSamenvatting {
  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);
  const beginVandaag = vandaag.getTime();

  return {
    waarde: voorraadWaarde(producten),
    onderPar: producten.filter((p) => p.stock < p.parLevel).length,
    leeg: producten.filter((p) => p.stock <= 0).length,
    mutatiesVandaag: mutaties.filter((m) => m.createdAt >= beginVandaag).length,
    uitverkochteGerechten: Object.values(status).filter((s) => !s.maakbaar)
      .length,
  };
}
