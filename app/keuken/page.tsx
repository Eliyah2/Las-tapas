"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import IdleScherm from "@/components/idle-scherm";
import { isAllergie } from "@/lib/opmerking";
import { perTafel, type Order, type OrderStatus } from "@/lib/orders";

// Eén kolom per status. De woorden zijn die van de keuken zelf: ontvangen,
// in bereiding, gereed.
const KOLOMMEN: {
  status: OrderStatus;
  titel: string;
  stip: string;
  volgende: OrderStatus;
  actie: string;
  knop: string;
}[] = [
  {
    status: "nieuw",
    titel: "Ontvangen",
    stip: "bg-red-500",
    volgende: "bereiden",
    actie: "Start bereiding",
    knop: "bg-amber-400 text-black",
  },
  {
    status: "bereiden",
    titel: "In bereiding",
    stip: "bg-amber-400",
    volgende: "klaar",
    actie: "Gereed voor uitserveren",
    knop: "bg-emerald-400 text-black",
  },
  {
    status: "klaar",
    titel: "Gereed · bij de obers",
    stip: "bg-emerald-400",
    volgende: "bereiden",
    actie: "Terug naar bereiding",
    knop: "ring-1 ring-white/25 text-white/80",
  },
];

const wachtKleur = (min: number) =>
  min >= 15 ? "text-red-400" : min >= 8 ? "text-amber-400" : "text-white/60";

const aantalGerechten = (orders: Order[]) =>
  orders.reduce(
    (som, order) =>
      som + order.items.reduce((n, item) => n + item.quantity, 0),
    0
  );

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  // Welke tegel is opengeklapt: status + tafel, zodat er maar één tegelijk open is.
  const [openTegel, setOpenTegel] = useState<string | null>(null);

  useEffect(() => {
    // Live bestellingen via Server-Sent Events.
    const es = new EventSource("/api/orders/stream");
    es.addEventListener("open", () => setConnected(true));
    es.addEventListener("error", () => setConnected(false));
    es.addEventListener("orders", (e) =>
      setOrders(JSON.parse((e as MessageEvent).data))
    );

    // Voorraadteller en klok, allebei met een ruime interval: het scherm hangt
    // de hele dag aan de muur en hoeft niet elke seconde te werken.
    const loadStock = () =>
      fetch("/api/voorraad/beschikbaar", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setLowStock(d.samenvatting?.onderPar ?? 0))
        .catch(() => setLowStock(0));
    loadStock();
    const timers = [
      window.setInterval(loadStock, 60_000),
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

  async function move(id: string, status: OrderStatus) {
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!res?.ok)
      setError(
        "Status wijzigen mislukt. Controleer de verbinding en probeer opnieuw."
      );
    setBusyId(null); // de stream stuurt de nieuwe lijst automatisch mee
  }

  return (
    <main className="keuken-page flex min-h-dvh flex-col bg-[#17110f] text-[#eef0f3]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#f0b429] bg-[#8c1219] px-5 py-3">
        <h1 className="text-2xl font-extrabold text-white">
          Las Tapas{" "}
          <span className="text-base font-medium text-white/70">Keuken</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link
            href="/serveren"
            className="rounded-xl px-3 py-2 ring-1 ring-white/15 hover:bg-white/5"
          >
            Serveren
          </Link>
          <Link
            href="/uitgifte"
            className="rounded-xl px-3 py-2 ring-1 ring-white/15 hover:bg-white/5"
          >
            Pakken
          </Link>
          <Link
            href="/voorraad"
            className="rounded-xl px-3 py-2 ring-1 ring-white/15 hover:bg-white/5"
          >
            Voorraad
            {lowStock > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2 text-xs">
                {lowStock}
              </span>
            )}
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

      {/* Drie kolommen naast elkaar; op een smaller scherm twee, zodat er op
          een wandscherm meer naast elkaar past en er minder gescrold wordt. */}
      <div className="grid flex-1 items-start gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
        {KOLOMMEN.map((kol) => {
          const groepen = perTafel(
            orders.filter((o) => o.status === kol.status)
          );
          return (
            <section key={kol.status} className="rounded-2xl bg-white/[0.03] p-2.5">
              <h2 className="mb-2 flex items-center justify-between px-1 text-lg font-bold text-white">
                <span className="flex items-center gap-2">
                  <i className={`size-2.5 rounded-full ${kol.stip}`} />
                  {kol.titel}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 text-sm tabular-nums">
                  {groepen.length}
                </span>
              </h2>

              <div className="flex flex-col gap-2">
                {groepen.length === 0 && (
                  <p className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-white/45">
                    Geen bestellingen
                  </p>
                )}

                {groepen.map((groep) => {
                  const sleutel = `${kol.status}:${groep.tafel}`;
                  const open = openTegel === sleutel;
                  // Bij "gereed" telt de tijd sinds het gereed was, anders sinds
                  // de bestelling binnenkwam. De oudste wacht bovenaan.
                  const start =
                    kol.status === "klaar"
                      ? Math.min(...groep.orders.map((o) => o.updatedAt))
                      : groep.orders[0].createdAt;
                  const min = now
                    ? Math.max(0, Math.floor((now - start) / 60_000))
                    : 0;

                  return (
                    <article
                      key={sleutel}
                      className={`overflow-hidden rounded-xl border bg-[#241b18] ${
                        min >= 15 ? "border-red-500/60" : "border-white/10"
                      }`}
                    >
                      {/* Kleine tegel per tafel: tik om de gerechten te zien. */}
                      <button
                        type="button"
                        onClick={() => setOpenTegel(open ? null : sleutel)}
                        aria-expanded={open}
                        className="flex min-h-16 w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-white/[0.04]"
                      >
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-[0.65rem] uppercase tracking-wide text-white/45">
                            Tafel
                          </span>
                          <span className="text-3xl font-extrabold leading-none tabular-nums">
                            {groep.tafel}
                          </span>
                        </span>
                        <span className="flex items-center gap-2.5">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold tabular-nums">
                            {aantalGerechten(groep.orders)}×
                          </span>
                          <span
                            className={`text-sm font-bold tabular-nums ${wachtKleur(min)}`}
                          >
                            {min < 1 ? "net" : `${min} min`}
                          </span>
                          <span className="text-white/35" aria-hidden="true">
                            {open ? "▴" : "▾"}
                          </span>
                        </span>
                      </button>

                      {open && (
                        <div className="border-t border-white/10 px-3 pb-2">
                          {groep.orders.map((order) => (
                            <div
                              key={order.id}
                              className="border-t border-white/[0.07] py-2 first:border-0 first:pt-0"
                            >
                              <div className="mb-1 flex items-center justify-between">
                                <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[0.7rem] font-bold text-amber-300">
                                  Ronde {order.ronde}
                                </span>
                                <span className="text-[0.7rem] text-white/40">
                                  {order.items.reduce(
                                    (n, item) => n + item.quantity,
                                    0
                                  )}{" "}
                                  gerechten
                                </span>
                              </div>

                              <ul className="space-y-1">
                                {order.items.map((item) => (
                                  <li
                                    key={`${item.id}-${item.voor ?? ""}`}
                                    className="flex flex-wrap items-baseline gap-x-2"
                                  >
                                    <b className="text-base text-amber-400">
                                      {item.quantity}×
                                    </b>
                                    <span className="text-base font-semibold">
                                      {item.name}
                                    </span>
                                    {item.voor && (
                                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.7rem] font-bold text-white/85">
                                        {item.voor}
                                      </span>
                                    )}
                                    {/* Eén opmerking per gerecht; een allergie
                                        valt op zonder dat er een apart veld is. */}
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
                                onClick={() => move(order.id, kol.volgende)}
                                disabled={busyId === order.id}
                                className={`mt-2 min-h-12 w-full rounded-lg text-sm font-bold disabled:opacity-50 ${kol.knop}`}
                              >
                                {busyId === order.id ? "Bezig…" : kol.actie}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="border-t border-white/10 px-5 py-2 text-sm text-white/50">
        Vandaag {orders.length} bestellingen ·{" "}
        {orders.filter((o) => o.status === "geserveerd").length} geserveerd · tik
        op een tafel voor de gerechten
      </footer>

      {/* Na twintig seconden zonder aanraking dimt het scherm; de klok staat
          klein in de hoek. */}
      <IdleScherm />
    </main>
  );
}
