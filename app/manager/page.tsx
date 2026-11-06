"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

/* Manageroverzicht: alles wat de bedrijfsleiding in één blik wil zien.
   Links de schermen van de zaak (net als bij een gewoon beheerscherm),
   rechts de cijfers: bezetting per verdieping (uit dezelfde bron als het
   oberdashboard) en wat er vandaag is besteld. Geen eigen opslag: de cijfers
   komen uit /api/ober en uit de live bestellingen. */

type OrderStatus = "nieuw" | "bereiden" | "klaar" | "geserveerd";

type Order = {
  id: string;
  table: string;
  ronde: number;
  items: { id: string; name: string; price: number; quantity: number }[];
  status: OrderStatus;
  createdAt: number;
};

type Vloer = {
  id: string;
  naam: string;
  ondertitel: string;
  tafels: { code: string; bezet: boolean; personen: number }[];
  stoelen: number;
  bezet: number;
  gasten: number;
};

type Overzicht = {
  verdiepingen: Vloer[];
  kpi: {
    tafels: number;
    bezet: number;
    vrij: number;
    open: number;
    klaar: number;
    gasten: number;
    omzet: number;
  };
  bijgewerkt: number;
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  nieuw: "Nieuw",
  bereiden: "In bereiding",
  klaar: "Klaar om te serveren",
  geserveerd: "Geserveerd",
};

/* De schermen van de zaak, na Home en het overzicht zelf. */
const SCHERMEN = [
  { href: "/ober", naam: "Oberdashboard" },
  { href: "/keuken", naam: "Keukenscherm" },
  { href: "/uitgifte", naam: "Uitgifte" },
  { href: "/voorraad", naam: "Voorraad" },
  { href: "/qr", naam: "QR-codes" },
  { href: "/menu?tafel=5", naam: "Menukaart" },
];

function tijdKort(tijdstip: number): string {
  return new Date(tijdstip).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ManagerOverzicht() {
  const router = useRouter();
  const [data, setData] = useState<Overzicht | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fout, setFout] = useState("");
  const [laadt, setLaadt] = useState(false);

  const laad = useCallback(async () => {
    setLaadt(true);
    try {
      const antwoord = await fetch("/api/ober", { cache: "no-store" });
      if (!antwoord.ok) throw new Error(String(antwoord.status));
      setData((await antwoord.json()) as Overzicht);
      setFout("");
    } catch {
      setFout("Het overzicht kon niet geladen worden. Probeer het opnieuw.");
    } finally {
      setLaadt(false);
    }
  }, []);

  useEffect(() => {
    laad();
    const timer = window.setInterval(laad, 5000);
    return () => window.clearInterval(timer);
  }, [laad]);

  // Dezelfde live bron als het keukenscherm, zodat de cijfers meteen meelopen.
  useEffect(() => {
    const bron = new EventSource("/api/orders/stream");
    bron.addEventListener("orders", (event) => {
      setOrders(JSON.parse((event as MessageEvent).data) as Order[]);
    });
    return () => bron.close();
  }, []);

  async function uitloggen() {
    await fetch("/api/uitloggen", { method: "POST" });
    router.replace("/inloggen");
    router.refresh();
  }

  const perStatus = useMemo(() => {
    const telling: Record<OrderStatus, number> = {
      nieuw: 0,
      bereiden: 0,
      klaar: 0,
      geserveerd: 0,
    };
    for (const order of orders) {
      if (telling[order.status] !== undefined) telling[order.status] += 1;
    }
    return telling;
  }, [orders]);

  const bestelwaarde = useMemo(
    () =>
      orders.reduce(
        (som, order) =>
          som +
          order.items.reduce(
            (rijSom, item) => rijSom + item.price * item.quantity,
            0
          ),
        0
      ),
    [orders]
  );

  const populairst = useMemo(() => {
    const perGerecht = new Map<string, { naam: string; aantal: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const bestaand = perGerecht.get(item.id);
        if (bestaand) {
          bestaand.aantal += item.quantity;
        } else {
          perGerecht.set(item.id, {
            naam: item.name,
            aantal: item.quantity,
          });
        }
      }
    }
    return [...perGerecht.values()]
      .sort((a, b) => b.aantal - a.aantal)
      .slice(0, 5);
  }, [orders]);

  const kpi = data?.kpi;
  const meesteAantal = populairst[0]?.aantal ?? 0;

  return (
    <div className="mgr-pagina">
      <aside className="mgr-zij">
        <div className="mgr-zij-merk">
          <span className="mgr-zij-mark" aria-hidden="true">
            L
          </span>
          <div>
            <p className="mgr-zij-naam">Las Tapas</p>
            <p className="mgr-zij-sub">Beheersysteem</p>
          </div>
        </div>

        <p className="mgr-zij-kop">Schermen</p>
        <nav className="mgr-zij-nav" aria-label="Schermen van de zaak">
          <Link href="/" className="mgr-zij-link">
            Home
          </Link>
          <Link
            href="/manager"
            className="mgr-zij-link actief"
            aria-current="page"
          >
            Manageroverzicht
          </Link>
          {SCHERMEN.map((scherm) => (
            <Link key={scherm.href} href={scherm.href} className="mgr-zij-link">
              {scherm.naam}
            </Link>
          ))}
        </nav>

        <button type="button" onClick={uitloggen} className="mgr-zij-uit">
          Uitloggen
        </button>
      </aside>

      <main className="mgr-inhoud">
        <header className="mgr-kop">
          <div>
            <p className="mgr-oog">Bedrijfsleiding</p>
            <h1 className="mgr-titel">Manageroverzicht</h1>
          </div>

          <div className="mgr-kop-meta">
            {data && (
              <span className="mgr-pil">
                {kpi?.bezet} / {kpi?.tafels} tafels bezet
              </span>
            )}
            {data && (
              <span className="mgr-pil zacht">{tijdKort(data.bijgewerkt)}</span>
            )}
            <button
              type="button"
              onClick={laad}
              className="mgr-ververs"
              disabled={laadt}
              aria-label="Verversen"
            >
              ↻ Verversen
            </button>
          </div>
        </header>

        {fout && (
          <p className="ober-fout" role="alert">
            {fout}
          </p>
        )}

        <section className="ober-kpis" aria-label="Kerncijfers">
          <article className="ober-kpi">
            <span className="ober-kpi-waarde">{kpi?.bezet ?? "–"}</span>
            <span className="ober-kpi-label">Bezette tafels</span>
          </article>
          <article className="ober-kpi">
            <span className="ober-kpi-waarde">{kpi?.gasten ?? "–"}</span>
            <span className="ober-kpi-label">Gasten in huis</span>
          </article>
          <article className="ober-kpi">
            <span className="ober-kpi-waarde">{orders.length}</span>
            <span className="ober-kpi-label">Bestellingen vandaag</span>
          </article>
          <article className="ober-kpi">
            <span className="ober-kpi-waarde">{kpi?.open ?? "–"}</span>
            <span className="ober-kpi-label">In de keuken</span>
          </article>
          <article className="ober-kpi">
            <span className="ober-kpi-waarde">{kpi?.klaar ?? "–"}</span>
            <span className="ober-kpi-label">Klaar om te serveren</span>
          </article>
          <article className="ober-kpi bedrag">
            <span className="ober-kpi-waarde">
              {kpi ? formatPrice(kpi.omzet) : "–"}
            </span>
            <span className="ober-kpi-label">Openstaand aan tafel</span>
          </article>
        </section>

        <div className="mgr-grid">
          <section className="mgr-kaart">
            <h2>Bezetting per verdieping</h2>
            <p className="mgr-sub">
              {kpi ? `${kpi.vrij} tafels vrij van ${kpi.tafels}` : "Laden…"}
            </p>

            {(data?.verdiepingen ?? []).map((vloer) => {
              const totaal = vloer.tafels.length || 1;
              const deel = Math.round((vloer.bezet / totaal) * 100);
              return (
                <div className="mgr-rij" key={vloer.id}>
                  <span className="mgr-rij-naam">{vloer.naam}</span>
                  <span className="mgr-rij-waarde">
                    {vloer.bezet} / {totaal} bezet
                  </span>
                  <span className="mgr-balk" aria-hidden="true">
                    <span style={{ width: `${deel}%` }} />
                  </span>
                  <span className="mgr-leeg">
                    {vloer.gasten} gasten · {vloer.stoelen} zitplaatsen ·{" "}
                    {vloer.ondertitel}
                  </span>
                </div>
              );
            })}
          </section>

          <section className="mgr-kaart">
            <h2>Bestellingen vandaag</h2>
            <p className="mgr-sub">
              Bestelwaarde {formatPrice(bestelwaarde)} ·{" "}
              {orders.length === 1 ? "1 bestelling" : `${orders.length} bestellingen`}
            </p>

            <div className="mgr-status">
              {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((status) => (
                <div key={status} className="mgr-statusvak">
                  <span className="mgr-statuswaarde">{perStatus[status]}</span>
                  <span className="mgr-statuslabel">{STATUS_LABEL[status]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mgr-kaart">
            <h2>Meest besteld</h2>
            <p className="mgr-sub">Top 5 van vandaag, alle rondes samen</p>

            {populairst.length === 0 ? (
              <p className="mgr-leeg">Nog geen bestellingen vandaag.</p>
            ) : (
              populairst.map((gerecht) => (
                <div className="mgr-rij" key={gerecht.naam}>
                  <span className="mgr-rij-naam">{gerecht.naam}</span>
                  <span className="mgr-rij-waarde">{gerecht.aantal}×</span>
                  <span className="mgr-balk" aria-hidden="true">
                    <span
                      style={{
                        width: `${Math.round((gerecht.aantal / meesteAantal) * 100)}%`,
                      }}
                    />
                  </span>
                </div>
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
