import { NextResponse } from "next/server";
import { voorraadStore } from "@/lib/inventory";
import type { Unit } from "@/lib/voorraad-types";

const EENHEDEN: Unit[] = ["gram", "ml", "stuk"];

export const dynamic = "force-dynamic";

/** GET /api/voorraad — het volledige voorraadoverzicht. */
export async function GET() {
  return NextResponse.json(await voorraadStore().overzicht());
}

/** POST /api/voorraad — een nieuw product toevoegen. */
export async function POST(request: Request) {
  let body: {
    name?: string;
    unit?: string;
    stock?: number;
    parLevel?: number;
    costPerUnit?: number;
    supplier?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const unit = body.unit as Unit;
  if (!EENHEDEN.includes(unit)) {
    return NextResponse.json(
      { error: "Eenheid moet gram, ml of stuk zijn" },
      { status: 400 }
    );
  }

  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    return NextResponse.json({ error: "Naam is te kort" }, { status: 400 });
  }

  try {
    const product = await voorraadStore().voegProductToe({
      name: body.name,
      unit,
      stock: Number(body.stock) || 0,
      parLevel: Number(body.parLevel) || 0,
      costPerUnit: Number(body.costPerUnit) || 0,
      supplier: body.supplier,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const bericht = error instanceof Error ? error.message : "Toevoegen mislukt";
    return NextResponse.json({ error: bericht }, { status: 400 });
  }
}
