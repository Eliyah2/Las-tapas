import { NextResponse } from "next/server";
import { orderStore, type OrderStatus } from "@/lib/orders";

const VALID: OrderStatus[] = ["nieuw", "bereiden", "klaar"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const status = body.status as OrderStatus;
  if (!VALID.includes(status)) {
    return NextResponse.json(
      { error: "Status moet één van zijn: nieuw, bereiden, klaar" },
      { status: 400 }
    );
  }

  const order = orderStore().updateStatus(id, status);
  if (!order) {
    return NextResponse.json({ error: "Bestelling niet gevonden" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
