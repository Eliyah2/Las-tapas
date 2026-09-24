"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MENU } from "@/lib/menu";
import { formatPrice } from "@/lib/format";
import { Divider, Rosette } from "@/components/decor";
import type { GerechtStatus } from "@/lib/voorraad-types";

type CartLine = { id: string; name: string; price: number; quantity: number };

/** Klein lijn-icoon per menucategorie. */
function CategoryIcon({ id }: { id: string }) {
  const props = {
    className: "category-icon",
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (id === "tapas") {
    // Pincho: klein bordje met een prikker.
    return (
      <svg {...props}>
        <circle cx="12" cy="13.5" r="6.5" />
        <path d="M12 7V3" />
        <circle cx="12" cy="2.6" r="0.4" />
      </svg>
    );
  }

  if (id === "hoofdgerechten") {
    // Paellapan met twee oren.
    return (
      <svg {...props}>
        <circle cx="12" cy="12.5" r="6.5" />
        <path d="M2.5 12.5h3M18.5 12.5h3" />
        <path d="M6.5 9.5h11" />
      </svg>
    );
  }

  if (id === "desserts") {
    // Churros.
    return (
      <svg {...props}>
        <path d="M5.5 19.5L15 10" />
        <path d="M10 20.5L18.5 12" />
      </svg>
    );
  }

  // Wijnglas voor de dranken.
  return (
    <svg {...props}>
      <path d="M8.5 3h7l-.7 4.6a3.3 3.3 0 0 1-5.6 0z" />
      <path d="M12 11.5V19" />
      <path d="M9 20h6" />
    </svg>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <main className="success-page">
          <p className="eyebrow">Las Tapas</p>
          <p className="brand-serif">Menu laden…</p>
        </main>
      }
    >
      <MenuInner />
    </Suspense>
  );
}

function MenuInner() {
  const searchParams = useSearchParams();
  const table = searchParams.get("tafel") ?? "-";

  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [placed, setPlaced] = useState<{ table: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [beschikbaar, setBeschikbaar] = useState<Record<
    string,
    GerechtStatus
  > | null>(null);

  // Wat er nog in huis is, en dat live bijhouden: zodra de keuken bijvult,
  // verdwijnt het label "uitverkocht" vanzelf.
  useEffect(() => {
    let actief = true;

    fetch("/api/voorraad/beschikbaar", { cache: "no-store" })
      .then((antwoord) => antwoord.json())
      .then((data: { status?: Record<string, GerechtStatus> }) => {
        if (actief && data.status) setBeschikbaar(data.status);
      })
      .catch(() => {
        // Geen voorraadinformatie? Dan tonen we gewoon de hele kaart.
      });

    const bron = new EventSource("/api/voorraad/stream");
    bron.addEventListener("voorraad", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        status?: Record<string, GerechtStatus>;
      };
      if (data.status) setBeschikbaar(data.status);
    });

    return () => {
      actief = false;
      bron.close();
    };
  }, []);

  const uitverkocht = useMemo(() => {
    return MENU.flatMap((category) => category.items)
      .filter((item) => {
        if (!item.available) return true;
        const status = beschikbaar?.[item.id];
        return status ? !status.maakbaar : false;
      })
      .map((item) => item.name);
  }, [beschikbaar]);

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [cartLines]
  );
  const count = cartLines.reduce((sum, l) => sum + l.quantity, 0);

  function add(id: string, name: string, price: number) {
    setCart((prev) => {
      const existing = prev[id];
      return {
        ...prev,
        [id]: existing
          ? { ...existing, quantity: existing.quantity + 1 }
          : { id, name, price, quantity: 1 },
      };
    });
  }

  function remove(id: string) {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...existing, quantity: existing.quantity - 1 } };
    });
  }

  async function placeOrder() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table,
          items: cartLines.map(({ id, quantity }) => ({ id, quantity })),
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // De keuken kon de bestelling niet maken: laat zien waaraan het schort.
        const tekorten = Array.isArray(data.tekorten)
          ? (data.tekorten as { name: string }[])
              .map((tekort) => tekort.name)
              .join(", ")
          : "";
        setError(
          `${data.error ?? "Bestellen mislukt, probeer het opnieuw."}${
            tekorten ? ` Tekort aan: ${tekorten}.` : ""
          }`
        );
        return;
      }
      setCart({});
      setNote("");
      setPlaced({ table });
    } catch {
      setError("Geen verbinding met de server.");
    } finally {
      setSending(false);
    }
  }

  if (placed) {
    return (
      <main className="success-page">
        <div className="success-card">
          <Rosette size={84} />
          <p className="eyebrow">¡Gracias!</p>
          <h1>Bestelling ontvangen!</h1>
          <p>Tafel {placed.table}: de keuken is op de hoogte. Eet smakelijk!</p>
          <div className="success-actions">
            <Link
              href={`/status?tafel=${encodeURIComponent(placed.table)}`}
              className="button"
            >
              Bekijk de status van je bestelling
            </Link>
            <Link
              href={`/rekening?tafel=${encodeURIComponent(placed.table)}`}
              className="success-klein"
            >
              Direct afrekenen
            </Link>
            <button onClick={() => setPlaced(null)} className="success-klein">
              Nog iets bestellen
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="menu-page">
      <header className="menu-header">
        <div className="menu-header-inner">
          <div className="menu-brand-row">
            <span className="menu-brand-mark" aria-hidden="true">L</span>
            <div>
              <p className="menu-brand-name">Las Tapas</p>
              <p className="menu-header-caption">Cocina española</p>
            </div>
          </div>
          <span className="table-pill">Tafel {table}</span>
        </div>
      </header>

      <div className="menu-content">
        <div className="menu-welcome">
          <div>
            <p className="eyebrow">Pequeños platos</p>
            <h1>Deel de avond</h1>
            <Divider />
          </div>
          <p>Bestel meerdere kleine gerechten voor de tafel. Wij brengen ze vers uit de keuken.</p>
        </div>

        {uitverkocht.length > 0 && (
          <p className="menu-uitverkocht-melding">
            Vandaag even niet beschikbaar: {uitverkocht.join(", ")}.
          </p>
        )}

      {MENU.map((category) => (
        <section key={category.id} className="menu-section">
          <h2 className="category-heading">
            <CategoryIcon id={category.id} />
            {category.name}
          </h2>
          <ul className="menu-list">
            {category.items.map((item) => {
              const inCart = cart[item.id]?.quantity ?? 0;
              const status = beschikbaar?.[item.id];
              const isUitverkocht =
                !item.available || (status ? !status.maakbaar : false);
              const bijnaOp =
                !isUitverkocht && status ? status.porties <= 3 : false;
              return (
                <li
                  key={item.id}
                  className={`menu-item${isUitverkocht ? " uitverkocht" : ""}`}
                >
                  <div className="menu-item-copy">
                    <p className="menu-item-name">
                      {item.name}
                      {isUitverkocht && (
                        <span className="menu-item-vlag">Uitverkocht</span>
                      )}
                      {bijnaOp && status && (
                        <span className="menu-item-vlag zacht">
                          Nog {status.porties}
                        </span>
                      )}
                    </p>
                    <p className="menu-item-description">{item.description}</p>
                    <p className="menu-item-price">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  {isUitverkocht ? (
                    <p className="menu-item-uit">Vandaag op</p>
                  ) : inCart > 0 ? (
                    <div className="quantity-control">
                      <button
                        onClick={() => remove(item.id)}
                        className="quantity-button remove"
                        aria-label={`Eén ${item.name} minder`}
                      >
                        −
                      </button>
                      <span className="quantity-number">{inCart}</span>
                      <button
                        onClick={() => add(item.id, item.name, item.price)}
                        className="quantity-button"
                        aria-label={`Nog een ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => add(item.id, item.name, item.price)}
                      className="add-button"
                    >
                      + Toevoegen
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      </div>

      {/* Winkelmand-balk */}
      <div className="cart-bar">
        <div className="cart-inner">
          {count === 0 ? (
            <p className="cart-empty">
              Tik op een gerecht om te bestellen
            </p>
          ) : (
            <>
              <ul className="cart-list">
                {cartLines.map((line) => (
                  <li key={line.id}>
                    <span>
                      {line.quantity}× {line.name}
                    </span>
                    <span>{formatPrice(line.price * line.quantity)}</span>
                  </li>
                ))}
              </ul>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Opmerking voor de keuken (optioneel)"
                className="order-input"
              />
              <button
                onClick={placeOrder}
                disabled={sending}
                className="order-button"
              >
                {sending ? "Versturen…" : `Bestellen · ${formatPrice(total)}`}
              </button>
              {error && <p className="order-error">{error}</p>}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
