"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

type OrderItem = { id: string; name: string; price: number; quantity: number };

type Order = {
  id: string;
  table: string;
  items: OrderItem[];
  note?: string;
  status: "nieuw" | "bereiden" | "klaar";
  createdAt: number;
  updatedAt: number;
};

const COLUMNS: { status: Order["status"]; title: string; color: string }[] = [
  { status: "nieuw", title: "Nieuw", color: "border-red-500" },
  { status: "bereiden", title: "In bereiding", color: "border-amber-500" },
  { status: "klaar", title: "Klaar", color: "border-green-600" },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource("/api/orders/stream");
    es.addEventListener("open", () => setConnected(true));
    es.addEventListener("orders", (event) => {
      setOrders(JSON.parse((event as MessageEvent).data) as Order[]);
    });
    es.addEventListener("error", () => setConnected(false));
    return () => es.close();
  }, []);

  async function setStatus(id: string, status: Order["status"]) {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // De SSE-stream stuurt de nieuwe lijst automatisch mee.
  }

  function timeAgo(ts: number) {
    const minutes = Math.floor((Date.now() - ts) / 60_000);
    if (minutes < 1) return "net binnen";
    if (minutes === 1) return "1 min";
    return `${minutes} min`;
  }

  return (
    <main className="min-h-dvh bg-neutral-950 p-4 text-white">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Keuken · Las Tapas</h1>
        <span
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
            connected ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "animate-pulse bg-green-400" : "bg-red-400"
            }`}
          />
          {connected ? "Live" : "Verbinding verbroken…"}
        </span>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <section
              key={col.status}
              className={`rounded-xl border-t-4 ${col.color} bg-neutral-900 p-3`}
            >
              <h2 className="mb-3 flex items-center justify-between text-lg font-bold">
                {col.title}
                <span className="rounded-full bg-neutral-800 px-2 text-sm text-neutral-300">
                  {columnOrders.length}
                </span>
              </h2>
              <div className="flex flex-col gap-3">
                {columnOrders.length === 0 && (
                  <p className="text-sm text-neutral-500">Geen bestellingen</p>
                )}
                {columnOrders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-lg bg-neutral-800 p-3 text-sm"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-lg font-bold">Tafel {order.table}</p>
                      <span className="text-xs text-neutral-400">
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>
                    <ul className="mb-2 space-y-1">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <span className="font-bold">{item.quantity}×</span>{" "}
                          {item.name}
                        </li>
                      ))}
                    </ul>
                    {order.note && (
                      <p className="mb-2 rounded bg-amber-900/50 p-2 text-amber-200">
                        💬 {order.note}
                      </p>
                    )}
                    <div className="flex gap-2">
                      {order.status === "nieuw" && (
                        <button
                          onClick={() => setStatus(order.id, "bereiden")}
                          className="flex-1 rounded-md bg-amber-500 py-2 font-semibold text-neutral-950 active:scale-95"
                        >
                          Start bereiding
                        </button>
                      )}
                      {order.status === "bereiden" && (
                        <button
                          onClick={() => setStatus(order.id, "klaar")}
                          className="flex-1 rounded-md bg-green-600 py-2 font-semibold text-white active:scale-95"
                        >
                          Gereed
                        </button>
                      )}
                      {order.status === "klaar" && (
                        <button
                          onClick={() => setStatus(order.id, "nieuw")}
                          className="flex-1 rounded-md bg-neutral-700 py-2 font-semibold text-neutral-300"
                        >
                          Reset (server opruimen)
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="mt-6 text-right text-sm text-neutral-500">
        Totaal vandaag: {orders.length} bestellingen ·{" "}
        {formatPrice(
          orders.reduce(
            (sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
            0
          )
        )}
      </footer>
    </main>
  );
}
