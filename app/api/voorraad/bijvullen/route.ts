import { NextResponse } from "next/server";
import { voorraadStore } from "@/lib/inventory";
import { isRol, type Rol } from "@/lib/voorraad-types";

export const dynamic = "force-dynamic";

/**
 * POST /api/voorraad/bijvullen — alles wat onder het par-niveau zit in één keer
 * bijvullen. Met `{ ids: ["gambas"] }` alleen de opgegeven producten.
 */
export async function POST(request: Request) {
  let ids: string[] | undefined;
  let door: Rol | undefined;
  try {
    const body = (await request.json()) as { ids?: unknown; door?: unknown };
    if (Array.isArray(body.ids)) {
      ids = body.ids.filter((id): id is string => typeof id === "string");
    }
    if (isRol(body.door)) door = body.door;
  } catch {
    // Geen body: alles bijvullen.
  }

  const mutaties = await voorraadStore().vulAanTotPar(ids, door);
  return NextResponse.json({ mutaties, aantal: mutaties.length });
}
