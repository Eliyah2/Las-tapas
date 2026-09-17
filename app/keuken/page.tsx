"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [now, setNow] = useState(0);
  const [onderPar, setOnderPar] = useState(0);

  useEffect(() => {
    const es = new EventSource("/api/orders/stream");
    es.addEventListener("open", () => setConnected(true));
    es.addEventListener("orders", (event) => {
      setOrders(JSON.parse((event as MessageEvent).data) as Order[]);
    });
    es.addEventListener("error", () => setConnected(false));
    // Hoeveel producten er bijbesteld moeten worden, apart opgehaald zodat het
    // keukenscherm niet afhankelijk is van de voorraadstroom.
    const haalVoorraad = () => {
      fetch("/api/voorraad/beschikbaar", { cache: "no-store" })
        .then((antwoord) => antwoord.json())
        .then((data: { samenvatting?: { onderPar?: number } }) =>
          setOnderPar(data.samenvatting?.onderPar ?? 0)
        )
        .catch(() => setOnderPar(0));
    };
    haalVoorraad();
    const voorraadKlok = window.setInterval(haalVoorraad, 60_000);

    const clock = window.setInterval(() => setNow(Date.now()), 60_000);
    // Eerste meting pas ná de render, zodat React geen extra render krijgt.
    const firstTick = window.setTimeout(() => setNow(Date.now()), 0);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(voorraadKlok);
      window.clearTimeout(firstTick);
      es.close();
    };
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
    const minutes = now === 0 ? 0 : Math.floor((now - ts) / 60_000);
    if (minutes < 1) return "net binnen";
    if (minutes === 1) return "1 min";
    return `${minutes} min`;
  }

  return (
    <main className="kitchen-page">
      <header className="kitchen-header">
        <div className="kitchen-title">
          <span className="menu-brand-mark" aria-hidden="true">L</span>
          <div>
            <p>Las Tapas · pase de cocina</p>
            <h1>Bestellingen</h1>
          </div>
        </div>
        <div className="kitchen-header-rechts">
          <Link href="/uitgifte" className="mini-button ghost">
            Pakken
          </Link>
          <Link href="/voorraad" className="mini-button ghost">
            Voorraad
            {onderPar > 0 && (
              <span className="kitchen-voorraad-teller">{onderPar}</span>
            )}
          </Link>
          <span className="connection-pill">
            <span className={`connection-dot ${connected ? "live" : "offline"}`} />
            {connected ? "Live verbonden" : "Verbinding verbroken…"}
          </span>
        </div>
      </header>

      <div className="kitchen-grid">
        {COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <section
              key={col.status}
              className={`kitchen-column ${col.status === "bereiden" ? "preparing" : ""} ${col.status === "klaar" ? "ready" : ""}`}
            >
              <h2 className="kitchen-column-heading">
                {col.title}
                <span className="kitchen-count">
                  {columnOrders.length}
                </span>
              </h2>
              <div className="kitchen-orders">
                {columnOrders.length === 0 && (
                  <p className="kitchen-empty">Geen bestellingen</p>
                )}
                {columnOrders.map((order) => (
                  <article
                    key={order.id}
                    className="order-card"
                  >
                    <div className="order-card-top">
                      <p className="order-table">Tafel {order.table}</p>
                      <span className="order-time">
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>
                    <ul className="order-items">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <span className="font-bold">{item.quantity}×</span>{" "}
                          {item.name}
                        </li>
                      ))}
                    </ul>
                    {order.note && (
                      <p className="order-note">✦ {order.note}</p>
                    )}
                    <div>
                      {order.status === "nieuw" && (
                        <button
                          onClick={() => setStatus(order.id, "bereiden")}
                          className="order-status-button start"
                        >
                          Start bereiding
                        </button>
                      )}
                      {order.status === "bereiden" && (
                        <button
                          onClick={() => setStatus(order.id, "klaar")}
                          className="order-status-button done"
                        >
                          Gereed
                        </button>
                      )}
                      {order.status === "klaar" && (
                        <button
                          onClick={() => setStatus(order.id, "nieuw")}
                          className="order-status-button reset"
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

      <footer className="kitchen-footer">
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
