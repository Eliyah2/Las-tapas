"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

type Status = "nieuw" | "bereiden" | "klaar";
type Item = { id: string; name: string; price: number; quantity: number };
type Order = {
  id: string; table: string; items: Item[]; note?: string;
  status: Status; createdAt: number; updatedAt: number;
};

// Eén rij per kolom: titel, kleur en de actie die de bestelling naar de volgende status brengt.
const COLUMNS: { status: Status; title: string; dot: string; next: Status; label: string; btn: string }[] = [
  { status: "nieuw", title: "Nieuw", dot: "bg-red-500", next: "bereiden", label: "Start bereiding", btn: "bg-amber-400 text-black" },
  { status: "bereiden", title: "In bereiding", dot: "bg-amber-400", next: "klaar", label: "Gereed voor uitserveren", btn: "bg-emerald-400 text-black" },
  { status: "klaar", title: "Gereed voor uitserveren", dot: "bg-emerald-400", next: "nieuw", label: "Terug naar nieuw", btn: "ring-1 ring-white/25 text-white/80" },
];

const total = (o: Order) => o.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
const waitColor = (min: number) =>
  min >= 15 ? "text-red-400" : min >= 8 ? "text-amber-400" : "text-white/70";

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Live bestellingen via Server-Sent Events.
    const es = new EventSource("/api/orders/stream");
    es.addEventListener("open", () => setConnected(true));
    es.addEventListener("error", () => setConnected(false));
    es.addEventListener("orders", (e) => setOrders(JSON.parse((e as MessageEvent).data)));

    // Voorraadteller en klok, allebei elke minuut.
    const loadStock = () =>
      fetch("/api/voorraad/beschikbaar", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setLowStock(d.samenvatting?.onderPar ?? 0))
        .catch(() => setLowStock(0));
    loadStock();
    const timers = [
      window.setInterval(loadStock, 60_000),
      window.setInterval(() => setNow(Date.now()), 30_000),
      window.setTimeout(() => setNow(Date.now()), 0),
    ];
    return () => {
      timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
      es.close();
    };
  }, []);

  async function move(id: string, status: Status) {
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!res?.ok) setError("Status wijzigen mislukt. Controleer de verbinding en probeer opnieuw.");
    setBusyId(null); // de stream stuurt de nieuwe lijst automatisch mee
  }

  return (
    <main className="flex min-h-dvh flex-col bg-[#0e1116] text-[#eef0f3]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <h1 className="text-3xl font-extrabold">Las Tapas <span className="text-lg font-medium text-white/50">Keuken</span></h1>
        <div className="flex flex-wrap items-center gap-3 text-base font-semibold">
          <Link href="/uitgifte" className="rounded-xl px-4 py-2.5 ring-1 ring-white/15 hover:bg-white/5">Pakken</Link>
          <Link href="/voorraad" className="rounded-xl px-4 py-2.5 ring-1 ring-white/15 hover:bg-white/5">
            Voorraad{lowStock > 0 && <span className="ml-2 rounded-full bg-red-500 px-2 text-sm">{lowStock}</span>}
          </Link>
          <span role="status" className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5">
            <span className={`size-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-red-500"}`} />
            {connected ? "Live verbonden" : "Verbinding verbroken"}
          </span>
        </div>
      </header>

      {error && <p role="alert" className="mx-6 mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-red-200">{error}</p>}

      <div className="grid flex-1 items-start gap-4 p-4 md:grid-cols-3 md:p-6">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status).sort((a, b) => a.createdAt - b.createdAt);
          return (
            <section key={col.status} className="rounded-3xl bg-white/[0.03] p-3">
              <h2 className="mb-3 flex items-center justify-between px-1 text-xl font-bold">
                <span className="flex items-center gap-3"><i className={`size-3 rounded-full ${col.dot}`} />{col.title}</span>
                <span className="rounded-full bg-white/10 px-3 text-base tabular-nums">{list.length}</span>
              </h2>
              <div className="flex flex-col gap-4">
                {list.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 py-10 text-center text-white/50">Geen bestellingen</p>}
                {list.map((o) => {
                  // Wachttijd: sinds binnenkomst, of bij "klaar" sinds het klaar is.
                  const min = now ? Math.floor((now - (o.status === "klaar" ? o.updatedAt : o.createdAt)) / 60_000) : 0;
                  return (
                    <article key={o.id} className={`rounded-2xl border bg-[#171c23] p-5 ${min >= 15 ? "border-red-500/70" : "border-white/10"}`}>
                      <div className="flex items-end justify-between border-b-2 border-dashed border-white/15 pb-4">
                        <p className="text-5xl font-extrabold leading-none tabular-nums"><span className="block text-sm font-medium text-white/50">Tafel</span>{o.table}</p>
                        <p className={`text-2xl font-bold tabular-nums ${waitColor(min)}`}>{min < 1 ? "net binnen" : `${min} min`}</p>
                      </div>
                      <ul className="mt-4 space-y-2 text-xl">
                        {o.items.map((i) => (
                          <li key={i.id}><b className="mr-2 text-amber-400">{i.quantity}×</b>{i.name}</li>
                        ))}
                      </ul>
                      {o.note && <p className="mt-4 rounded-xl bg-amber-400/10 px-4 py-3 text-amber-200">{o.note}</p>}
                      <button
                        onClick={() => move(o.id, col.next)}
                        disabled={busyId === o.id}
                        className={`mt-5 min-h-14 w-full rounded-xl text-lg font-bold disabled:opacity-50 ${col.btn}`}
                      >
                        {busyId === o.id ? "Bezig…" : col.label}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="border-t border-white/10 px-6 py-3 text-white/60">
        Totaal vandaag: {orders.length} bestellingen, {formatPrice(orders.reduce((s, o) => s + total(o), 0))}
      </footer>
    </main>
  );
}