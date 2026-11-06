import { NextResponse } from "next/server";
import { voorraadStore } from "@/lib/inventory";

export const dynamic = "force-dynamic";

/**
 * POST /api/voorraad/instellingen
 *
 *  - `{ automatischAfboeken: true | false }`
 *    Aan: elke bestelling boekt de recepten automatisch af.
 *    Uit: de keuken registreert zelf wat ze pakt op /uitgifte, zodat er nooit
 *    twee keer hetzelfde van de voorraad af gaat.
 *  - `{ goedkeuringsdrempel: number }`
 *    Uitgiftes vanaf dit bedrag in euro's moeten door de hoofdchef worden
 *    goedgekeurd. 0 betekent: geen goedkeuring nodig.
 */
export async function POST(request: Request) {
  let body: { automatischAfboeken?: unknown; goedkeuringsdrempel?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const store = voorraadStore();
  const antwoord: Record<string, unknown> = {};

  if (body.automatischAfboeken !== undefined) {
    if (typeof body.automatischAfboeken !== "boolean") {
      return NextResponse.json(
        { error: "automatischAfboeken moet true of false zijn" },
        { status: 400 }
      );
    }
    antwoord.automatischAfboeken = await store.zetAutomatischAfboeken(
      body.automatischAfboeken
    );
  }

  if (body.goedkeuringsdrempel !== undefined) {
    if (!Number.isFinite(Number(body.goedkeuringsdrempel))) {
      return NextResponse.json(
        { error: "goedkeuringsdrempel moet een getal zijn" },
        { status: 400 }
      );
    }
    antwoord.goedkeuringsdrempel = await store.zetGoedkeuringsdrempel(
      Number(body.goedkeuringsdrempel)
    );
  }

  if (Object.keys(antwoord).length === 0) {
    return NextResponse.json(
      { error: "Geef automatischAfboeken of goedkeuringsdrempel mee" },
      { status: 400 }
    );
  }

  return NextResponse.json(antwoord);
}
