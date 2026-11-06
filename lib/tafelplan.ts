// Plattegrond van Las Tapas, gebruikt door het oberdashboard.
//
// De indeling volgt de bouwtekening: begane grond 10 tafels (40 zitplaatsen),
// eerste verdieping 16 tafels (64 zitplaatsen) — samen 26 tafels en 104
// zitplaatsen. De tafelnummers zijn dezelfde als op de QR-codes en in de
// menukaart, zodat een sessie die aan tafel 14 start hier vanzelf op de juiste
// tegel staat.

export type VerdiepingId = "begane" | "verdieping";

export type Verdieping = {
  id: VerdiepingId;
  naam: string;
  ondertitel: string;
  /** Aantal tafels naast elkaar op het scherm. */
  kolommen: number;
};

export const VERDIEPINGEN: Verdieping[] = [
  {
    id: "begane",
    naam: "Begane grond",
    ondertitel: "Zaal, bar en entree",
    kolommen: 3,
  },
  {
    id: "verdieping",
    naam: "Eerste verdieping",
    ondertitel: "Grote zaal",
    kolommen: 4,
  },
];

export type Tafel = {
  code: string;
  verdieping: VerdiepingId;
  /** Waar de tafel staat, zodat de bediening hem terugvindt. */
  zone: string;
  stoelen: number;
};

export const TAFELS: Tafel[] = [
  // Begane grond: negen tafels in de zaal, tafel 10 bij de entree.
  { code: "1", verdieping: "begane", zone: "Zaal", stoelen: 4 },
  { code: "2", verdieping: "begane", zone: "Zaal", stoelen: 4 },
  { code: "3", verdieping: "begane", zone: "Zaal", stoelen: 4 },
  { code: "4", verdieping: "begane", zone: "Zaal", stoelen: 4 },
  { code: "5", verdieping: "begane", zone: "Zaal", stoelen: 4 },
  { code: "6", verdieping: "begane", zone: "Zaal", stoelen: 4 },
  { code: "7", verdieping: "begane", zone: "Zaal", stoelen: 4 },
  { code: "8", verdieping: "begane", zone: "Zaal", stoelen: 4 },
  { code: "9", verdieping: "begane", zone: "Zaal", stoelen: 4 },
  { code: "10", verdieping: "begane", zone: "Entree", stoelen: 4 },

  // Eerste verdieping: zestien tafels in vier rijen van vier.
  { code: "11", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "12", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "13", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "14", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "15", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "16", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "17", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "18", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "19", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "20", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "21", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "22", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "23", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "24", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "25", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
  { code: "26", verdieping: "verdieping", zone: "Grote zaal", stoelen: 4 },
];

/** Zoekt een tafel op nummer; hoofdletterongevoelig en zonder spaties. */
export function vindTafel(code: string): Tafel | undefined {
  const gezocht = code.trim().toLowerCase();
  return TAFELS.find((tafel) => tafel.code.toLowerCase() === gezocht);
}

export function isVerdiepingId(waarde: string): waarde is VerdiepingId {
  return VERDIEPINGEN.some((verdieping) => verdieping.id === waarde);
}

/** Hoeveel tafels en zitplaatsen er per verdieping zijn. */
export function capaciteit(verdieping: VerdiepingId) {
  const tafels = TAFELS.filter((tafel) => tafel.verdieping === verdieping);
  return {
    tafels: tafels.length,
    stoelen: tafels.reduce((som, tafel) => som + tafel.stoelen, 0),
  };
}
