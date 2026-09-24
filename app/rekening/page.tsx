"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatPrice, formatTijdstip } from "@/lib/format";
import { Rosette } from "@/components/decor";

type Item = { id: string; name: string; price: number; quantity: number };
type Order = {
  id: string;
  table: string;
  items: Item[];
  status: string;
  createdAt: number;
};
type Sessie = {
  id: string;
  table: string;
  bedrag: number;
  status: "open" | "betaald";
  createdAt: number;
  betaaldOp?: number;
  laatsteVier?: string;
};

export default function RekeningPage() {
  return (
    <Suspense
      fallback={
        <main className="rekening-page">
          <div className="rekening-card">
            <p className="eyebrow">Las Tapas</p>
            <p>Rekening laden…</p>
          </div>
        </main>
      }
    >
      <RekeningInner />
    </Suspense>
  );
}

function RekeningInner() {
  const searchParams = useSearchParams();
  const table = searchParams.get("tafel") ?? "";

  const [sessie, setSessie] = useState<Sessie | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fout, setFout] = useState("");
  const [laden, setLaden] = useState(true);

  // De fout bij een ontbrekend tafelnummer is afgeleid uit de link zelf en
  // hoeft dus geen state te zijn.
  const tafelOntbreekt = !table.trim();

  // De rekening starten (of verversen): het bedrag wordt hier server-side
  // berekend, de browser stuurt alleen het tafelnummer mee.
  function startRekening() {
    fetch("/api/betalen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setFout(data.error);
        } else {
          setSessie(data.sessie);
          setFout("");
        }
      })
      .catch(() => setFout("Geen verbinding met de server."))
      .finally(() => setLaden(false));
  }

  useEffect(() => {
    if (tafelOntbreekt) return;
    startRekening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tafelOntbreekt, table]);

  // Live meekijken met de bestellingen van deze tafel, zodat er nageserveerd
  // kan worden en de rekening dat ziet.
  useEffect(() => {
    if (tafelOntbreekt) return;
    const bron = new EventSource("/api/orders/stream");
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
  }, [tafelOntbreekt, table]);

  // Kontrole op de pagina zelf: is er nageserveerd sinds de rekening startte?
  const klantTotaal = useMemo(
    () =>
      orders.reduce(
        (som, o) => som + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
        0
      ),
    [orders]
  );
  const isNageserveerd =
    sessie !== null && sessie.status === "open" && klantTotaal !== sessie.bedrag;

  return (
    <main className="rekening-page">
      <div className="rekening-card">
        {tafelOntbreekt ? (
          <>
            <p className="eyebrow">Las Tapas</p>
            <h1>Rekening niet gevonden</h1>
            <p>Er is geen tafelnummer meegegeven in de link.</p>
            <div className="rekening-acties">
              <Link href="/" className="button">
                Terug naar de homepage
              </Link>
            </div>
          </>
        ) : laden ? (
          <>
            <p className="eyebrow">Las Tapas</p>
            <p>Rekening laden…</p>
          </>
        ) : fout ? (
          <>
            <p className="eyebrow">Las Tapas</p>
            <h1>Rekening niet gevonden</h1>
            <p>{fout}</p>
            <div className="rekening-acties">
              <Link href="/" className="button">
                Terug naar de homepage
              </Link>
            </div>
          </>
        ) : sessie ? (
          sessie.status === "betaald" ? (
            <>
              <Rosette size={72} />
              <p className="eyebrow">¡Gracias!</p>
              <h1>Deze tafel is afgerekend</h1>
              <p>
                {formatPrice(sessie.bedrag)} betaald met kaart{" "}
                <b>•••• {sessie.laatsteVier}</b> om{" "}
                {sessie.betaaldOp ? formatTijdstip(sessie.betaaldOp) : ""}
                .
              </p>
              <div className="rekening-acties">
                <Link
                  href={`/menu?tafel=${encodeURIComponent(sessie.table)}`}
                  className="button"
                >
                  Nog iets bestellen
                </Link>
                <Link
                  href={`/status?tafel=${encodeURIComponent(sessie.table)}`}
                  className="rekening-klein"
                >
                  Status van de bestelling bekijken
                </Link>
              </div>
            </>
          ) : (
            <>
              <header className="rekening-header">
                <span className="brand-mark" aria-hidden="true">
                  L
                </span>
                <div>
                  <p className="eyebrow">Bar de tapas</p>
                  <h1>Rekening tafel {sessie.table}</h1>
                </div>
              </header>

              {orders.length === 0 ? (
                <p>
                  Er zijn (nog) geen bestellingen voor deze tafel. Bestel eerst
                  via de menukaart.
                </p>
              ) : (
                <div className="rekening-lijst">
                  {orders.map((order) => (
                    <section key={order.id}>
                      <p className="rekening-groepkop">
                        Bestelling · {formatTijdstip(order.createdAt)}
                      </p>
                      {order.items.map((item) => (
                        <div className="rekening-rij" key={item.id}>
                          <span>
                            {item.quantity}× {item.name}
                          </span>
                          <span>
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              )}

              <div className="rekening-totaal">
                <div>
                  <small>Te betalen (door de server berekend)</small>
                  <span className="rekening-bedrag">
                    {formatPrice(sessie.bedrag)}
                  </span>
                </div>
                {isNageserveerd && (
                  <button
                    type="button"
                    onClick={startRekening}
                    className="button rekening-ververs"
                  >
                    Rekening bijwerken
                  </button>
                )}
              </div>

              <div className="rekening-acties">
                <Link
                  href={`/betalen/${sessie.id}`}
                  className="button rekening-betaalknop"
                >
                  Afrekenen · {formatPrice(sessie.bedrag)}
                </Link>
                <Link
                  href={`/status?tafel=${encodeURIComponent(sessie.table)}`}
                  className="rekening-klein"
                >
                  Status van de bestelling bekijken
                </Link>
                <p className="rekening-klein">
                  De betaling loopt via een beveiligde pagina. Je
                  kaartgegevens worden door het restaurant niet opgeslagen.
                </p>
              </div>
            </>
          )
        ) : null}
      </div>
    </main>
  );
}
