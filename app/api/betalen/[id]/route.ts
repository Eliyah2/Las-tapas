import { NextResponse } from "next/server";
import { paymentStore, type KaartGegevens } from "@/lib/payments";

/**
 * Opvragen van één betaalsessie, zodat de betaalpagina het bedrag altijd
 * van de server laat komen en niet uit de URL.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessie = await paymentStore().get(id);

  if (!sessie) {
    return NextResponse.json({ error: "Betaalsessie niet gevonden" }, { status: 404 });
  }

  return NextResponse.json({ sessie });
}

/**
 * Verwerk de betaling van een open betaalsessie.
 * De kaartgegevens worden alleen gecontroleerd en daarna weggegooid; er
 * blijft uitsluitend de laatste vier cijfers over voor op het bonnetje.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { kaart?: KaartGegevens };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const kaart = body.kaart;
  if (
    !kaart ||
    typeof kaart.nummer !== "string" ||
    typeof kaart.houder !== "string" ||
    typeof kaart.vervalt !== "string" ||
    typeof kaart.cvc !== "string"
  ) {
    return NextResponse.json(
      { error: "Kaartgegevens zijn onvolledig" },
      { status: 400 }
    );
  }

  const resultaat = await paymentStore().betaal(id, kaart);
  if (resultaat.fout || !resultaat.sessie) {
    return NextResponse.json(
      { error: resultaat.fout ?? "Betalen mislukt" },
      { status: resultaat.fout === "Deze tafel is al afgerekend." ? 409 : 400 }
    );
  }

  return NextResponse.json({ sessie: resultaat.sessie });
}
