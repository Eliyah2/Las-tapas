import { NextResponse } from "next/server";
import { orderStore } from "@/lib/orders";
import { findMenuItem } from "@/lib/menu";
import { voorraadStore } from "@/lib/inventory";

type IncomingItem = { id: string; quantity: number };

export async function POST(request: Request) {
  let body: { table?: string; items?: IncomingItem[]; note?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const table = typeof body.table === "string" ? body.table.trim() : "";
  const note = typeof body.note === "string" ? body.note : undefined;

  if (!table) {
    return NextResponse.json({ error: "Tafelnummer ontbreekt" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Bestelling is leeg" }, { status: 400 });
  }

  // Valideer items tegen het menu: prijs en naam komen altijd van de server,
  // nooit van de client (anders kan iemand €0,01-recepten verzinnen).
  const orderItems = [];
  for (const item of body.items) {
    const quantity = Number(item.quantity);
    const menuItem = findMenuItem(String(item.id));

    if (!menuItem || !menuItem.available) {
      return NextResponse.json(
        { error: `Gerecht "${item.id}" bestaat niet of is niet beschikbaar` },
        { status: 400 }
      );
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return NextResponse.json(
        { error: `Ongeldig aantal voor "${menuItem.name}"` },
        { status: 400 }
      );
    }

    orderItems.push({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
    });
  }

  // De keuken kan alleen koken wat er in huis is: eerst de recepten afboeken.
  // `verbruik` boekt alles of niets, dus er verdwijnt nooit voorraad zonder order.
  // Registreert de keuken haar uitgiftes zelf, dan wordt er alleen gecontroleerd.
  const voorraad = voorraadStore();
  const verbruik = await voorraad.verbruik(
    orderItems.map((item) => ({ id: item.id, quantity: item.quantity })),
    table,
    await voorraad.rekentAutomatischAf()
  );

  if (!verbruik.gelukt) {
    return NextResponse.json(
      {
        error: "Helaas, voor deze bestelling is er net niet genoeg voorraad.",
        tekorten: verbruik.tekorten,
      },
      { status: 409 }
    );
  }

  const store = orderStore();
  const order = await store.add({ table, items: orderItems, note });

  return NextResponse.json(
    { order, voorraadMutaties: verbruik.mutaties.length },
    { status: 201 }
  );
}
