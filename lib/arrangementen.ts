// De arrangementen van Las Tapas: hoe lang een tafel eet, wat erbij zit en wat
// het per persoon kost.
//
// Bewust een apart bestand zonder opslag: zo gebruikt het welkomstscherm (dat
// in de browser draait) exact dezelfde lijst en prijzen als de server, zonder
// de tafelsessies mee te slepen.

export type ArrangementId = "2uur" | "3uur" | "3uur-drank";

export type Arrangement = {
  id: ArrangementId;
  /** Naam zoals de gast hem ziet. */
  naam: string;
  /** Korte naam voor koppen en op de bon. */
  kort: string;
  /** Hoe lang de eetperiode duurt. */
  minuten: number;
  /** In de laatste zoveel minuten kan er niets meer bijbesteld worden. */
  laatsteRondeMinuten: number;
  /** Prijs per persoon, inclusief eten (en drinken bij het drankarrangement). */
  prijsPerPersoon: number;
  /** Zit er drinken bij dit arrangement? */
  drank: boolean;
};

/** De drie arrangementen. Pas hier de prijzen aan. */
export const ARRANGEMENTEN: Arrangement[] = [
  {
    id: "2uur",
    naam: "2 uur · zonder drinken",
    kort: "2 uur",
    minuten: 120,
    laatsteRondeMinuten: 20,
    prijsPerPersoon: 24.5,
    drank: false,
  },
  {
    id: "3uur",
    naam: "3 uur · zonder drinken",
    kort: "3 uur",
    minuten: 180,
    laatsteRondeMinuten: 30,
    prijsPerPersoon: 29.5,
    drank: false,
  },
  {
    id: "3uur-drank",
    naam: "3 uur · met drinken",
    kort: "3 uur met drinken",
    minuten: 180,
    laatsteRondeMinuten: 30,
    prijsPerPersoon: 36.5,
    drank: true,
  },
];

export const STANDAARD_ARRANGEMENT: ArrangementId = "3uur";

/** Het arrangement dat bij dit id hoort; onbekend of leeg wordt de standaard. */
export function arrangementVan(id?: string | null): Arrangement {
  return (
    ARRANGEMENTEN.find((arrangement) => arrangement.id === id) ??
    ARRANGEMENTEN.find(
      (arrangement) => arrangement.id === STANDAARD_ARRANGEMENT
    )!
  );
}

/** Het goedkoopste arrangement, voor "vanaf" op de schermen van de zaak. */
export function laagstePrijsPerPersoon(): number {
  return Math.min(
    ...ARRANGEMENTEN.map((arrangement) => arrangement.prijsPerPersoon)
  );
}
