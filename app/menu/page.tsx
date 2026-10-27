"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MENU } from "@/lib/menu";
import { Divider } from "@/components/decor";
import type { GerechtStatus } from "@/lib/voorraad-types";

type CartLine = {
  /** Sleutel van de regel: het gerecht plus de persoon voor wie het is. */
  sleutel: string;
  id: string;
  name: string;
  quantity: number;
  voor: string;
  opmerking: string;
};

/** Twee gasten kunnen hetzelfde gerecht bestellen: elke regel is uniek per persoon. */
const lijnSleutel = (id: string, voor: string) => `${id}__${voor}`;

/** Resterende tijd leesbaar maken: "1 uur 38 min" of "24 min". */
function minutenTekst(minuten: number): string {
  if (minuten < 60) return `${minuten} min`;
  const uur = Math.floor(minuten / 60);
  const rest = minuten % 60;
  return rest > 0 ? `${uur} uur ${rest} min` : `${uur} uur`;
}

type TafelInfo = {
  personen: number;
  namen: string[];
  resterendeMinuten: number | null;
  laatsteRondeMinuten: number;
};

/** De opmerking wordt per tafel onthouden, zodat hij maar één keer gezegd hoeft te worden. */
const opmerkingSleutel = (tafel: string) => `las-tapas:opmerking:${tafel.trim().toLowerCase()}`;

function leesOpmerking(tafel: string): string {
  if (typeof window === "undefined" || !tafel.trim()) return "";
  try {
    return window.localStorage.getItem(opmerkingSleutel(tafel)) ?? "";
  } catch {
    // Geen opslag beschikbaar? Dan begint de opmerking gewoon leeg.
    return "";
  }
}

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

  if (id === "tapas-frias") {
    // Schaal met olijven.
    return (
      <svg {...props}>
        <path d="M3.5 12h17a8.5 8.5 0 0 1-17 0Z" />
        <circle cx="9" cy="9" r="1.5" />
        <circle cx="14" cy="8.5" r="1.5" />
      </svg>
    );
  }

  if (id === "tapas-calientes") {
    // Pannetje met een vlam erboven.
    return (
      <svg {...props}>
        <path d="M4 11h16v2.5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
        <path d="M12 2.5c1.9 1.7 1.9 3.4 0 5.1-1.9-1.7-1.9-3.4 0-5.1Z" />
        <path d="M7 20h10" />
      </svg>
    );
  }

  if (id === "especialidades") {
    // Paellapan met twee oren.
    return (
      <svg {...props}>
        <circle cx="12" cy="12.5" r="6.5" />
        <path d="M2.5 12.5h3M18.5 12.5h3" />
        <path d="M6.5 9.5h11" />
      </svg>
    );
  }

  if (id === "postres") {
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
  // Eerder gezegde opmerking voor deze tafel staat er meteen weer in.
  const [note, setNote] = useState(() => leesOpmerking(table));
  const [sending, setSending] = useState(false);
  // De ronde die net verstuurd is; daarna gaat de kaart meteen door naar de volgende.
  const [verstuurd, setVerstuurd] = useState<number | null>(null);
  const meldingRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [tafelInfo, setTafelInfo] = useState<TafelInfo | null>(null);
  // Voor wie is de volgende tik op "+ Toevoegen", en welke notitie staat open?
  const [actievePersoon, setActievePersoon] = useState<string | null>(null);
  const [openNotitie, setOpenNotitie] = useState<string | null>(null);
  const [beschikbaar, setBeschikbaar] = useState<Record<
    string,
    GerechtStatus
  > | null>(null);

  // Hoeveel personen zitten er, en hoe lang mogen ze nog eten? Elke minuut
  // verversen, zodat de klok op het scherm meeloopt.
  useEffect(() => {
    if (!table.trim()) return;
    let actief = true;

    const laad = () =>
      fetch(`/api/tafel?tafel=${encodeURIComponent(table)}`, { cache: "no-store" })
        .then((antwoord) => antwoord.json())
        .then((data) => {
          if (!actief) return;
          setTafelInfo({
            personen: typeof data.personen === "number" ? data.personen : 0,
            namen: Array.isArray(data.namen) ? (data.namen as string[]) : [],
            resterendeMinuten:
              typeof data.resterendeMinuten === "number"
                ? data.resterendeMinuten
                : null,
            laatsteRondeMinuten:
              typeof data.laatsteRondeMinuten === "number"
                ? data.laatsteRondeMinuten
                : 30,
          });
        })
        .catch(() => {
          // Geen tafelinfo? Dan tonen we alleen de kaart.
        });

    laad();
    const timer = window.setInterval(laad, 60_000);

    return () => {
      actief = false;
      window.clearInterval(timer);
    };
  }, [table]);

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

  // Na een bestelling gaat de kaart meteen door naar de volgende ronde: de
  // melding daarover komt in beeld.
  useEffect(() => {
    if (verstuurd === null) return;
    meldingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [verstuurd]);

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
  const count = cartLines.reduce((sum, l) => sum + l.quantity, 0);

  // Is de eetperiode om, of zit de keuken in de laatste ronde?
  const resterend = tafelInfo?.resterendeMinuten ?? null;
  const tijdOm = resterend !== null && resterend <= 0;
  const laatsteRonde =
    resterend !== null &&
    !tijdOm &&
    resterend <= (tafelInfo?.laatsteRondeMinuten ?? 30);

  // De namen van de gasten (of anders "Persoon 1", "Persoon 2" ...).
  const namen = tafelInfo?.namen ?? [];
  const standaardPersoon = namen[0] ?? "";
  const gekozene = actievePersoon ?? standaardPersoon;

  function add(id: string, name: string) {
    const voor = gekozene;
    const sleutel = lijnSleutel(id, voor);
    setCart((prev) => {
      const existing = prev[sleutel];
      return {
        ...prev,
        [sleutel]: existing
          ? { ...existing, quantity: existing.quantity + 1 }
          : { sleutel, id, name, quantity: 1, voor, opmerking: "" },
      };
    });
  }

  function remove(id: string) {
    // Eerst de regel van de gekozen persoon, anders de eerste regel van dit gerecht.
    const eigen = lijnSleutel(id, gekozene);
    setCart((prev) => {
      const bestaand =
        prev[eigen] ?? Object.values(prev).find((regel) => regel.id === id);
      if (!bestaand) return prev;
      const sleutel = bestaand.sleutel;

      if (bestaand.quantity <= 1) {
        const next = { ...prev };
        delete next[sleutel];
        return next;
      }
      return {
        ...prev,
        [sleutel]: { ...bestaand, quantity: bestaand.quantity - 1 },
      };
    });
  }

  /** Een regel naar een andere persoon verplaatsen (of samenvoegen). */
  function zetVoor(sleutel: string, voor: string) {
    setCart((prev) => {
      const regel = prev[sleutel];
      if (!regel || regel.voor === voor) return prev;

      const next = { ...prev };
      delete next[sleutel];

      const nieuweSleutel = lijnSleutel(regel.id, voor);
      const bestaand = next[nieuweSleutel];
      next[nieuweSleutel] = bestaand
        ? {
            ...bestaand,
            quantity: bestaand.quantity + regel.quantity,
            opmerking: bestaand.opmerking || regel.opmerking,
          }
        : { ...regel, sleutel: nieuweSleutel, voor };

      return next;
    });
  }

  function zetOpmerking(sleutel: string, opmerking: string) {
    setCart((prev) =>
      prev[sleutel]
        ? { ...prev, [sleutel]: { ...prev[sleutel], opmerking } }
        : prev
    );
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
          items: cartLines.map((line) => ({
            id: line.id,
            quantity: line.quantity,
            voor: line.voor || undefined,
            opmerking: line.opmerking.trim() || undefined,
          })),
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
      // De opmerking blijft bewaard voor deze tafel: één keer gezegd is genoeg.
      try {
        if (note.trim()) {
          window.localStorage.setItem(opmerkingSleutel(table), note.trim());
        } else {
          window.localStorage.removeItem(opmerkingSleutel(table));
        }
      } catch {
        // Opslag geweigerd? De bestelling is al verstuurd, dus geen probleem.
      }
      setCart({});
      setVerstuurd(typeof data.order?.ronde === "number" ? data.order.ronde : null);
    } catch {
      setError("Geen verbinding met de server.");
    } finally {
      setSending(false);
    }
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
          <div className="table-pills">
            <span className="table-pill">Tafel {table}</span>
            {tafelInfo && tafelInfo.personen > 0 && (
              <span className="table-pill zacht">
                {tafelInfo.personen} pers
              </span>
            )}
            {resterend !== null && (
              <span
                className={`table-pill${
                  tijdOm ? " tijd-om" : laatsteRonde ? " waarschuw" : ""
                }`}
              >
                {tijdOm ? "tijd is om" : `nog ${minutenTekst(resterend)}`}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="menu-hero">
        <div
          className="menu-hero-photo"
          style={{ backgroundImage: "url('/tapas.jpg')" }}
          aria-hidden="true"
        />
        <div className="menu-hero-overlay" aria-hidden="true" />
        <div className="menu-hero-inner">
          <div>
            <p className="eyebrow">Pequeños platos</p>
            <h1>Deel de avond</h1>
            <Divider />
          </div>
          <p>Bestel meerdere kleine gerechten voor de tafel. Wij brengen ze vers uit de keuken.</p>
        </div>
      </div>

      <div className="menu-content">
        {tijdOm && (
          <p className="menu-einde" role="status">
            De eetperiode is voorbij, dus je kunt niets meer bijbestellen. Vraag
            de bediening als je wilt verlengen.
          </p>
        )}

        {laatsteRonde && (
          <p className="menu-laatste-ronde" role="status">
            Laatste ronde: nog {minutenTekst(resterend ?? 0)} en dan stopt de
            keuken met nieuwe gerechten.
          </p>
        )}

        {verstuurd !== null && (
          <div className="ronde-melding" role="status" ref={meldingRef}>
            <div>
              <p className="ronde-melding-titel">Ronde {verstuurd} staat in de keuken</p>
              <p className="ronde-melding-tekst">
                Je kunt meteen door voor ronde {verstuurd + 1}. Betalen doe je
                pas aan het einde, via de rekening.
              </p>
            </div>
            <div className="ronde-melding-acties">
              <Link
                href={`/status?tafel=${encodeURIComponent(table)}`}
                className="ronde-melding-link"
              >
                Mijn bestellingen
              </Link>
              <button
                type="button"
                onClick={() => setVerstuurd(null)}
                className="ronde-melding-sluit"
                aria-label="Melding sluiten"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {uitverkocht.length > 0 && (
          <p className="menu-uitverkocht-melding">
            Vandaag even niet beschikbaar: {uitverkocht.join(", ")}.
          </p>
        )}

      {MENU.map((category) => (
        <section key={category.id} className="menu-section">
          <h2 className="category-heading">
            <CategoryIcon id={category.id} />
            <span className="category-title">
              {category.name}
              {category.subtitle && (
                <span className="category-subtitle">{category.subtitle}</span>
              )}
            </span>
          </h2>
          <ul className="menu-list">
            {category.items.map((item) => {
              const inCart = cartLines
                .filter((regel) => regel.id === item.id)
                .reduce((som, regel) => som + regel.quantity, 0);
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
                        onClick={() => add(item.id, item.name)}
                        disabled={tijdOm}
                        className="quantity-button"
                        aria-label={`Nog een ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => add(item.id, item.name)}
                      disabled={tijdOm}
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
              {verstuurd !== null
                ? `Tik op een gerecht voor ronde ${verstuurd + 1}`
                : "Tik op een gerecht om te bestellen"}
            </p>
          ) : (
            <>
              {namen.length > 0 && (
                <div className="cart-voor-wie">
                  <span className="cart-voor-wie-label">Voor wie?</span>
                  {namen.map((naam) => (
                    <button
                      key={naam}
                      type="button"
                      onClick={() => setActievePersoon(naam)}
                      className={`cart-persoon-chip${
                        gekozene === naam ? " actief" : ""
                      }`}
                    >
                      {naam}
                    </button>
                  ))}
                </div>
              )}

              <ul className="cart-list">
                {cartLines.map((line) => (
                  <li key={line.sleutel} className="cart-regel">
                    <div className="cart-regel-kop">
                      <span>
                        {line.quantity}× {line.name}
                        {line.voor && (
                          <b className="cart-regel-voor"> voor {line.voor}</b>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenNotitie(
                            openNotitie === line.sleutel ? null : line.sleutel
                          )
                        }
                        className={`cart-notitie-knop${
                          line.opmerking ? " gevuld" : ""
                        }`}
                        aria-label={`Opmerking bij ${line.name} voor ${line.voor}`}
                      >
                        {line.opmerking ? "opmerking" : "+ opmerking"}
                      </button>
                    </div>

                    {openNotitie === line.sleutel && (
                      <input
                        value={line.opmerking}
                        onChange={(event) =>
                          zetOpmerking(line.sleutel, event.target.value)
                        }
                        placeholder="Bijv. zonder ui (allergie)"
                        maxLength={80}
                        className="cart-notitie-veld"
                      />
                    )}

                    {line.opmerking && openNotitie !== line.sleutel && (
                      <p className="cart-notitie-tekst">{line.opmerking}</p>
                    )}

                    {namen.length > 1 && (
                      <select
                        value={line.voor}
                        onChange={(event) =>
                          zetVoor(line.sleutel, event.target.value)
                        }
                        className="cart-persoon-select"
                        aria-label={`Voor wie is ${line.name}`}
                      >
                        {namen.map((naam) => (
                          <option key={naam} value={naam}>
                            {naam}
                          </option>
                        ))}
                      </select>
                    )}
                  </li>
                ))}
              </ul>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Opmerking voor de hele tafel (wordt onthouden)"
                className="order-input"
              />
              <button
                onClick={placeOrder}
                disabled={sending || tijdOm}
                className="order-button"
              >
                {sending
                  ? "Versturen…"
                  : tijdOm
                    ? "Eetperiode voorbij"
                    : "Bestellen"}
              </button>
              {error && <p className="order-error">{error}</p>}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
