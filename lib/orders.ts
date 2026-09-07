// In-memory order store. Genoeg voor één restaurant op één server-instance.
// Wissel dit later om voor een database (bv. SQLite/Postgres) als je wilt dat
// orders een server-herstart overleven.

export type OrderStatus = "nieuw" | "bereiden" | "klaar";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  table: string;
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
      const order: Order = {
        id: crypto.randomUUID(),
        table: input.table,
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
