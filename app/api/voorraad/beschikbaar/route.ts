import { NextResponse } from "next/server";
import { voorraadStore } from "@/lib/inventory";

export const dynamic = "force-dynamic";

/** GET /api/voorraad/beschikbaar — licht antwoord voor de menukaart. */
export async function GET() {
  return NextResponse.json(await voorraadStore().beschikbaarheid());
}
