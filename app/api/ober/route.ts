import { NextResponse } from "next/server";
import { orderStore } from "@/lib/orders";
import { TAFELS, VERDIEPINGEN, capaciteit } from "@/lib/tafelplan";
import {
  LAATSTE_RONDE_MINUTEN,
  arrangementVan,
  laagstePrijsPerPersoon,
  resterendeMinuten,
  tafelStore,
} from "@/lib/tafel";

export const dynamic = "force-dynamic";

/** De stand van één tafel op het oberdashboard. */
export type TafelStand = {
  code: string;
  zone: string;
  stoelen: number;
  bezet: boolean;
  personen: number;
  /** Minuten tot de eetperiode afloopt; null als de tafel vrij is. */
  resterend: number | null;
  status: "vrij" | "bezet" | "laatste-ronde" | "tijd-om";
  /** Bestellingen die nog in de keuken liggen (nieuw of in bereiding). */
  open: number;
  /** Bestellingen die klaar staan om uit te serveren. */
  klaar: number;
  /** Wat deze tafel tot nu toe op de rekening heeft staan. */
  bedrag: number;
};

export type VloerStand = {
  id: string;
  naam: string;
  ondertitel: string;
  kolommen: number;
  tafels: TafelStand[];
  stoelen: number;
  bezet: number;
  gasten: number;
};

export type OberOverzicht = {
  verdiepingen: VloerStand[];
  kpi: {
    tafels: number;
    bezet: number;
    vrij: number;
    open: number;
    klaar: number;
    gasten: number;
    omzet: number;
  };
  tarief: { tariefPerPersoon: number; duurMinuten: number };
  bijgewerkt: number;
};

function zelfdeTafel(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function GET() {
  const sessies = tafelStore().list();

  // De bestellingen komen uit Supabase; is die even niet bereikbaar, dan tonen
  // we het tafeloverzicht zonder bestellingen in plaats van een foutmelding.
  let orders: Awaited<ReturnType<ReturnType<typeof orderStore>["list"]>> = [];
  try {
    orders = await orderStore().list();
  } catch {
    orders = [];
  }

  const standen = TAFELS.map((tafel): TafelStand => {
    const sessie = sessies.find((s) => zelfdeTafel(s.tafel, tafel.code));
    const vanTafel = orders.filter((order) => zelfdeTafel(order.table, tafel.code));
    const resterend = sessie ? resterendeMinuten(sessie) : null;

    const status: TafelStand["status"] = !sessie
      ? "vrij"
      : resterend !== null && resterend <= 0
        ? "tijd-om"
        : resterend !== null && resterend <= LAATSTE_RONDE_MINUTEN
          ? "laatste-ronde"
          : "bezet";

    return {
      code: tafel.code,
      zone: tafel.zone,
      stoelen: tafel.stoelen,
      bezet: Boolean(sessie),
      personen: sessie?.personen ?? 0,
      resterend,
      status,
      open: vanTafel.filter(
        (order) => order.status === "nieuw" || order.status === "bereiden"
      ).length,
      klaar: vanTafel.filter((order) => order.status === "klaar").length,
      bedrag: sessie
        ? Math.round(
            sessie.personen *
              arrangementVan(sessie.arrangement).prijsPerPersoon *
              100
          ) / 100
        : 0,
    };
  });

  const verdiepingen: VloerStand[] = VERDIEPINGEN.map((verdieping) => {
    const tafels = standen.filter(
      (stand) =>
        TAFELS.find((tafel) => tafel.code === stand.code)?.verdieping ===
        verdieping.id
    );
    return {
      id: verdieping.id,
      naam: verdieping.naam,
      ondertitel: verdieping.ondertitel,
      kolommen: verdieping.kolommen,
      tafels,
      stoelen: capaciteit(verdieping.id).stoelen,
      bezet: tafels.filter((tafel) => tafel.bezet).length,
      gasten: tafels.reduce((som, tafel) => som + tafel.personen, 0),
    };
  });

  const overzicht: OberOverzicht = {
    verdiepingen,
    kpi: {
      tafels: standen.length,
      bezet: standen.filter((t) => t.bezet).length,
      vrij: standen.filter((t) => !t.bezet).length,
      open: standen.reduce((som, t) => som + t.open, 0),
      klaar: standen.reduce((som, t) => som + t.klaar, 0),
      gasten: standen.reduce((som, t) => som + t.personen, 0),
      omzet: Math.round(standen.reduce((som, t) => som + t.bedrag, 0) * 100) / 100,
    },
    tarief: {
      // Per tafel verschilt het arrangement; hier het goedkoopste tarief als
      // "vanaf"-prijs voor de kop van het dashboard.
      tariefPerPersoon: laagstePrijsPerPersoon(),
      duurMinuten: arrangementVan().minuten,
    },
    bijgewerkt: Date.now(),
  };

  return NextResponse.json(overzicht, {
    headers: { "Cache-Control": "no-store" },
  });
}
