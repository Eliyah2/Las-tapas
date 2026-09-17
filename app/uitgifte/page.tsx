"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { findMenuItem, MENU } from "@/lib/menu";
import { formatAmount, formatPrice, formatTijdstip } from "@/lib/format";
import { RolKiezer, useRol } from "@/components/rol-kiezer";
import {
  gebruikPerIngredient,
  ingredientenVanGerecht,
  moetGoedgekeurdWorden,
  ROL_LABEL,
  voorraadNiveau,
  waardeVan,
  type Movement,
  type Product,
  type Unit,
  type VoorraadNiveau,
  type VoorraadOverzicht,
} from "@/lib/voorraad-types";

const NIVEAU_LABEL: Record<VoorraadNiveau, string> = {
  leeg: "Leeg",
  kritiek: "Bijna op",
  laag: "Let op",
  ok: "Genoeg",
};

/** Handige pakmaten per eenheid, zodat de keuken niet hoeft te rekenen. */
const SNELMATEN: Record<Unit, number[]> = {
  gram: [100, 250, 500, 1000],
  ml: [250, 500, 1000],
  stuk: [1, 6, 12],
};

const VOLGORDE: Record<VoorraadNiveau, number> = {
  leeg: 0,
  kritiek: 1,
  laag: 2,
  ok: 3,
};

export default function UitgiftePage() {
  const [rol, kiesRol] = useRol("kok");
  const [overzicht, setOverzicht] = useState<VoorraadOverzicht | null>(null);
  const [verbonden, setVerbonden] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [zoek, setZoek] = useState("");
  const [alleenBijnaOp, setAlleenBijnaOp] = useState(false);
  const [gerecht, setGerecht] = useState("");

  const ververs = useCallback(async () => {
    const antwoord = await fetch("/api/voorraad", { cache: "no-store" });
    if (antwoord.ok) setOverzicht((await antwoord.json()) as VoorraadOverzicht);
  }, []);

  useEffect(() => {
    // De stream stuurt direct de stand; valt hij weg, dan halen we hem opnieuw op.
    const bron = new EventSource("/api/voorraad/stream");
    bron.addEventListener("open", () => setVerbonden(true));
    bron.addEventListener("voorraad", (event) => {
      setOverzicht(JSON.parse((event as MessageEvent).data) as VoorraadOverzicht);
      setVerbonden(true);
    });
    bron.addEventListener("error", () => {
      setVerbonden(false);
      void ververs();
    });

    return () => bron.close();
  }, [ververs]);

  const drempel = overzicht?.goedkeuringsdrempel ?? 0;
  const isHoofdchef = rol === "hoofdchef";

  /** Staat er een gerecht gekozen? Dan tonen we alleen zijn ingrediënten. */
  const ingredienten = useMemo(() => {
    if (!gerecht) return null;
    const kaart = ingredientenVanGerecht(overzicht?.recepten ?? [], gerecht);
    return Object.keys(kaart).length > 0 ? kaart : null;
  }, [overzicht, gerecht]);

  const producten = useMemo(() => {
    const lijst = overzicht?.producten ?? [];
    const term = zoek.trim().toLowerCase();

    return lijst
      .filter((product) => {
        if (alleenBijnaOp && voorraadNiveau(product) === "ok") return false;
        if (ingredienten && !(product.id in ingredienten)) return false;
        return !term || product.name.toLowerCase().includes(term);
      })
      .sort((a, b) => {
        // Gekozen gerecht: op de volgorde van het recept, zodat de kok van
        // boven naar beneden kan werken.
        if (ingredienten) {
          const volgorde = Object.keys(ingredienten);
          const verschil =
            volgorde.indexOf(a.id) - volgorde.indexOf(b.id);
          if (verschil !== 0) return verschil;
        }
        const verschil = VOLGORDE[voorraadNiveau(a)] - VOLGORDE[voorraadNiveau(b)];
        return verschil !== 0 ? verschil : a.name.localeCompare(b.name, "nl");
      });
  }, [overzicht, zoek, alleenBijnaOp, ingredienten]);

  /** Welke gerechten dit product gebruiken, zodat de kok de link ziet. */
  const gebruiktIn = useMemo(() => {
    const kaart: Record<string, string[]> = {};
    for (const [id, lijst] of Object.entries(
      gebruikPerIngredient(overzicht?.recepten ?? [])
    )) {
      kaart[id] = lijst.map(
        (regel) => findMenuItem(regel.menuItemId)?.name ?? regel.menuItemId
      );
    }
    return kaart;
  }, [overzicht]);

  const beginVandaag = useMemo(() => {
    const datum = new Date();
    datum.setHours(0, 0, 0, 0);
    return datum.getTime();
  }, []);

  const openAanvragen = useMemo(
    () => (overzicht?.aanvragen ?? []).filter((a) => a.status === "open"),
    [overzicht]
  );

  const afgewezenVandaag = useMemo(
    () =>
      (overzicht?.aanvragen ?? []).filter(
        (a) => a.status === "afgewezen" && (a.behandeldOp ?? 0) >= beginVandaag
      ),
    [overzicht, beginVandaag]
  );

  const vandaagGepakt = useMemo(
    () =>
      (overzicht?.mutaties ?? []).filter(
        (m) => m.reason === "uitgifte" && m.createdAt >= beginVandaag
      ),
    [overzicht, beginVandaag]
  );

  async function pak(product: Product, hoeveelheid: number, notitie?: string) {
    if (hoeveelheid <= 0) return;
    setBezig(true);
    setFout(null);
    try {
      const antwoord = await fetch("/api/voorraad/uitgifte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          amount: hoeveelheid,
          note: notitie,
          door: rol,
        }),
      });
      const data = (await antwoord.json()) as {
        soort?: "direct" | "aanvraag";
        waarde?: number;
        error?: string;
      };

      if (!antwoord.ok) {
        setFout(data.error ?? "Afboeken mislukt, probeer het opnieuw");
        setMelding(null);
        return;
      }

      setMelding(
        data.soort === "aanvraag"
          ? `${formatAmount(hoeveelheid, product.unit)} ${product.name} staat bij de hoofdchef: ${formatPrice(
              data.waarde ?? 0
            )} is meer dan de drempel van ${formatPrice(drempel)}.`
          : `${formatAmount(hoeveelheid, product.unit)} ${product.name} afgeboekt`
      );
      await ververs();
    } finally {
      setBezig(false);
    }
  }

  async function behandelAanvraag(id: string, actie: "goedkeuren" | "afwijzen") {
    setBezig(true);
    setFout(null);
    try {
      const antwoord = await fetch(`/api/voorraad/aanvragen/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actie, door: rol }),
      });
      const data = (await antwoord.json()) as { error?: string };
      if (!antwoord.ok) {
        setFout(data.error ?? "Behandelen mislukt");
        return;
      }
      setMelding(actie === "goedkeuren" ? "Uitgifte goedgekeurd" : "Uitgifte afgewezen");
      await ververs();
    } finally {
      setBezig(false);
    }
  }

  async function maakOngedaan(mutatie: Movement) {
    setBezig(true);
    try {
      await fetch(`/api/voorraad/${mutatie.ingredientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delta: -mutatie.delta,
          reason: "correctie",
          note: "Gepakte hoeveelheid teruggezet",
          door: rol,
        }),
      });
      setMelding(`${mutatie.name} teruggezet`);
      await ververs();
    } finally {
      setBezig(false);
    }
  }

  function eenheidVan(ingredientId: string): Unit {
    return overzicht?.producten.find((p) => p.id === ingredientId)?.unit ?? "stuk";
  }

  return (
    <main className="uitgifte-page">
      <header className="uitgifte-header">
        <div className="uitgifte-titel">
          <span className="menu-brand-mark" aria-hidden="true">L</span>
          <div>
            <p>Las Tapas · keuken</p>
            <h1>Wat pak je uit de voorraad?</h1>
          </div>
        </div>

        <div className="uitgifte-header-rechts">
          <span className="connection-pill">
            <span className={`connection-dot ${verbonden ? "live" : "offline"}`} />
            {verbonden ? "Live" : "Geen verbinding"}
          </span>
          <Link href="/keuken" className="mini-button ghost">
            Bestellingen
          </Link>
          <Link href="/" className="mini-button ghost">
            Home
          </Link>
        </div>
      </header>

      <section className="uitgifte-rolbalk">
        <RolKiezer rol={rol} onKies={kiesRol} rollen={["kok", "hoofdchef"]} />
        <p className="uitgifte-regel">
          {drempel > 0
            ? `Tot ${formatPrice(drempel)} pak je direct. Daarboven keurt de hoofdchef het goed.`
            : "Alle uitgiftes gaan direct; de goedkeuringsdrempel staat uit."}
        </p>
      </section>

      {melding && <p className="voorraad-melding">{melding}</p>}
      {fout && <p className="voorraad-waarschuwing">{fout}</p>}

      {overzicht?.automatischAfboeken && (
        <p className="uitgifte-info">
          Let op: een bestelling boekt de ingrediënten op dit moment ook
          automatisch af volgens het recept. De manager kan dat uitzetten op het
          voorraadscherm, dan telt alleen wat hier gepakt wordt.
        </p>
      )}

      {openAanvragen.length > 0 && (
        <section className="panel">
          <h2 className="panel-heading">
            Wacht op goedkeuring
            <span className="panel-teller">{openAanvragen.length}</span>
          </h2>
          {!isHoofdchef && (
            <p className="panel-uitleg">
              De hoofdchef moet deze uitgiftes nog goedkeuren. Kies hierboven de
              rol Hoofdchef als jij dat bent.
            </p>
          )}
          <ul className="aanvraag-lijst">
            {openAanvragen.map((aanvraag) => (
              <li key={aanvraag.id} className="aanvraag-rij">
                <span className="mutatie-tijd">
                  {formatTijdstip(aanvraag.createdAt)}
                </span>
                <span className="gepakt-naam">
                  {aanvraag.name}
                  <small className="mutatie-notitie">
                    gevraagd door de {ROL_LABEL[aanvraag.aangevraagdDoor].toLowerCase()}
                    {aanvraag.note ? ` · ${aanvraag.note}` : ""}
                  </small>
                </span>
                <span className="gepakt-aantal">
                  {formatAmount(aanvraag.amount, aanvraag.unit)} ·{" "}
                  {formatPrice(aanvraag.waarde)}
                </span>
                {isHoofdchef ? (
                  <span className="aanvraag-acties">
                    <button
                      type="button"
                      className="mini-button accent"
                      onClick={() => behandelAanvraag(aanvraag.id, "goedkeuren")}
                      disabled={bezig}
                    >
                      Goedkeuren
                    </button>
                    <button
                      type="button"
                      className="mini-button ghost"
                      onClick={() => behandelAanvraag(aanvraag.id, "afwijzen")}
                      disabled={bezig}
                    >
                      Afwijzen
                    </button>
                  </span>
                ) : (
                  <span className="status-badge kritiek">wacht op hoofdchef</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {afgewezenVandaag.length > 0 && (
        <section className="panel">
          <h2 className="panel-heading">Afgewezen vandaag</h2>
          <ul className="aanvraag-lijst">
            {afgewezenVandaag.map((aanvraag) => (
              <li key={aanvraag.id} className="aanvraag-rij afgewezen">
                <span className="mutatie-tijd">
                  {formatTijdstip(aanvraag.behandeldOp ?? aanvraag.createdAt)}
                </span>
                <span className="gepakt-naam">
                  {aanvraag.name}
                  <small className="mutatie-notitie">
                    afgewezen door de{" "}
                    {ROL_LABEL[aanvraag.behandeldDoor ?? "hoofdchef"].toLowerCase()}
                    {aanvraag.reden ? ` · ${aanvraag.reden}` : ""}
                  </small>
                </span>
                <span className="gepakt-aantal">
                  {formatAmount(aanvraag.amount, aanvraag.unit)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="uitgifte-toolbar">
        <input
          className="voorraad-zoek"
          value={zoek}
          onChange={(event) => setZoek(event.target.value)}
          placeholder="Zoek een product"
          aria-label="Zoeken in de voorraad"
        />
        <select
          className="voorraad-select"
          value={gerecht}
          onChange={(event) => setGerecht(event.target.value)}
          aria-label="Filteren op gerecht"
        >
          <option value="">Alle gerechten</option>
          {MENU.map((categorie) => (
            <optgroup key={categorie.id} label={categorie.name}>
              {categorie.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <label className="voorraad-check">
          <input
            type="checkbox"
            checked={alleenBijnaOp}
            onChange={(event) => setAlleenBijnaOp(event.target.checked)}
          />
          Alleen wat bijna op is
        </label>
        <span className="uitgifte-teller">vandaag gepakt: {vandaagGepakt.length}</span>
      </section>

      {!overzicht && <p className="panel-leeg">Voorraad laden…</p>}

      {gerecht && (
        <p className="uitgifte-gerecht-uitleg">
          Ingrediënten voor <strong>{findMenuItem(gerecht)?.name}</strong>, in de
          volgorde van het recept. Per product staat wat je per portie nodig
          hebt.
        </p>
      )}
      {overzicht && producten.length === 0 && (
        <p className="panel-leeg">Geen producten die hierbij passen.</p>
      )}

      <section className="uitgifte-grid" aria-label="Producten">
        {producten.map((product) => (
          <article key={product.id} className="uitgifte-kaart">
            <div className="uitgifte-kaart-kop">
              <div>
                <p className="uitgifte-naam">{product.name}</p>
                <p className="uitgifte-gebruikt">
                  {gebruiktIn[product.id]?.length
                    ? `voor ${gebruiktIn[product.id].join(", ")}`
                    : "niet aan een gerecht gekoppeld"}
                  {ingredienten?.[product.id] !== undefined &&
                    ` · nodig: ${formatAmount(ingredienten[product.id], product.unit)} per portie`}
                </p>
              </div>
              <span className={`status-badge ${voorraadNiveau(product)}`}>
                {NIVEAU_LABEL[voorraadNiveau(product)]}
              </span>
            </div>

            <p className="uitgifte-voorraad">
              {formatAmount(product.stock, product.unit)}
              <small>
                in de voorraad · par {formatAmount(product.parLevel, product.unit)}
              </small>
            </p>

            <div className="uitgifte-snel">
              {SNELMATEN[product.unit].map((hoeveelheid) => {
                const vraagtGoedkeuring = moetGoedgekeurdWorden(
                  waardeVan(hoeveelheid, product),
                  drempel
                );
                return (
                  <button
                    key={hoeveelheid}
                    type="button"
                    className={`pak-knop${vraagtGoedkeuring ? " vraagt-goedkeuring" : ""}`}
                    onClick={() => pak(product, hoeveelheid)}
                    disabled={bezig || product.stock < hoeveelheid}
                    title={
                      vraagtGoedkeuring
                        ? `${formatPrice(waardeVan(hoeveelheid, product))} · vraagt goedkeuring van de hoofdchef`
                        : `${formatPrice(waardeVan(hoeveelheid, product))}`
                    }
                  >
                    − {formatAmount(hoeveelheid, product.unit)}
                    {vraagtGoedkeuring && <span aria-hidden="true"> !</span>}
                  </button>
                );
              })}
            </div>

            <PakForm
              product={product}
              bezig={bezig}
              drempel={drempel}
              onPak={pak}
            />
          </article>
        ))}
      </section>

      <section className="panel">
        <h2 className="panel-heading">
          Vandaag gepakt
          <span className="panel-teller">{vandaagGepakt.length}</span>
        </h2>
        {vandaagGepakt.length === 0 && (
          <p className="panel-leeg">Vandaag is er nog niets afgeboekt.</p>
        )}
        <ul className="gepakt-lijst">
          {vandaagGepakt.slice(0, 20).map((mutatie) => (
            <li key={mutatie.id} className="gepakt-rij">
              <span className="mutatie-tijd">{formatTijdstip(mutatie.createdAt)}</span>
              <span className="gepakt-naam">
                {mutatie.name}
                <small className="mutatie-notitie">
                  {mutatie.door ? `door de ${ROL_LABEL[mutatie.door].toLowerCase()}` : "geboekt"}
                  {mutatie.note ? ` · ${mutatie.note}` : ""}
                </small>
              </span>
              <span className="gepakt-aantal">
                {formatAmount(Math.abs(mutatie.delta), eenheidVan(mutatie.ingredientId))}
              </span>
              <button
                type="button"
                className="icon-button"
                onClick={() => maakOngedaan(mutatie)}
                disabled={bezig}
                title="Per ongeluk? Zet deze hoeveelheid terug"
                aria-label={`${mutatie.name} terugzetten`}
              >
                ↺
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function PakForm({
  product,
  bezig,
  drempel,
  onPak,
}: {
  product: Product;
  bezig: boolean;
  drempel: number;
  onPak: (product: Product, hoeveelheid: number, notitie?: string) => void;
}) {
  const [aantal, setAantal] = useState("");
  const [notitie, setNotitie] = useState("");

  const getal = Number(aantal.replace(",", "."));
  const geldig = Number.isFinite(getal) && getal > 0;
  const waarde = geldig ? waardeVan(getal, product) : 0;
  const vraagtGoedkeuring = geldig && moetGoedgekeurdWorden(waarde, drempel);

  function verstuur(event: React.FormEvent) {
    event.preventDefault();
    if (!geldig) return;
    onPak(product, getal, notitie);
    setAantal("");
    setNotitie("");
  }

  return (
    <form className="uitgifte-pakken" onSubmit={verstuur}>
      <input
        className="boek-input"
        value={aantal}
        onChange={(event) => setAantal(event.target.value)}
        placeholder={
          product.unit === "stuk" ? "aantal" : product.unit === "gram" ? "gram" : "ml"
        }
        inputMode="decimal"
        aria-label={`Hoeveel ${product.name} pak je?`}
      />
      <input
        className="boek-input breed"
        value={notitie}
        onChange={(event) => setNotitie(event.target.value)}
        placeholder="waarvoor? (mag leeg blijven)"
        aria-label={`Notitie bij ${product.name}`}
      />
      <button type="submit" className="mini-button accent" disabled={bezig || !geldig}>
        Pakken
      </button>
      {geldig && (
        <span
          className={`uitgifte-waarde${vraagtGoedkeuring ? " vraagt-goedkeuring" : ""}`}
        >
          {formatPrice(waarde)}
          {vraagtGoedkeuring ? " · naar de hoofdchef" : ""}
        </span>
      )}
    </form>
  );
}
