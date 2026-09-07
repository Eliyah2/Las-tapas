"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MENU } from "@/lib/menu";
import { formatPrice } from "@/lib/format";

type CartLine = { id: string; name: string; price: number; quantity: number };

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center text-neutral-400">
          Menu laden…
        </main>
      }
    >
      <MenuInner />
    </Suspense>
  );
}

function MenuInner() {
  const searchParams = useSearchParams();
  const table = searchParams.get("tafel") ?? "—";

  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [placed, setPlaced] = useState<{ table: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setError(data.error ?? "Bestellen mislukt, probeer het opnieuw.");
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
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-bold">Bestelling ontvangen!</h1>
        <p className="text-neutral-600">
          Tafel {placed.table} — de keuken is op de hoogte. Eet smakelijk!
        </p>
        <button
          onClick={() => setPlaced(null)}
          className="mt-4 rounded-full bg-red-600 px-6 py-3 font-semibold text-white active:scale-95"
        >
          Nog iets bestellen
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md pb-32">
      <header className="sticky top-0 z-10 bg-red-700 px-5 py-4 text-white shadow-md">
        <p className="text-xs uppercase tracking-widest opacity-80">Las Tapas</p>
        <h1 className="text-xl font-bold">Menukaart · Tafel {table}</h1>
      </header>

      {MENU.map((category) => (
        <section key={category.id} className="px-4 pt-6">
          <h2 className="mb-3 text-lg font-bold text-red-700">{category.name}</h2>
          <ul className="flex flex-col gap-2">
            {category.items.map((item) => {
              const inCart = cart[item.id]?.quantity ?? 0;
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-neutral-500">{item.description}</p>
                    <p className="mt-1 font-medium text-red-700">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  {inCart > 0 ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => remove(item.id)}
                        className="h-8 w-8 rounded-full border border-red-600 font-bold text-red-600"
                        aria-label={`Eén ${item.name} minder`}
                      >
                        −
                      </button>
                      <span className="w-4 text-center font-bold">{inCart}</span>
                      <button
                        onClick={() => add(item.id, item.name, item.price)}
                        className="h-8 w-8 rounded-full bg-red-600 font-bold text-white"
                        aria-label={`Nog een ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => add(item.id, item.name, item.price)}
                      className="shrink-0 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white active:scale-95"
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

      {/* Winkelmand-balk */}
      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="mx-auto max-w-md">
          {count === 0 ? (
            <p className="text-center text-sm text-neutral-400">
              Tik op een gerecht om te bestellen
            </p>
          ) : (
            <>
              <ul className="mb-2 max-h-32 space-y-1 overflow-y-auto text-sm">
                {cartLines.map((line) => (
                  <li key={line.id} className="flex justify-between">
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
                className="mb-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                onClick={placeOrder}
                disabled={sending}
                className="w-full rounded-full bg-red-600 py-3 font-bold text-white disabled:opacity-60"
              >
                {sending ? "Versturen…" : `Bestellen · ${formatPrice(total)}`}
              </button>
              {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
