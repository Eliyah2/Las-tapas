import { NextResponse } from "next/server";
import { voorraadStore } from "@/lib/inventory";
import { isRol } from "@/lib/voorraad-types";

export const dynamic = "force-dynamic";

/**
 * POST /api/voorraad/aanvragen/:id — `{ actie: "goedkeuren" | "afwijzen", door, reden? }`
 *
 * Alleen de hoofdchef mag dit. Goedkeuren boekt de uitgifte af, afwijzen laat
 * de voorraad ongemoeid maar bewaart wel het besluit.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { actie?: string; door?: string; reden?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  if (!isRol(body.door)) {
    return NextResponse.json(
      { error: "Kies eerst je rol (kok, hoofdchef of manager)" },
      { status: 400 }
    );
  }

  if (body.door !== "hoofdchef") {
    return NextResponse.json(
      { error: "Alleen de hoofdchef kan een aanvraag behandelen" },
      { status: 403 }
    );
  }

  const store = voorraadStore();

  if (body.actie === "goedkeuren") {
    const uitkomst = store.keurAanvraagGoed(id, body.door);
    if (!uitkomst.ok) {
      return NextResponse.json(
        { error: uitkomst.fout ?? "Goedkeuren mislukt" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, movement: uitkomst.movement });
  }

  if (body.actie === "afwijzen") {
    const uitkomst = store.wijsAanvraagAf(id, body.door, body.reden);
    if (!uitkomst.ok) {
      return NextResponse.json(
        { error: uitkomst.fout ?? "Afwijzen mislukt" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "actie moet goedkeuren of afwijzen zijn" },
    { status: 400 }
  );
}
