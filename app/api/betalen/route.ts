import { NextResponse } from "next/server";
import { paymentStore } from "@/lib/payments";
import { TARIEF_INFO, tafelStore } from "@/lib/tafel";

/**
 * Start (of hervat) de afrekening van een tafel.
 * Bij all you can eat is de rekening het aantal personen × het vaste tarief;
 * dat bedrag wordt hier server-side berekend uit de tafelsessie, nooit uit de
 * browser.
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
    const betaald = paymentStore().laatsteVoorTafel(table);
    if (betaald && betaald.status === "betaald") {
      return NextResponse.json({
        ...TARIEF_INFO,
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

  const sessie = paymentStore().start(table);
  return NextResponse.json(
    {
      ...TARIEF_INFO,
      sessie,
      openSinds: tafelSessie.gestartOp,
      personen: tafelSessie.personen,
    },
    { status: 201 }
  );
}
