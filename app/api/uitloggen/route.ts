import { NextResponse } from "next/server";
import { SESSIE_COOKIE } from "@/lib/sessie";

export async function POST() {
  const antwoord = NextResponse.json({ ok: true });
  antwoord.cookies.set(SESSIE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return antwoord;
}
