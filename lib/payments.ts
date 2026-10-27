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

import { DUUR_MINUTEN, TARIEF_PER_PERSOON, tafelStore } from "@/lib/tafel";

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
export function bonnetjeVoor(id: string): Bonnetje | undefined {
  const sessie = sessies.find((s) => s.id === id);
  if (!sessie || sessie.status !== "betaald") return undefined;
  return bonnetjeVan(sessie);
}

/** De rekening van een tafel: het aantal personen × het vaste tarief. */
function rekeningBedrag(table: string): { personen: number; bedrag: number } {
  const tafelSessie = tafelStore().get(table);
  if (!tafelSessie) return { personen: 0, bedrag: 0 };
  return {
    personen: tafelSessie.personen,
    bedrag: afronden(tafelSessie.personen * TARIEF_PER_PERSOON),
  };
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
      const { personen, bedrag } = rekeningBedrag(tafel);

      if (bestaand) {
        // Er kan intussen iemand bijgekomen zijn: het bedrag wordt vers berekend.
        bestaand.personen = personen;
        bestaand.bedrag = bedrag;
        notify();
        return bestaand;
      }

      const sessie: BetaalSessie = {
        id: crypto.randomUUID(),
        table: tafel,
        personen,
        bedrag,
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
      // altijd het tarief voor het aantal personen dat aan tafel zit, nooit een
      // bedrag uit de browser.
      const { personen, bedrag } = rekeningBedrag(sessie.table);
      sessie.personen = personen;
      sessie.bedrag = bedrag;
      sessie.status = "betaald";
      sessie.betaaldOp = Date.now();
      sessie.laatsteVier = check.laatsteVier;
      // De tafel is klaar: de volgende gasten beginnen met een verse eetperiode.
      tafelStore().stop(sessie.table);
      notify();
      return { sessie };
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
