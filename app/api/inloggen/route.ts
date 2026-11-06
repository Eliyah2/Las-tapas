import { NextResponse } from "next/server";
import {
  SESSIE_COOKIE,
  SESSIE_SECONDEN,
  maakSessieWaarde,
  pinKlopt,
} from "@/lib/sessie";

export async function POST(request: Request) {
  let pin = "";
  try {
    const body = (await request.json()) as { pin?: unknown };
    pin = typeof body.pin === "string" ? body.pin : "";
  } catch {
    pin = "";
  }

  if (!pinKlopt(pin)) {
    return NextResponse.json(
      { fout: "Die pincode klopt niet." },
      { status: 401 }
    );
  }

  const antwoord = NextResponse.json({ ok: true });
  antwoord.cookies.set(SESSIE_COOKIE, maakSessieWaarde(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSIE_SECONDEN,
    secure: process.env.NODE_ENV === "production",
  });
  return antwoord;
}
