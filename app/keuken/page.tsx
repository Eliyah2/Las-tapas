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

/**
 * Tafelnummers op volgorde van het getal: 2 staat voor 10. Zo leest de keuken
 * het scherm van links naar rechts als de tafels in het restaurant.
 */
function tafelVolgorde(a: string, b: string): number {
  const getal = (tafel: string) => {
    const match = tafel.match(/\d+/);
    return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
  };
  const verschil = getal(a) - getal(b);
  return verschil !== 0
    ? verschil
    : a.localeCompare(b, "nl", { numeric: true });
}

/** Heeft er iets op deze tafel een allergie-opmerking? Dan valt de tegel op. */
const heeftAllergie = (orders: Order[]) =>
  orders.some((order) =>
    order.items.some((item) => item.opmerking && isAllergie(item.opmerking))
  );

/** Hoe lang staat deze tegel al te wachten? Bij "gereed" sinds het gereed was. */
function wachtMinuten(status: OrderStatus, orders: Order[], now: number) {
  const start =
    status === "klaar"
      ? Math.min(...orders.map((order) => order.updatedAt))
      : orders[0].createdAt;
  return now ? Math.max(0, Math.floor((now - start) / 60_000)) : 0;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  // Welke tegel openstaat in de overlay: status + tafel.
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

  // Per kolom de tegels, op tafelnummer gesorteerd. De volgorde ligt dus vast:
  // tafel 3 staat altijd op dezelfde plek, ook als er iets bijkomt.
  const kolommen = KOLOMMEN.map((kol) => ({
    ...kol,
    groepen: perTafel(orders.filter((order) => order.status === kol.status))
      .sort((a, b) => tafelVolgorde(a.tafel, b.tafel)),
  }));

  const open = openTegel
    ? kolommen
        .flatMap((kol) =>
          kol.groepen.map((groep) => ({
            kol,
            groep,
            sleutel: `${kol.status}:${groep.tafel}`,
          }))
        )
        .find((tegel) => tegel.sleutel === openTegel)
    : undefined;

  return (
    <main className="keuken-page flex h-dvh flex-col overflow-hidden bg-[#17110f] text-[#eef0f3]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-2 border-[#f0b429] bg-[#8c1219] px-4 py-2">
        <h1 className="text-xl font-extrabold text-white">
          Las Tapas{" "}
          <span className="text-sm font-medium text-white/70">Keuken</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link
            href="/serveren"
            className="rounded-xl px-2.5 py-1.5 ring-1 ring-white/15 hover:bg-white/5"
          >
            Serveren
          </Link>
          <Link
            href="/uitgifte"
            className="rounded-xl px-2.5 py-1.5 ring-1 ring-white/15 hover:bg-white/5"
          >
            Pakken
          </Link>
          <Link
            href="/voorraad"
            className="rounded-xl px-2.5 py-1.5 ring-1 ring-white/15 hover:bg-white/5"
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
            className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5"
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
          className="mx-3 mt-2 shrink-0 rounded-xl bg-red-500/15 px-3 py-1.5 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      {/* Drie kolommen, elk met kleine tegels per tafel: twee naast elkaar en
          zoveel rijen als passen. Het geheel vult precies één scherm, dus er
          hoeft niet gescrold te worden om te zien wat er loopt. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 md:grid-cols-3">
        {kolommen.map((kol) => (
          <section
            key={kol.status}
            className="flex min-h-0 flex-col rounded-2xl bg-white/[0.03] p-2"
          >
            <h2 className="mb-1.5 flex shrink-0 items-center justify-between px-1 text-base font-bold text-white">
              <span className="flex items-center gap-2">
                <i className={`size-2.5 rounded-full ${kol.stip}`} />
                {kol.titel}
              </span>
              <span className="rounded-full bg-white/10 px-2 text-sm tabular-nums">
                {kol.groepen.length}
              </span>
            </h2>

            <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-1.5 overflow-y-auto 2xl:grid-cols-3">
              {kol.groepen.length === 0 && (
                <p className="col-span-full rounded-xl border border-dashed border-white/15 py-6 text-center text-sm text-white/45">
                  Geen bestellingen
                </p>
              )}

              {kol.groepen.map((groep) => {
                const sleutel = `${kol.status}:${groep.tafel}`;
                const min = wachtMinuten(kol.status, groep.orders, now);
                const allergie = heeftAllergie(groep.orders);

                return (
                  <button
                    key={sleutel}
                    type="button"
                    onClick={() => setOpenTegel(sleutel)}
                    aria-label={`Tafel ${groep.tafel}, ${aantalGerechten(
                      groep.orders
                    )} gerechten, ${
                      min < 1 ? "net binnen" : `${min} minuten`
                    }`}
                    className={`flex min-h-0 flex-col justify-between gap-1 rounded-xl border bg-[#241b18] px-2.5 py-1.5 text-left hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none ${
                      min >= 15
                        ? "border-red-500/60"
                        : allergie
                          ? "border-red-400/40"
                          : "border-white/10"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span className="text-[0.6rem] tracking-wide text-white/45 uppercase">
                        Tafel
                      </span>
                      {allergie && (
                        <span className="rounded bg-red-600 px-1 text-[0.55rem] font-bold tracking-wide uppercase">
                          Allergie
                        </span>
                      )}
                    </span>
                    <span className="text-3xl leading-none font-extrabold tabular-nums">
                      {groep.tafel}
                    </span>
                    <span className="flex items-center justify-between gap-1 text-xs">
                      <span className="rounded-full bg-white/10 px-1.5 font-bold tabular-nums">
                        {aantalGerechten(groep.orders)}×
                      </span>
                      <span className={`font-bold tabular-nums ${wachtKleur(min)}`}>
                        {min < 1 ? "net" : `${min} min`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="shrink-0 border-t border-white/10 px-4 py-1.5 text-xs text-white/50">
        Vandaag {orders.length} bestellingen ·{" "}
        {orders.filter((o) => o.status === "geserveerd").length} geserveerd · tik
        op een tafel voor de gerechten
      </footer>

      {/* De gerechten van één tafel openen in een overlay: de indeling erachter
          blijft staan, dus het scherm verspringt nooit. */}
      {open && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-3"
          onClick={() => setOpenTegel(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Tafel ${open.groep.tafel}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#241b18] p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-2xl font-extrabold text-white">
                <i className={`size-3 rounded-full ${open.kol.stip}`} />
                Tafel {open.groep.tafel}
                <span className="text-sm font-medium text-white/60">
                  {open.kol.titel}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setOpenTegel(null)}
                className="rounded-xl px-3 py-2 text-sm font-bold ring-1 ring-white/20 hover:bg-white/5"
              >
                Sluiten
              </button>
            </div>

            {open.groep.orders.map((order) => (
              <div
                key={order.id}
                className="border-t border-white/10 py-2 first:border-0 first:pt-0"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[0.7rem] font-bold text-amber-300">
                    Ronde {order.ronde}
                  </span>
                  <span className="text-[0.7rem] text-white/40">
                    {order.items.reduce((n, item) => n + item.quantity, 0)}{" "}
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
                      {/* Eén opmerking per gerecht; een allergie valt op
                          zonder dat er een apart veld is. */}
                      {item.opmerking && (
                        <span
                          className={`mt-1 basis-full rounded-lg px-2 py-1 text-sm font-bold ${
                            isAllergie(item.opmerking)
                              ? "bg-red-600 tracking-wide text-white uppercase"
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
                  onClick={() => move(order.id, open.kol.volgende)}
                  disabled={busyId === order.id}
                  className={`mt-2 min-h-12 w-full rounded-lg text-sm font-bold disabled:opacity-50 ${open.kol.knop}`}
                >
                  {busyId === order.id ? "Bezig…" : open.kol.actie}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Na twintig seconden zonder aanraking dimt het scherm; de klok staat
          klein in de hoek. */}
      <IdleScherm />
    </main>
  );
}
