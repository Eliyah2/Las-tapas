import { NextResponse } from "next/server";
import { voorraadStore } from "@/lib/inventory";
import { isRol } from "@/lib/voorraad-types";

export const dynamic = "force-dynamic";

/** POST /api/voorraad/reset — terug naar de beginvoorraad uit de seed. */
export async function POST(request: Request) {
  let door: string | undefined;
  try {
    const body = (await request.json()) as { door?: unknown };
    if (isRol(body.door)) door = body.door;
  } catch {
    // Geen body: geen probleem, de mutatie krijgt dan geen rol mee.
  }

  voorraadStore().reset(isRol(door) ? door : undefined);
  return NextResponse.json({ ok: true });
}
