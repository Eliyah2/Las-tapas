import { NextResponse } from "next/server";
import { voorraadStore } from "@/lib/inventory";
import { isRol, type MovementReason, type Unit } from "@/lib/voorraad-types";

const REDENEN: MovementReason[] = [
  "levering",
  "verbruik",
  "uitgifte",
  "verlies",
  "correctie",
];

/**
 * PATCH /api/voorraad/:id
 *
 * Twee soorten wijzigingen in één route:
 *  - een mutatie boeken:  { delta: 500, reason: "levering", note?: string }
 *                         { naar: 1200, reason: "correctie", note?: string }
 *  - het product aanpassen: { parLevel, costPerUnit, name, supplier, unit }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: {
    delta?: number;
    naar?: number;
    reason?: string;
    note?: string;
    name?: string;
    unit?: Unit;
    parLevel?: number;
    costPerUnit?: number;
    supplier?: string;
    door?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const store = voorraadStore();
  const isMutatie = typeof body.reason === "string";

  if (isMutatie) {
    const reason = body.reason as MovementReason;
    if (!REDENEN.includes(reason)) {
      return NextResponse.json(
        {
          error:
            "Reden moet levering, verbruik, uitgifte, verlies of correctie zijn",
        },
        { status: 400 }
      );
    }
    if (!Number.isFinite(body.delta) && !Number.isFinite(body.naar)) {
      return NextResponse.json(
        { error: "Geef een delta of een nieuw aantal mee" },
        { status: 400 }
      );
    }

    const movement = await store.boek(
      id,
      {
        delta: body.delta,
        naar: body.naar,
        reason,
        note: body.note,
      },
      isRol(body.door) ? body.door : undefined
    );
    if (!movement) {
      return NextResponse.json({ error: "Product niet gevonden" }, { status: 404 });
    }
    return NextResponse.json({ movement });
  }

  const product = await store.werkProductBij(id, {
    name: body.name,
    unit: body.unit,
    parLevel: body.parLevel,
    costPerUnit: body.costPerUnit,
    supplier: body.supplier,
  });

  if (!product) {
    return NextResponse.json({ error: "Product niet gevonden" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

/** DELETE /api/voorraad/:id — product van de lijst halen. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const verwijderd = await voorraadStore().verwijderProduct(id);

  if (!verwijderd) {
    return NextResponse.json({ error: "Product niet gevonden" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
