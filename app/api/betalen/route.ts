import { NextResponse } from "next/server";
import { paymentStore, totaalPerTafel } from "@/lib/payments";

/**
 * Start (of hervat) de afrekening van een tafel.
 * Het bedrag wordt hier server-side berekend: de browser stuurt alleen
 * het tafelnummer mee, nooit een bedrag.
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

  const { orders } = totaalPerTafel(table);
  if (orders.length === 0) {
    return NextResponse.json(
      { error: `Er zijn geen bestellingen bekend voor tafel ${table}` },
      { status: 404 }
    );
  }

  const sessie = paymentStore().start(table);
  return NextResponse.json({ sessie, aantalBestellingen: orders.length }, { status: 201 });
}
