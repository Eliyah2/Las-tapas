import { NextResponse } from "next/server";
import {
  ARRANGEMENTEN,
  arrangementVan,
  eindeVanSessie,
  rekeningVanTafel,
  tafelStore,
  resterendeMinuten,
} from "@/lib/tafel";

/** De stand van een tafel: personen, arrangement, hoelang ze nog mogen eten en de rekening. */
export async function GET(request: Request) {
  const tafel = new URL(request.url).searchParams.get("tafel")?.trim() ?? "";

  if (!tafel) {
    return NextResponse.json({ error: "Tafelnummer ontbreekt" }, { status: 400 });
  }

  const { sessie, arrangement, personen, totaal } = rekeningVanTafel(tafel);

  return NextResponse.json({
    arrangementen: ARRANGEMENTEN,
    arrangement: arrangement.id,
    arrangementNaam: arrangement.naam,
    tariefPerPersoon: arrangement.prijsPerPersoon,
    duurMinuten: arrangement.minuten,
    laatsteRondeMinuten: arrangement.laatsteRondeMinuten,
    sessie: sessie ?? null,
    personen,
    namen: sessie?.namen ?? [],
    totaal,
    resterendeMinuten: sessie ? resterendeMinuten(sessie) : null,
    eindeOp: sessie ? eindeVanSessie(sessie) : null,
  });
}

/**
 * Start de tafel met een aantal personen en een arrangement, of stel het bij.
 * De eetperiode begint bij de eerste keer; met `herstart: true` begint de klok
 * opnieuw (bediening verlengt een tafel), en een ander arrangement laat de klok
 * ook opnieuw beginnen.
 *
 * De menukaart stuurt JSON en krijgt JSON terug. Het welkomstscherm stuurt een
 * gewoon formulier: dan antwoorden we met een doorverwijzing naar de kaart, zodat
 * de knop ook werkt voordat React geladen is.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const vanFormulier =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  let tafel = "";
  let personen = Number.NaN;
  let namen: string[] | undefined;
  let herstart = false;
  let arrangementId = "";

  if (vanFormulier) {
    const velden = await request.formData();
    tafel = String(velden.get("tafel") ?? "").trim();
    personen = Number(velden.get("personen"));
    namen = velden
      .getAll("namen")
      .filter((naam): naam is string => typeof naam === "string");
    herstart = velden.get("herstart") === "true";
    arrangementId = String(velden.get("arrangement") ?? "");
  } else {
    let body: {
      tafel?: string;
      personen?: number;
      namen?: string[];
      arrangement?: string;
      herstart?: boolean;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
    }

    tafel = typeof body.tafel === "string" ? body.tafel.trim() : "";
    personen = Number(body.personen);
    namen = Array.isArray(body.namen)
      ? body.namen.filter((naam): naam is string => typeof naam === "string")
      : undefined;
    arrangementId = typeof body.arrangement === "string" ? body.arrangement : "";
    herstart = body.herstart === true;
  }

  // Bij een formulier gaat de gast terug naar het welkomstscherm van deze tafel;
  // de menukaart krijgt JSON zodat ze zelf een melding kan tonen.
  const mis = (bericht: string, status: number) =>
    vanFormulier
      ? NextResponse.redirect(
          new URL(`/welkom?tafel=${encodeURIComponent(tafel)}`, request.url),
          303
        )
      : NextResponse.json({ error: bericht }, { status });

  if (!tafel) {
    return mis("Tafelnummer ontbreekt", 400);
  }
  if (!Number.isFinite(personen) || personen < 1 || personen > 40) {
    return mis("Het aantal personen moet tussen 1 en 40 zijn", 400);
  }

  const sessie = tafelStore().start(
    tafel,
    personen,
    namen,
    herstart,
    arrangementId
  );
  const arrangement = arrangementVan(sessie.arrangement);

  if (vanFormulier) {
    return NextResponse.redirect(
      new URL(`/menu?tafel=${encodeURIComponent(tafel)}`, request.url),
      303
    );
  }

  return NextResponse.json(
    {
      arrangementen: ARRANGEMENTEN,
      arrangement: arrangement.id,
      arrangementNaam: arrangement.naam,
      tariefPerPersoon: arrangement.prijsPerPersoon,
      duurMinuten: arrangement.minuten,
      laatsteRondeMinuten: arrangement.laatsteRondeMinuten,
      sessie,
      personen: sessie.personen,
      namen: sessie.namen,
      totaal:
        Math.round(sessie.personen * arrangement.prijsPerPersoon * 100) / 100,
      resterendeMinuten: resterendeMinuten(sessie),
      eindeOp: eindeVanSessie(sessie),
    },
    { status: 201 }
  );
}
