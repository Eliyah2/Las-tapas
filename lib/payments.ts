// Betaalmodule van Las Tapas, met de betaalsessies in Supabase.
//
// Bewuste ontwerpkeuzes (en die leg je zo ook in je examenportfolio uit):
// 1. Het te betalen bedrag wordt ALTIJD door de server berekend: bij all you can
//    eat is dat het aantal personen van de tafelsessie × het vaste tarief. De
//    browser kan dus nooit een bedrag meesturen. (Zelfde principe als de
//    prijzen in de bestel-API: never trust the client.)
// 2. Geen echte betaaldienst en geen account: dit is een veilige simulatie.
//    Kaartgegevens worden alleen gecontroleerd en daarna weggegooid; van het
//    kaartnummer blijft uitsluitend de laatste vier cijfers over voor het
//    bonnetje. Er is dus ook niets dat gelekt kan worden (AVG-vriendelijk).
// 3. Betalingen lopen via sessies: één open sessie per tafel, met de status
//    open of betaald. Dat is ook in de database afgedwongen met een unieke
//    index op (tafelnummer) waar status = 'open' (zie supabase/schema.sql).

import { DUUR_MINUTEN, TARIEF_PER_PERSOON, tafelStore } from "@/lib/tafel";
import { db, dbFout } from "@/lib/supabase";

/**
 * Gegevens die op het bonnetje horen. Vervang de voorbeeldwaarden door de
 * echte gegevens van het restaurant (naam, adres, KvK- en btw-nummer).
 */
export const RESTAURANT = {
  naam: "Las Tapas",
  straat: "Calle de la Tapa 12",
  plaats: "1011 AB Amsterdam",
  kvk: "12345678",
  btwNummer: "NL123456789B01",
} as const;

export type BetaalStatus = "open" | "betaald";

export type BetaalSessie = {
  id: string;
  table: string;
  /** Aantal personen waarop deze rekening is gebaseerd. */
  personen: number;
  bedrag: number; // door de server berekend, in euro's
  status: BetaalStatus;
  createdAt: number;
  betaaldOp?: number;
  laatsteVier?: string;
};

export type KaartGegevens = {
  nummer: string;
  houder: string;
  vervalt: string; // MM/JJ
  cvc: string;
};

/** Testkaart die standaard wordt geweigerd, net als bij echte betaaldiensten. */
const GEWEIGERDE_KAART = "4000000000000002";

const VELDEN =
  "id, table_number, personen, amount, status, created_at, paid_at, last_four";

type SessieRij = {
  id: string;
  table_number: string;
  personen: number | null;
  amount: number | string;
  status: BetaalStatus;
  created_at: string;
  paid_at: string | null;
  last_four: string | null;
};

function naarSessie(rij: SessieRij): BetaalSessie {
  return {
    id: rij.id,
    table: rij.table_number,
    personen: Number(rij.personen ?? 0),
    bedrag: Number(rij.amount),
    status: rij.status,
    createdAt: Date.parse(rij.created_at),
    betaaldOp: rij.paid_at ? Date.parse(rij.paid_at) : undefined,
    laatsteVier: rij.last_four ?? undefined,
  };
}

async function haalSessie(id: string): Promise<BetaalSessie | undefined> {
  const { data, error } = await db()
    .from("payment_sessions")
    .select(VELDEN)
    .eq("id", id)
    .maybeSingle();

  if (error) throw dbFout("Betaalsessie ophalen", error);
  return data ? naarSessie(data as unknown as SessieRij) : undefined;
}

/**
 * Nieuwste sessie van een tafel, optioneel alleen de nog openstaande.
 * Tafelnummers worden hoofdletterongevoelig vergeleken, net als bij het
 * berekenen van de rekening.
 */
async function sessieVoorTafel(
  table: string,
  alleenOpen: boolean
): Promise<BetaalSessie | undefined> {
  let query = db()
    .from("payment_sessions")
    .select(VELDEN)
    .ilike("table_number", table.trim());

  if (alleenOpen) query = query.eq("status", "open");

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw dbFout("Betaalsessie van de tafel ophalen", error);
  return data ? naarSessie(data as unknown as SessieRij) : undefined;
}

/** Controleer kaartgegevens zonder ze op te slaan. */
export function controleerKaart(
  kaart: KaartGegevens
): { gelukt: boolean; fout?: string; laatsteVier?: string } {
  const nummer = kaart.nummer.replace(/\s+/g, "");

  if (!/^\d{16}$/.test(nummer)) {
    return { gelukt: false, fout: "Het kaartnummer moet 16 cijfers zijn." };
  }
  if (nummer === GEWEIGERDE_KAART) {
    return { gelukt: false, fout: "De kaart is geweigerd door de bank." };
  }
  if (!kaart.houder.trim()) {
    return { gelukt: false, fout: "Vul de naam op de kaart in." };
  }

  const match = /^(\d{2})\/(\d{2})$/.exec(kaart.vervalt.trim());
  if (!match) {
    return { gelukt: false, fout: "De vervaldatum moet de vorm MM/JJ hebben." };
  }
  const maand = Number(match[1]);
  const jaar = 2000 + Number(match[2]);
  const nu = new Date();
  if (maand < 1 || maand > 12) {
    return { gelukt: false, fout: "De maand van de vervaldatum bestaat niet." };
  }
  if (
    jaar < nu.getFullYear() ||
    (jaar === nu.getFullYear() && maand < nu.getMonth() + 1)
  ) {
    return { gelukt: false, fout: "Deze kaart is verlopen." };
  }

  if (!/^\d{3,4}$/.test(kaart.cvc.trim())) {
    return { gelukt: false, fout: "De CVC-code bestaat uit 3 of 4 cijfers." };
  }

  return { gelukt: true, laatsteVier: nummer.slice(-4) };
}

/* ==========================================================================
   Bonnetje
   ========================================================================== */

/**
 * Eén regel op het bonnetje. Bij all you can eat is dat het tarief per persoon
 * en niet een los gerecht: de keuken serveert onbeperkt voor één prijs.
 */
export type Bonregel = {
  omschrijving: string;
  aantal: number;
  stukprijs: number;
  bedrag: number; // inclusief btw
};

/** Btw-specificatie per tarief, zoals op een kassabon. */
export type BtwRegel = {
  tarief: number; // 0.09 of 0.21
  grondslag: number; // bedrag exclusief btw
  btw: number;
};

export type Bonnetje = {
  nummer: string;
  restaurant: typeof RESTAURANT;
  tafel: string;
  /** Met hoeveel personen er is gegeten: daarop is de rekening gebaseerd. */
  personen: number;
  betaaldOp?: number;
  laatsteVier?: string;
  regels: Bonregel[];
  btw: BtwRegel[];
  totaal: number; // inclusief btw
  totaalExclusief: number;
};

/** Bedragen afronden op eurocenten. */
function afronden(bedrag: number): number {
  return Math.round(bedrag * 100) / 100;
}

/** De rekening van een tafel: het aantal personen × het vaste tarief. */
function rekeningBedrag(
  table: string,
  terugvalPersonen = 0
): { personen: number; bedrag: number } {
  const tafelSessie = tafelStore().get(table);
  // Loopt de tafel niet meer (server opnieuw gestart, of de gasten zijn al
  // afgerekend), dan houden we het aantal personen van de sessie aan.
  const personen = tafelSessie ? tafelSessie.personen : terugvalPersonen;
  return {
    personen,
    bedrag: afronden(personen * TARIEF_PER_PERSOON),
  };
}

/**
 * Bouwt het bonnetje van een betaalde sessie. Er staat één regel op: het
 * all-you-can-eat-tarief per persoon voor de afgesproken eetperiode. De btw
 * wordt eruit gehaald, want de tarieven zijn inclusief btw.
 */
function bonnetjeVan(sessie: BetaalSessie): Bonnetje {
  const personen = Math.max(sessie.personen, 0);
  const stukprijs = TARIEF_PER_PERSOON;
  const bedrag = afronden(personen * stukprijs);

  // Eten en frisdrank vallen onder het lage tarief. Zit er alcohol in het
  // arrangement, splits het bedrag dan over 9% en 21% (zie btwTarief per gerecht).
  const tarief = 0.09;
  const grondslag = bedrag / (1 + tarief);

  return {
    nummer: sessie.id.slice(0, 8).toUpperCase(),
    restaurant: RESTAURANT,
    tafel: sessie.table,
    personen,
    betaaldOp: sessie.betaaldOp,
    laatsteVier: sessie.laatsteVier,
    regels: [
      {
        omschrijving: `All you can eat tapas · ${(DUUR_MINUTEN / 60)
          .toString()
          .replace(".", ",")} uur onbeperkt`,
        aantal: personen,
        stukprijs,
        bedrag,
      },
    ],
    btw: [
      {
        tarief,
        grondslag: afronden(grondslag),
        btw: afronden(bedrag - grondslag),
      },
    ],
    totaal: bedrag,
    totaalExclusief: afronden(grondslag),
  };
}

/** Het bonnetje van een betaalsessie; nog geen bon zolang er niet betaald is. */
export function bonnetjeVoor(sessie: BetaalSessie): Bonnetje | undefined {
  if (sessie.status !== "betaald") return undefined;
  return bonnetjeVan(sessie);
}

export function paymentStore() {
  return {
    async list(): Promise<BetaalSessie[]> {
      const { data, error } = await db()
        .from("payment_sessions")
        .select(VELDEN)
        .order("created_at", { ascending: false });

      if (error) throw dbFout("Betaalsessies ophalen", error);
      return (data as unknown as SessieRij[]).map(naarSessie);
    },

    async get(id: string): Promise<BetaalSessie | undefined> {
      return haalSessie(id);
    },

    /** Nieuwste sessie van een tafel (open of betaald). */
    async laatsteVoorTafel(table: string): Promise<BetaalSessie | undefined> {
      return sessieVoorTafel(table, false);
    },

    /** Open (nog niet betaalde) sessie van een tafel, als die er is. */
    async openVoorTafel(table: string): Promise<BetaalSessie | undefined> {
      return sessieVoorTafel(table, true);
    },

    /** Start (of hervat) de afrekening van een tafel met een vers bedrag. */
    async start(table: string): Promise<BetaalSessie> {
      const tafel = table.trim();
      const bestaand = await sessieVoorTafel(tafel, true);
      const { personen, bedrag } = rekeningBedrag(tafel);

      if (bestaand) {
        // Er kan intussen iemand bijgekomen zijn: het bedrag wordt vers berekend.
        const { data, error } = await db()
          .from("payment_sessions")
          .update({ amount: bedrag, personen })
          .eq("id", bestaand.id)
          .select(VELDEN)
          .single();

        if (error) throw dbFout("Betaalsessie bijwerken", error);
        return naarSessie(data as unknown as SessieRij);
      }

      const { data, error } = await db()
        .from("payment_sessions")
        .insert({ table_number: tafel, amount: bedrag, personen, status: "open" })
        .select(VELDEN)
        .single();

      if (error) throw dbFout("Betaalsessie starten", error);
      return naarSessie(data as unknown as SessieRij);
    },

    /** Verwerk de betaling van een open sessie. */
    async betaal(
      id: string,
      kaart: KaartGegevens
    ): Promise<{ sessie?: BetaalSessie; fout?: string }> {
      const sessie = await haalSessie(id);
      if (!sessie) return { fout: "Betaalsessie niet gevonden." };
      if (sessie.status === "betaald") {
        return { fout: "Deze tafel is al afgerekend." };
      }

      const check = controleerKaart(kaart);
      if (!check.gelukt) return { fout: check.fout };

      // Bedrag opnieuw berekenen op het moment van betalen: de gast betaalt
      // altijd het tarief voor het aantal personen dat aan tafel zit, nooit een
      // bedrag uit de browser.
      const { personen, bedrag } = rekeningBedrag(sessie.table, sessie.personen);

      // De update geldt alleen voor een sessie die nog open is. Twee keer
      // tegelijk op "betalen" drukken levert dus nooit twee betalingen op: de
      // tweede krijgt geen rij terug en dezelfde melding als een dubbele klik.
      const { data, error } = await db()
        .from("payment_sessions")
        .update({
          amount: bedrag,
          personen,
          status: "betaald",
          paid_at: new Date().toISOString(),
          last_four: check.laatsteVier,
        })
        .eq("id", id)
        .eq("status", "open")
        .select(VELDEN)
        .maybeSingle();

      if (error) throw dbFout("Betaling verwerken", error);
      if (!data) return { fout: "Deze tafel is al afgerekend." };

      // De tafel is klaar: de volgende gasten beginnen met een verse eetperiode.
      tafelStore().stop(sessie.table);

      return { sessie: naarSessie(data as unknown as SessieRij) };
    },
  };
}
