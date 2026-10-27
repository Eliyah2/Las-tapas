// In-memory order store. Genoeg voor één restaurant op één server-instance.
// Wissel dit later om voor een database (bv. SQLite/Postgres) als je wilt dat
// orders een server-herstart overleven.

export type OrderStatus = "nieuw" | "bereiden" | "klaar";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  /** Voor wie het gerecht is: de naam van de gast aan tafel. */
  voor?: string;
  /** Opmerking per gerecht, bijvoorbeeld "zonder ui (allergie)". */
  opmerking?: string;
};

export type Order = {
  id: string;
  table: string;
  /** De hoeveelste bestelling dit is aan deze tafel: ronde 1, 2, 3, ... */
  ronde: number;
  items: OrderItem[];
  note?: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
};

const orders: Order[] = [];

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // listener weggevallen? negeer
    }
  }
}

export function orderStore() {
  return {
    list(): Order[] {
      return [...orders].sort((a, b) => b.createdAt - a.createdAt);
    },
    get(id: string): Order | undefined {
      return orders.find((o) => o.id === id);
    },
    add(input: { table: string; items: OrderItem[]; note?: string }): Order {
      const now = Date.now();
      // Tapas komen in rondes: elke bestelling aan dezelfde tafel is de
      // volgende ronde, zodat de keuken ziet wat bij elkaar hoort.
      const tafel = input.table.trim().toLowerCase();
      const ronde =
        orders.filter((o) => o.table.trim().toLowerCase() === tafel).length + 1;
      const order: Order = {
        id: crypto.randomUUID(),
        table: input.table,
        ronde,
        items: input.items,
        note: input.note?.trim() || undefined,
        status: "nieuw",
        createdAt: now,
        updatedAt: now,
      };
      orders.push(order);
      notify();
      return order;
    },
    updateStatus(id: string, status: OrderStatus): Order | undefined {
      const order = orders.find((o) => o.id === id);
      if (!order) return undefined;
      order.status = status;
      order.updatedAt = Date.now();
      notify();
      return order;
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
