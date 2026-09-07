import { NextResponse } from "next/server";
import { MENU } from "@/lib/menu";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("categorie");

  if (!category) {
    return NextResponse.json({ categories: MENU });
  }

  const filtered = MENU.filter(
    (c) => c.id.toLowerCase() === category.toLowerCase()
  );

  if (filtered.length === 0) {
    return NextResponse.json({ error: "Categorie niet gevonden" }, { status: 404 });
  }

  return NextResponse.json({ categories: filtered });
}
