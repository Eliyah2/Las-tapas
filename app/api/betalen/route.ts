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

  const { orders } = await totaalPerTafel(table);
  if (orders.length === 0) {
    return NextResponse.json(
      {
        error: `Tafel ${table} is nog niet gestart. Start de tafel op de iPad of vraag de bediening.`,
      },
      { status: 404 }
    );
  }

  const sessie = await paymentStore().start(table);
  return NextResponse.json({ sessie, aantalBestellingen: orders.length }, { status: 201 });
}
