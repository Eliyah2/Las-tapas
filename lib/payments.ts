// Betaalmodule van Las Tapas, nu met de betaalsessies in Supabase.
//
// Bewuste ontwerpkeuzes (en die leg je zo ook in je examenportfolio uit):
// 1. Het te betalen bedrag wordt ALTIJD door de server berekend uit de
//    bestellingen van de tafel; de browser kan nooit een bedrag meesturen.
//    (Zelfde principe als de prijzen in de bestel-API: never trust the client.)
// 2. Geen echte betaaldienst en geen account: dit is een veilige simulatie.
//    Kaartgegevens worden alleen gecontroleerd en daarna weggegooid; van het
//    kaartnummer blijft uitsluitend de laatste vier cijfers over voor het
//    bonnetje. Er is dus ook niets dat gelekt kan worden (AVG-vriendelijk).
// 3. Betalingen lopen via sessies: één open sessie per tafel, met de status
//    open of betaald. Dat is ook in de database afgedwongen met een unieke
//    index op (tafelnummer) waar status = 'open' (zie supabase/schema.sql).

import { ordersVoorTafel, type Order } from "@/lib/orders";
import { db, dbFout } from "@/lib/supabase";

export type BetaalStatus = "open" | "betaald";

export type BetaalSessie = {
  id: string;
  table: string;
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

const VELDEN = "id, table_number, amount, status, created_at, paid_at, last_four";

type SessieRij = {
  id: string;
  table_number: string;
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

/** Totaal van alle bestellingen van één tafel, opnieuw berekend door de server. */
export async function totaalPerTafel(
  table: string
): Promise<{ orders: Order[]; totaal: number }> {
  const orders = await ordersVoorTafel(table);
  const totaal = orders.reduce(
    (som, order) =>
      som + order.items.reduce((s, i) => s + i.price * i.quantity, 0),
    0
  );
  return { orders, totaal };
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
      const { totaal } = await totaalPerTafel(tafel);

      if (bestaand) {
        // Er kan intussen nageserveerd zijn: het bedrag wordt vers berekend.
        const { data, error } = await db()
          .from("payment_sessions")
          .update({ amount: totaal })
          .eq("id", bestaand.id)
          .select(VELDEN)
          .single();

        if (error) throw dbFout("Betaalsessie bijwerken", error);
        return naarSessie(data as unknown as SessieRij);
      }

      const { data, error } = await db()
        .from("payment_sessions")
        .insert({ table_number: tafel, amount: totaal, status: "open" })
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
      // altijd de actuele rekening, nooit een bedrag uit de browser.
      const { totaal } = await totaalPerTafel(sessie.table);

      // De update geldt alleen voor een sessie die nog open is. Twee keer
      // tegelijk op "betalen" drukken levert dus nooit twee betalingen op: de
      // tweede krijgt geen rij terug en dezelfde melding als een dubbele klik.
      const { data, error } = await db()
        .from("payment_sessions")
        .update({
          amount: totaal,
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

      return { sessie: naarSessie(data as unknown as SessieRij) };
    },
  };
}
