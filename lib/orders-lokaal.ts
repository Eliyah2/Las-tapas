// Bestellingen in het geheugen, voor als Supabase niet is ingesteld.
//
// De database blijft de echte opslag: staat NEXT_PUBLIC_SUPABASE_URL met
// SUPABASE_SERVICE_ROLE_KEY in .env.local, dan gaat alles via Supabase. Zonder
// die gegevens zou de bestelflow helemaal niet werken en kun je de applicatie
// niet testen. Daarom valt de app dan terug op deze lijst in het geheugen: de
// keuken, de statuspagina en het oberdashboard werken gewoon, alleen overleeft
// de bestelling een herstart van de server niet.

import type { Order, OrderItem, OrderStatus } from "./orders";

const bestellingen: Order[] = [];

let teller = 0;

function nieuweId(): string {
  teller += 1;
  return `lokaal-${teller}`;
}

function zelfdeTafel(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Het rondenummer: de hoeveelste bestelling dit aan die tafel is. */
function metRonde(orders: Order[]): Order[] {
  const perTafel = new Map<string, number>();
  const rondes = new Map<string, number>();

  for (const order of [...orders].sort((a, b) => a.createdAt - b.createdAt)) {
    const sleutel = order.table.trim().toLowerCase();
    const nummer = (perTafel.get(sleutel) ?? 0) + 1;
    perTafel.set(sleutel, nummer);
    rondes.set(order.id, nummer);
  }

  return orders.map((order) => ({
    ...order,
    ronde: rondes.get(order.id) ?? 1,
  }));
}

/** Alle bestellingen van één tafel, oud naar nieuw. */
export async function lokaalOrdersVoorTafel(table: string): Promise<Order[]> {
  const vanTafel = bestellingen
    .filter((order) => zelfdeTafel(order.table, table))
    .sort((a, b) => a.createdAt - b.createdAt);

  return metRonde(vanTafel);
}

export function lokaalOrderStore() {
  return {
    async list(): Promise<Order[]> {
      const nieuwsteEerst = [...bestellingen].sort(
        (a, b) => b.createdAt - a.createdAt
      );
      return metRonde(nieuwsteEerst);
    },

    async get(id: string): Promise<Order | undefined> {
      return metRonde(bestellingen).find((order) => order.id === id);
    },

    async add(input: {
      table: string;
      items: OrderItem[];
      note?: string;
    }): Promise<Order> {
      const nu = Date.now();
      const order: Order = {
        id: nieuweId(),
        table: input.table.trim(),
        ronde: 1,
        items: input.items.map((item) => ({ ...item })),
        note: input.note?.trim() || undefined,
        status: "nieuw",
        createdAt: nu,
        updatedAt: nu,
      };

      bestellingen.push(order);

      const opgeslagen = await this.get(order.id);
      return opgeslagen ?? order;
    },

    async updateStatus(
      id: string,
      status: OrderStatus
    ): Promise<Order | undefined> {
      const order = bestellingen.find((rij) => rij.id === id);
      if (!order) return undefined;
      order.status = status;
      order.updatedAt = Date.now();
      return metRonde([order])[0];
    },
  };
}
