// Betaalmodule van Las Tapas.
// Bewuste ontwerpkeuzes (en die leg je zo ook in je examenportfolio uit):
// 1. Het te betalen bedrag wordt ALTIJD door de server berekend uit de
//    bestellingen van de tafel; de browser kan nooit een bedrag meesturen.
//    (Zelfde principe als de prijzen in de bestel-API: never trust the client.)
// 2. Geen echte betaaldienst en geen account: dit is een veilige simulatie.
//    Kaartgegevens worden alleen gecontroleerd en daarna weggegooid; van het
//    kaartnummer blijft uitsluitend de laatste vier cijfers over voor het
//    bonnetje. Er is dus ook niets dat gelekt kan worden (AVG-vriendelijk).
// 3. Betalingen lopen via sessies: één open sessie per tafel, met de status
//    open of betaald. Is een tafel betaald en wordt er nageserveerd, dan
//    start de volgende afrekening gewoon een nieuwe sessie.

import { orderStore, type Order } from "@/lib/orders";

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

const sessies: BetaalSessie[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // listener weggevallen? negeer
    }
  }
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
export function totaalPerTafel(table: string): {
  orders: Order[];
  totaal: number;
} {
  const tafel = table.trim().toLowerCase();
  const orders = orderStore()
    .list()
    .filter((o) => o.table.trim().toLowerCase() === tafel)
    .sort((a, b) => a.createdAt - b.createdAt);
  const totaal = orders.reduce(
    (som, o) => som + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
    0
  );
  return { orders, totaal };
}

export function paymentStore() {
  return {
    list(): BetaalSessie[] {
      return [...sessies].sort((a, b) => b.createdAt - a.createdAt);
    },

    get(id: string): BetaalSessie | undefined {
      return sessies.find((s) => s.id === id);
    },

    /** Nieuwste sessie van een tafel (open of betaald). */
    laatsteVoorTafel(table: string): BetaalSessie | undefined {
      const tafel = table.trim().toLowerCase();
      return this.list().find(
        (s) => s.table.trim().toLowerCase() === tafel
      );
    },

    /** Open (nog niet betaalde) sessie van een tafel, als die er is. */
    openVoorTafel(table: string): BetaalSessie | undefined {
      const tafel = table.trim().toLowerCase();
      return this.list().find(
        (s) => s.table.trim().toLowerCase() === tafel && s.status === "open"
      );
    },

    /** Start (of hervat) de afrekening van een tafel met een vers bedrag. */
    start(table: string): BetaalSessie {
      const tafel = table.trim();
      const bestaand = this.openVoorTafel(tafel);
      const { totaal } = totaalPerTafel(tafel);

      if (bestaand) {
        // Er kan intussen nageserveerd zijn: het bedrag wordt vers berekend.
        bestaand.bedrag = totaal;
        notify();
        return bestaand;
      }

      const sessie: BetaalSessie = {
        id: crypto.randomUUID(),
        table: tafel,
        bedrag: totaal,
        status: "open",
        createdAt: Date.now(),
      };
      sessies.push(sessie);
      notify();
      return sessie;
    },

    /** Verwerk de betaling van een open sessie. */
    betaal(
      id: string,
      kaart: KaartGegevens
    ): { sessie?: BetaalSessie; fout?: string } {
      const sessie = sessies.find((s) => s.id === id);
      if (!sessie) return { fout: "Betaalsessie niet gevonden." };
      if (sessie.status === "betaald") {
        return { fout: "Deze tafel is al afgerekend." };
      }

      const check = controleerKaart(kaart);
      if (!check.gelukt) return { fout: check.fout };

      // Bedrag opnieuw berekenen op het moment van betalen: de gast betaalt
      // altijd de actuele rekening, nooit een bedrag uit de browser.
      sessie.bedrag = totaalPerTafel(sessie.table).totaal;
      sessie.status = "betaald";
      sessie.betaaldOp = Date.now();
      sessie.laatsteVier = check.laatsteVier;
      notify();
      return { sessie };
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
