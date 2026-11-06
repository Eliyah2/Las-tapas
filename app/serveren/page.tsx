"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import IdleScherm from "@/components/idle-scherm";
import { isAllergie } from "@/lib/opmerking";
import { perTafel, type Order } from "@/lib/orders";

const wachtKleur = (min: number) =>
  min >= 5 ? "text-red-400" : min >= 2 ? "text-amber-400" : "text-white/60";

const aantalGerechten = (orders: Order[]) =>
  orders.reduce(
    (som, order) => som + order.items.reduce((n, item) => n + item.quantity, 0),
    0
  );

/**
 * Uitserveerscherm voor de obers: alleen wat de keuken gereed heeft gemeld,
 * per tafel, met de naam van de gast en de opmerking erbij. Eén tik op
 * "Geserveerd" haalt de bestelling van dit scherm en zet de gaststatus op
 * geserveerd.
 */
export default function ServerenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const es = new EventSource("/api/orders/stream");
    es.addEventListener("open", () => setConnected(true));
    es.addEventListener("error", () => setConnected(false));
    es.addEventListener("orders", (e) =>
      setOrders(JSON.parse((e as MessageEvent).data))
    );

    const timers = [
      window.setInterval(() => setNow(Date.now()), 20_000),
      window.setTimeout(() => setNow(Date.now()), 0),
    ];

    return () => {
      timers.forEach((t) => {
        clearInterval(t);
        clearTimeout(t);
      });
      es.close();
    };
  }, []);

  async function geserveerd(id: string) {
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "geserveerd" }),
    }).catch(() => null);
    if (!res?.ok)
      setError("Kon niet op geserveerd zetten. Controleer de verbinding.");
    setBusyId(null);
  }

  const gereed = perTafel(orders.filter((o) => o.status === "klaar"));
  const onderweg = orders.filter(
    (o) => o.status === "nieuw" || o.status === "bereiden"
  );
  const tafelsOnderweg = [...new Set(onderweg.map((o) => o.table))];

  return (
    <main className="flex min-h-dvh flex-col bg-[#17110f] text-[#eef0f3]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#f0b429] bg-[#8c1219] px-5 py-3">
        <h1 className="text-2xl font-extrabold text-white">
          Las Tapas{" "}
          <span className="text-base font-medium text-white/70">Serveren</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link
            href="/keuken"
            className="rounded-xl px-3 py-2 ring-1 ring-white/15 hover:bg-white/5"
          >
            Keuken
          </Link>
          <Link
            href="/voorraad"
            className="rounded-xl px-3 py-2 ring-1 ring-white/15 hover:bg-white/5"
          >
            Voorraad
          </Link>
          <span
            role="status"
            className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2"
          >
            <span
              className={`size-2.5 rounded-full ${
                connected ? "bg-emerald-400" : "bg-red-500"
              }`}
            />
            {connected ? "Live verbonden" : "Verbinding verbroken"}
          </span>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mx-4 mt-3 rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h2 className="flex items-center gap-3 text-lg font-bold text-white">
          <span className="size-2.5 rounded-full bg-emerald-400" />
          Klaar om te serveren
          <span className="rounded-full bg-white/10 px-2.5 text-sm tabular-nums">
            {gereed.length}
          </span>
        </h2>

        {gereed.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 py-16 text-center text-lg text-white/45">
            Niets om te serveren. Zodra de keuken iets gereed meldt, staat het
            hier.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {gereed.map((groep) => (
              <section
                key={groep.tafel}
                className="rounded-2xl border border-emerald-400/40 bg-[#241b18] p-4"
              >
                <div className="flex items-start justify-between border-b-2 border-dashed border-white/15 pb-2">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-wide text-white/45">
                      Naar tafel
                    </p>
                    <p className="text-5xl font-extrabold leading-none tabular-nums">
                      {groep.tafel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold tabular-nums">
                      {aantalGerechten(groep.orders)}×
                    </p>
                    {now && (
                      <p
                        className={`mt-1 text-sm font-bold tabular-nums ${wachtKleur(
                          Math.max(
                            0,
                            Math.floor(
                              (now -
                                Math.min(...groep.orders.map((o) => o.updatedAt))) /
                                60_000
                            )
                          )
                        )}`}
                      >
                        {Math.max(
                          0,
                          Math.floor(
                            (now -
                              Math.min(...groep.orders.map((o) => o.updatedAt))) /
                              60_000
                          )
                        )}{" "}
                        min klaar
                      </p>
                    )}
                  </div>
                </div>

                {groep.orders.map((order) => (
                  <div key={order.id} className="pt-3">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-300">
                      Ronde {order.ronde}
                    </p>
                    <ul className="space-y-1.5">
                      {order.items.map((item) => (
                        <li
                          key={`${item.id}-${item.voor ?? ""}`}
                          className="flex flex-wrap items-baseline gap-x-2"
                        >
                          <b className="text-lg text-amber-400">
                            {item.quantity}×
                          </b>
                          <span className="text-lg font-semibold">
                            {item.name}
                          </span>
                          {item.voor && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/85">
                              {item.voor}
                            </span>
                          )}
                          {item.opmerking && (
                            <span
                              className={`mt-1 basis-full rounded-lg px-2 py-1 text-sm font-bold ${
                                isAllergie(item.opmerking)
                                  ? "bg-red-600 uppercase tracking-wide text-white"
                                  : "bg-amber-400/15 text-amber-200"
                              }`}
                            >
                              {isAllergie(item.opmerking)
                                ? `Allergie · ${item.opmerking}`
                                : `Let op · ${item.opmerking}`}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>

                    {order.note && (
                      <p className="mt-1.5 rounded-lg bg-amber-400/10 px-2.5 py-1.5 text-sm text-amber-200">
                        Tafelnotitie · {order.note}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => geserveerd(order.id)}
                      disabled={busyId === order.id}
                      className="mt-2 min-h-14 w-full rounded-xl bg-emerald-400 text-base font-extrabold text-black disabled:opacity-50"
                    >
                      {busyId === order.id ? "Bezig…" : "Geserveerd"}
                    </button>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}

        {/* Wat nog in de keuken staat, zodat de ober weet wat eraan komt. */}
        <div className="mt-auto rounded-xl bg-white/[0.03] px-3 py-2 text-sm text-white/60">
          Nog in de keuken: {onderweg.length} bestellingen
          {tafelsOnderweg.length > 0 && ` · tafel ${tafelsOnderweg.join(", ")}`}
        </div>
      </div>

      <IdleScherm />
    </main>
  );
}
