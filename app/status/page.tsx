"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatPrice, formatTijdstip } from "@/lib/format";

type Status = "nieuw" | "bereiden" | "klaar";
type Item = { id: string; name: string; price: number; quantity: number };
type Order = {
  id: string;
  table: string;
  items: Item[];
  note?: string;
  status: Status;
  createdAt: number;
};

const STAPPEN: { status: Status; label: string }[] = [
  { status: "nieuw", label: "Ontvangen" },
  { status: "bereiden", label: "In bereiding" },
  { status: "klaar", label: "Gereed voor uitserveren" },
];

const TEKST_PER_STATUS: Record<Status, string> = {
  nieuw: "De keuken heeft je bestelling ontvangen.",
  bereiden: "De kok is aan het koken.",
  klaar: "Gereed voor uitserveren — de bediening komt eraan!",
};

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <main className="status-page">
          <div className="status-card">
            <p>Status laden…</p>
          </div>
        </main>
      }
    >
      <StatusInner />
    </Suspense>
  );
}

function StatusInner() {
  const searchParams = useSearchParams();
  const table = searchParams.get("tafel") ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [verbonden, setVerbonden] = useState(false);

  // Live meekijken met de keuken: zodra de chef op "Gereed voor uitserveren"
  // drukt, verandert de status hier zonder verversen (Server-Sent Events).
  useEffect(() => {
    if (!table.trim()) return;
    const bron = new EventSource("/api/orders/stream");
    bron.addEventListener("open", () => setVerbonden(true));
    bron.addEventListener("error", () => setVerbonden(false));
    bron.addEventListener("orders", (event) => {
      const lijst = JSON.parse((event as MessageEvent).data) as Order[];
      const tafel = table.trim().toLowerCase();
      setOrders(
        lijst
          .filter((o) => o.table.trim().toLowerCase() === tafel)
          .sort((a, b) => a.createdAt - b.createdAt)
      );
    });
    return () => bron.close();
  }, [table]);

  const allesKlaar = useMemo(
    () => orders.length > 0 && orders.every((o) => o.status === "klaar"),
    [orders]
  );

  return (
    <main className="status-page">
      <div className="status-card">
        {!table.trim() ? (
          <>
            <h1>Status niet beschikbaar</h1>
            <p className="status-muted">
              Er is geen tafelnummer meegegeven in de link.
            </p>
            <Link href="/" className="button">
              Terug naar de homepage
            </Link>
          </>
        ) : orders.length === 0 ? (
          <>
            <p className="eyebrow">Bar de tapas</p>
            <h1>Tafel {table}</h1>
            <p className="status-muted">
              Er zijn nog geen bestellingen voor deze tafel. Bestel via de
              menukaart.
            </p>
            <Link
              href={`/menu?tafel=${encodeURIComponent(table)}`}
              className="button"
            >
              Naar de menukaart
            </Link>
          </>
        ) : (
          <>
            <header className="status-header">
              <span className="brand-mark" aria-hidden="true">L</span>
              <div>
                <p className="eyebrow">Bar de tapas</p>
                <h1>Status tafel {table}</h1>
                <span className={`status-verbinding ${verbonden ? "aan" : "uit"}`}>
                  {verbonden ? "Live" : "Opnieuw verbinden…"}
                </span>
              </div>
            </header>

            {allesKlaar && (
              <div className="status-klaar-badge" role="status">
                ✓ Alles staat gereed voor uitserveren
              </div>
            )}

            {orders.map((o) => (
              <article key={o.id} className="status-order">
                <p className="status-tijd">
                  Besteld om {formatTijdstip(o.createdAt)}
                </p>
                <ul className="status-items">
                  {o.items.map((i) => (
                    <li key={i.id}>
                      <b>{i.quantity}×</b> {i.name}
                      <span>{formatPrice(i.price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="status-melding">{TEKST_PER_STATUS[o.status]}</p>
                <div className="status-stappen" aria-label="Voortgang bestelling">
                  {STAPPEN.map((s) => {
                    const huidigeIndex = STAPPEN.findIndex(
                      (x) => x.status === o.status
                    );
                    const actief =
                      s.status === o.status ||
                      STAPPEN.findIndex((x) => x.status === s.status) <
                        huidigeIndex;
                    return (
                      <span
                        key={s.status}
                        className={`status-stap ${actief ? "actief" : ""}`}
                      >
                        {s.label}
                      </span>
                    );
                  })}
                </div>
              </article>
            ))}

            <div className="status-acties">
              <Link
                href={`/rekening?tafel=${encodeURIComponent(table)}`}
                className="button"
              >
                Afrekenen
              </Link>
              <Link
                href={`/menu?tafel=${encodeURIComponent(table)}`}
                className="status-klein"
              >
                Nog iets bestellen
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
