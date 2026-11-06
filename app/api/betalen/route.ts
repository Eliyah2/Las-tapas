import { NextResponse } from "next/server";
import { paymentStore } from "@/lib/payments";
import { ARRANGEMENTEN, arrangementVan, tafelStore } from "@/lib/tafel";

/**
 * Start (of hervat) de afrekening van een tafel.
 * All you can eat met arrangementen: het bedrag is het aantal personen × het
 * tarief van het gekozen arrangement. Dat bedrag wordt hier server-side berekend
 * uit de tafelsessie, nooit uit de browser.
 */
export async function POST(request: Request) {
  let body: { table?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const table = typeof body.table === "string" ? body.table.trim() : "";
  if (!table) {
    return NextResponse.json({ error: "Tafelnummer ontbreekt" }, { status: 400 });
  }

  const tafelSessie = tafelStore().get(table);

  if (!tafelSessie) {
    // Geen lopende tafel, maar deze tafel heeft wel al betaald: toon die
    // afrekening (met het bonnetje) in plaats van een foutmelding.
    const betaald = await paymentStore().laatsteVoorTafel(table);
    if (betaald && betaald.status === "betaald") {
      const arrangement = arrangementVan(betaald.arrangement);
      return NextResponse.json({
        arrangementen: ARRANGEMENTEN,
        arrangement: arrangement.id,
        arrangementNaam: arrangement.naam,
        tariefPerPersoon: arrangement.prijsPerPersoon,
        duurMinuten: arrangement.minuten,
        laatsteRondeMinuten: arrangement.laatsteRondeMinuten,
        sessie: betaald,
        openSinds: 0,
      });
    }

    return NextResponse.json(
      {
        error: `Tafel ${table} is nog niet gestart. Start de tafel op de iPad of vraag de bediening.`,
      },
      { status: 404 }
    );
  }

  const arrangement = arrangementVan(tafelSessie.arrangement);
  const sessie = await paymentStore().start(table);

  return NextResponse.json(
    {
      arrangementen: ARRANGEMENTEN,
      arrangement: arrangement.id,
      arrangementNaam: arrangement.naam,
      tariefPerPersoon: arrangement.prijsPerPersoon,
      duurMinuten: arrangement.minuten,
      laatsteRondeMinuten: arrangement.laatsteRondeMinuten,
      sessie,
      openSinds: tafelSessie.gestartOp,
      personen: tafelSessie.personen,
    },
    { status: 201 }
  );
}
