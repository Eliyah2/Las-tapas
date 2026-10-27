import { NextResponse } from "next/server";
import { voorraadStore } from "@/lib/inventory";
import { isRol } from "@/lib/voorraad-types";

export const dynamic = "force-dynamic";

/**
 * POST /api/voorraad/uitgifte — de keuken pakt iets uit de voorraad.
 *
 * `{ productId, amount, note?, door }`
 *
 * Blijft de waarde onder de goedkeuringsdrempel, dan wordt het meteen
 * afgeboekt. Is het meer, dan komt er een aanvraag bij de hoofdchef te staan en
 * verandert er nog niets aan de voorraad.
 */
export async function POST(request: Request) {
  let body: {
    productId?: string;
    amount?: number;
    note?: string;
    door?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  if (typeof body.productId !== "string" || !body.productId) {
    return NextResponse.json({ error: "productId ontbreekt" }, { status: 400 });
  }

  if (!isRol(body.door)) {
    return NextResponse.json(
      { error: "Kies eerst je rol (kok, hoofdchef of manager)" },
      { status: 400 }
    );
  }

  const uitkomst = voorraadStore().pak(body.productId, {
    amount: Number(body.amount),
    note: body.note,
    door: body.door,
  });

  if (!uitkomst.ok) {
    return NextResponse.json({ error: uitkomst.fout }, { status: 400 });
  }

  if (uitkomst.soort === "aanvraag") {
    return NextResponse.json(
      {
        soort: "aanvraag",
        waarde: uitkomst.waarde,
        aanvraag: uitkomst.aanvraag,
        melding:
          "Deze uitgifte is groter dan de drempel en gaat naar de hoofdchef.",
      },
      { status: 202 }
    );
  }

  return NextResponse.json(
    {
      soort: "direct",
      waarde: uitkomst.waarde,
      movement: uitkomst.movement,
    },
    { status: 201 }
  );
}
