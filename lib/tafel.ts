// Tafelsessies voor het all-you-can-eat-concept.
//
// Las Tapas werkt niet met een prijs per gerecht, maar met één tarief per
// persoon voor een vaste eetperiode. Daarom houdt deze module per tafel bij
// met hoeveel personen er gegeten wordt en hoe laat ze begonnen zijn: daaruit
// volgt zowel de rekening als de resterende tijd.
//
// Net als de andere stores staat dit in het geheugen: genoeg voor één
// restaurant op één server. Betalen sluit de tafel af, zodat de volgende gasten
// weer met een verse periode beginnen.

/** Vast tarief per persoon, inclusief eten en frisdrank. Pas dit hier aan. */
export const TARIEF_PER_PERSOON = 27.5;

/** Hoe lang een tafel mag eten, in minuten (2,5 uur). */
export const DUUR_MINUTEN = 150;

/**
 * In de laatste fase van de periode kan er niets meer bijbesteld worden, zodat
 * de keuken op tijd kan sluiten. De gasten zien dan een waarschuwing.
 */
export const LAATSTE_RONDE_MINUTEN = 30;

export type TafelSessie = {
  /** Het tafelnummer zoals het op de QR-code staat. */
  tafel: string;
  personen: number;
  /** De namen van de gasten, in dezelfde volgorde als de personen. */
  namen: string[];
  gestartOp: number;
};

/**
 * Namen netjes maken: evenveel namen als personen, met een terugvalnaam. Twee
 * gasten met dezelfde naam krijgen er een nummer bij, zodat hun bestellingen
 * niet door elkaar lopen.
 */
function normaliseerNamen(namen: string[] | undefined, personen: number): string[] {
  const gebruikt = new Set<string>();

  return Array.from({ length: personen }, (_, index) => {
    const basis =
      (namen?.[index] ?? "").trim().slice(0, 20) || `Persoon ${index + 1}`;
    let naam = basis;
    let nummer = 2;
    while (gebruikt.has(naam.toLowerCase())) {
      naam = `${basis} ${nummer}`;
      nummer += 1;
    }
    gebruikt.add(naam.toLowerCase());
    return naam;
  });
}

export const TARIEF_INFO = {
  tariefPerPersoon: TARIEF_PER_PERSOON,
  duurMinuten: DUUR_MINUTEN,
  laatsteRondeMinuten: LAATSTE_RONDE_MINUTEN,
} as const;

const sessies: TafelSessie[] = [];

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

function sleutel(tafel: string): string {
  return tafel.trim().toLowerCase();
}

export function tafelStore() {
  return {
    /** De sessie van een tafel, of niets als die nog niet gestart is. */
    get(tafel: string): TafelSessie | undefined {
      return sessies.find((s) => sleutel(s.tafel) === sleutel(tafel));
    },

    /**
     * Start de tafel (of zet het aantal personen bij). Een lopende sessie
     * houdt dezelfde starttijd, zodat bijstellen van het aantal personen de
     * eetperiode niet opnieuw laat beginnen. Met `herstart` begint de klok wel
     * opnieuw, bijvoorbeeld als de bediening een tafel verlengt.
     */
    start(
      tafel: string,
      personen: number,
      namen?: string[],
      herstart = false
    ): TafelSessie {
      const bestaand = sessies.find((s) => sleutel(s.tafel) === sleutel(tafel));
      const aantal = Math.min(Math.max(Math.round(personen) || 1, 1), 40);
      // Namen die niet zijn meegegeven blijven staan, zodat een tafel die al
      // loopt zijn namen niet verliest.
      const nieuweNamen = normaliseerNamen(namen ?? bestaand?.namen, aantal);

      if (bestaand) {
        bestaand.personen = aantal;
        bestaand.namen = nieuweNamen;
        if (herstart) bestaand.gestartOp = Date.now();
        notify();
        return bestaand;
      }

      const sessie: TafelSessie = {
        tafel: tafel.trim(),
        personen: aantal,
        namen: nieuweNamen,
        gestartOp: Date.now(),
      };
      sessies.push(sessie);
      notify();
      return sessie;
    },

    /** Tafel afgesloten (na betaling of handmatig): de volgende gasten starten vers. */
    stop(tafel: string): boolean {
      const index = sessies.findIndex((s) => sleutel(s.tafel) === sleutel(tafel));
      if (index === -1) return false;
      sessies.splice(index, 1);
      notify();
      return true;
    },

    list(): TafelSessie[] {
      return [...sessies];
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Hoeveel minuten een sessie nog loopt (negatief als de tijd om is). */
export function resterendeMinuten(sessie: TafelSessie, nu = Date.now()): number {
  const einde = sessie.gestartOp + DUUR_MINUTEN * 60_000;
  return Math.ceil((einde - nu) / 60_000);
}

/** Wat de rekening van deze tafel is: personen × het vaste tarief. */
export function rekeningVanTafel(tafel: string): {
  sessie?: TafelSessie;
  personen: number;
  tariefPerPersoon: number;
  totaal: number;
} {
  const sessie = tafelStore().get(tafel);
  if (!sessie) {
    return { personen: 0, tariefPerPersoon: TARIEF_PER_PERSOON, totaal: 0 };
  }
  return {
    sessie,
    personen: sessie.personen,
    tariefPerPersoon: TARIEF_PER_PERSOON,
    totaal: Math.round(sessie.personen * TARIEF_PER_PERSOON * 100) / 100,
  };
}
