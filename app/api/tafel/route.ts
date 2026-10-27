import { NextResponse } from "next/server";
import {
  rekeningVanTafel,
  TARIEF_INFO,
  tafelStore,
  resterendeMinuten,
} from "@/lib/tafel";

/** De stand van een tafel: aantal personen, hoelang ze nog mogen eten en de rekening. */
export async function GET(request: Request) {
  const tafel = new URL(request.url).searchParams.get("tafel")?.trim() ?? "";

  if (!tafel) {
    return NextResponse.json({ error: "Tafelnummer ontbreekt" }, { status: 400 });
  }

  const { sessie, personen, tariefPerPersoon, totaal } = rekeningVanTafel(tafel);

  return NextResponse.json({
    ...TARIEF_INFO,
    sessie: sessie ?? null,
    personen,
    namen: sessie?.namen ?? [],
    tariefPerPersoon,
    totaal,
    resterendeMinuten: sessie ? resterendeMinuten(sessie) : null,
  });
}

/**
 * Start de tafel met een aantal personen, of stel het aantal bij.
 * De eetperiode begint bij de eerste keer en blijft daarna doorlopen;
 * met `herstart: true` begint de klok opnieuw (bediening verlengt een tafel).
 */
export async function POST(request: Request) {
  let body: {
    tafel?: string;
    personen?: number;
    namen?: string[];
    herstart?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const tafel = typeof body.tafel === "string" ? body.tafel.trim() : "";
  const personen = Number(body.personen);

  if (!tafel) {
    return NextResponse.json({ error: "Tafelnummer ontbreekt" }, { status: 400 });
  }
  if (!Number.isFinite(personen) || personen < 1 || personen > 40) {
    return NextResponse.json(
      { error: "Het aantal personen moet tussen 1 en 40 zijn" },
      { status: 400 }
    );
  }

  const namen = Array.isArray(body.namen)
    ? body.namen.filter((naam): naam is string => typeof naam === "string")
    : undefined;

  const sessie = tafelStore().start(tafel, personen, namen, body.herstart === true);
  const { totaal } = rekeningVanTafel(tafel);

  return NextResponse.json(
    {
      ...TARIEF_INFO,
      sessie,
      personen: sessie.personen,
      namen: sessie.namen,
      totaal,
      resterendeMinuten: resterendeMinuten(sessie),
    },
    { status: 201 }
  );
}
