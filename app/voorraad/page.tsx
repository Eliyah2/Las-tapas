"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MENU } from "@/lib/menu";
import {
  formatAmount,
  formatDelta,
  formatPrice,
  formatTijdstip,
  formatUnitPrice,
} from "@/lib/format";
import {
  gebruikPerIngredient,
  ingredientenVanGerecht,
  ROL_LABEL,
  voorraadNiveau,
  type GerechtStatus,
  type MovementReason,
  type Product,
  type Recipe,
  type Unit,
  type VoorraadNiveau,
  type VoorraadOverzicht,
} from "@/lib/voorraad-types";

const NIVEAU_LABEL: Record<VoorraadNiveau, string> = {
  leeg: "Leeg",
  kritiek: "Kritiek",
  laag: "Laag",
  ok: "Op peil",
};

const REDEN_LABEL: Record<MovementReason, string> = {
  levering: "Levering",
  verbruik: "Verbruik",
  uitgifte: "Gepakt",
  verlies: "Verlies",
  correctie: "Telling",
};

const SORTERING_LABEL = {
  urgent: "Eerst wat aandacht nodig heeft",
  gerecht: "Op gerecht",
  naam: "Op naam",
  waarde: "Op voorraadwaarde",
} as const;

type Sortering = keyof typeof SORTERING_LABEL;

const VOLGORDE: Record<VoorraadNiveau, number> = {
  leeg: 0,
  kritiek: 1,
  laag: 2,
  ok: 3,
};

function gerechtNaam(menuItemId: string): { naam: string; categorie: string } {
  for (const categorie of MENU) {
    const item = categorie.items.find((i) => i.id === menuItemId);
    if (item) return { naam: item.name, categorie: categorie.name };
  }
  return { naam: menuItemId, categorie: "onbekend" };
}

export default function VoorraadPage() {
  const [overzicht, setOverzicht] = useState<VoorraadOverzicht | null>(null);
  const [verbonden, setVerbonden] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);
  const [zoek, setZoek] = useState("");
  const [sortering, setSortering] = useState<Sortering>("urgent");
  const [gerecht, setGerecht] = useState("");
  const [alleenAandacht, setAlleenAandacht] = useState(false);
  const lijstRef = useRef<HTMLElement | null>(null);

  const ververs = useCallback(async () => {
    const antwoord = await fetch("/api/voorraad", { cache: "no-store" });
    if (antwoord.ok) setOverzicht((await antwoord.json()) as VoorraadOverzicht);
  }, []);

  useEffect(() => {
    // De stream stuurt direct de huidige stand, dus een losse eerste fetch is
    // niet nodig. Valt de verbinding weg, dan halen we de stand gewoon op.
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

  async function vraag(url: string, methode: string, body?: unknown) {
    setBezig(true);
    try {
      const antwoord = await fetch(url, {
        method: methode,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await antwoord.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!antwoord.ok) {
        setMelding(data.error ?? "Er ging iets mis");
      } else {
        setMelding(null);
      }
      await ververs();
      return antwoord.ok;
    } finally {
      setBezig(false);
    }
  }

  async function boek(
    id: string,
    invoer: { delta?: number; naar?: number; reason: MovementReason; note?: string }
  ) {
    await vraag(`/api/voorraad/${id}`, "PATCH", { ...invoer, door: "manager" });
  }

  async function bewaarProduct(id: string, patch: Partial<Product>) {
    await vraag(`/api/voorraad/${id}`, "PATCH", patch);
  }

  async function verwijderProduct(product: Product) {
    if (!window.confirm(`${product.name} uit de voorraadlijst halen?`)) return;
    await vraag(`/api/voorraad/${product.id}`, "DELETE");
  }

  async function nieuwProduct(invoer: {
    name: string;
    unit: Unit;
    stock: number;
    parLevel: number;
    costPerUnit: number;
    supplier: string;
  }) {
    const gelukt = await vraag("/api/voorraad", "POST", invoer);
    if (gelukt) setMelding("Product toegevoegd");
    return gelukt;
  }

  async function vulAllesAan() {
    setBezig(true);
    try {
      const antwoord = await fetch("/api/voorraad/bijvullen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ door: "manager" }),
      });
      const data = (await antwoord.json()) as { aantal?: number };
      setMelding(
        data.aantal
          ? `${data.aantal} producten bijgevuld tot par-niveau`
          : "Alles staat al op par-niveau"
      );
      await ververs();
    } finally {
      setBezig(false);
    }
  }

  async function zetDrempel(waarde: number) {
    if (!Number.isFinite(waarde) || waarde < 0) return;
    await vraag("/api/voorraad/instellingen", "POST", {
      goedkeuringsdrempel: waarde,
    });
    setMelding(
      waarde > 0
        ? `Uitgiftes boven ${formatPrice(waarde)} moeten door de hoofdchef worden goedgekeurd`
        : "Goedkeuring van uitgiftes staat uit"
    );
  }

  async function zetAutomatischAfboeken(waarde: boolean) {
    await vraag("/api/voorraad/instellingen", "POST", {
      automatischAfboeken: waarde,
    });
    setMelding(
      waarde
        ? "Bestellingen worden automatisch volgens het recept afgeboekt"
        : "Alleen wat de keuken zelf pakt, gaat nu van de voorraad af"
    );
  }

  /** Vanuit een receptkaart direct de ingrediënten van dat gerecht tonen. */
  function kiesGerecht(menuItemId: string) {
    setGerecht(menuItemId);
    setAlleenAandacht(false);
    setSortering("gerecht");
    lijstRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function herstelBeginvoorraad() {
    if (
      !window.confirm(
        "Alle producten terugzetten naar de beginvoorraad uit lib/voorraad-seed.ts?"
      )
    ) {
      return;
    }
    await vraag("/api/voorraad/reset", "POST");
    setMelding("Beginvoorraad hersteld");
  }

  /** Per ingrediënt: welke gerechten het gebruiken, op alfabetische volgorde. */
  const gebruik = useMemo(() => {
    const kaart = gebruikPerIngredient(overzicht?.recepten ?? []);
    return Object.fromEntries(
      Object.entries(kaart).map(([id, lijst]) => [
        id,
        [...lijst]
          .map((regel) => ({
            menuItemId: regel.menuItemId,
            naam: gerechtNaam(regel.menuItemId).naam,
            amount: regel.amount,
          }))
          .sort((a, b) => a.naam.localeCompare(b.naam, "nl")),
      ])
    );
  }, [overzicht]);

  /** Staat er een gerecht gekozen? Dan tonen we zijn ingrediënten en hun portie. */
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
        if (alleenAandacht && voorraadNiveau(product) === "ok") return false;
        if (ingredienten && !(product.id in ingredienten)) return false;
        if (!term) return true;
        return (
          product.name.toLowerCase().includes(term) ||
          (product.supplier ?? "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (sortering === "naam") return a.name.localeCompare(b.name, "nl");
        if (sortering === "waarde") {
          return b.stock * b.costPerUnit - a.stock * a.costPerUnit;
        }
        if (sortering === "gerecht") {
          // Ingrediënten van hetzelfde gerecht bij elkaar; producten zonder
          // gerecht (schoonmaakmiddel, verpakking) komen achteraan.
          const eerste = (product: Product) =>
            gebruik[product.id]?.[0]?.naam ?? "\uffff";
          const verschil = eerste(a).localeCompare(eerste(b), "nl");
          return verschil !== 0 ? verschil : a.name.localeCompare(b.name, "nl");
        }
        const verschil =
          VOLGORDE[voorraadNiveau(a)] - VOLGORDE[voorraadNiveau(b)];
        if (verschil !== 0) return verschil;
        return a.stock / (a.parLevel || 1) - b.stock / (b.parLevel || 1);
      });
  }, [overzicht, zoek, sortering, alleenAandacht, gebruik, ingredienten]);

  const samenvatting = overzicht?.samenvatting;
  const openAanvragen = (overzicht?.aanvragen ?? []).filter(
    (aanvraag) => aanvraag.status === "open"
  );

  return (
    <main className="voorraad-page">
      <header className="voorraad-header">
        <div className="voorraad-title">
          <span className="menu-brand-mark" aria-hidden="true">L</span>
          <div>
            <p>Las Tapas · achter de schermen</p>
            <h1>Voorraad</h1>
          </div>
        </div>

        <div className="voorraad-header-rechts">
          <span className="connection-pill">
            <span
              className={`connection-dot ${verbonden ? "live" : "offline"}`}
            />
            {verbonden ? "Live" : "Geen verbinding"}
          </span>
          <Link href="/keuken" className="mini-button ghost">
            Keukenscherm
          </Link>
          <Link href="/uitgifte" className="mini-button ghost">
            Uitgiftescherm
          </Link>
          {/* Een gewone link, want dit is een download en geen pagina. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/voorraad/export" className="mini-button ghost">
            Export CSV
          </a>
          <Link href="/" className="mini-button ghost">
            Home
          </Link>
        </div>
      </header>

      {melding && <p className="voorraad-melding">{melding}</p>}

      {overzicht && !overzicht.persistent && (
        <p className="voorraad-waarschuwing">
          Let op: op deze server kan niet naar een bestand geschreven worden, dus
          de voorraad staat alleen in het geheugen en is weg na een herstart.
          Lokaal wordt alles in <code>data/voorraad.json</code> bewaard.
        </p>
      )}

      <section className="kpi-grid" aria-label="Samenvatting">
        <Kpi
          label="Voorraadwaarde"
          waarde={samenvatting ? formatPrice(samenvatting.waarde) : "…"}
          hint="inkoopprijs van alles bij elkaar"
        />
        <Kpi
          label="Onder par-niveau"
          waarde={String(samenvatting?.onderPar ?? "…")}
          hint="moet bijbesteld worden"
          toon={samenvatting && samenvatting.onderPar > 0 ? "warn" : "ok"}
        />
        <Kpi
          label="Leeg"
          waarde={String(samenvatting?.leeg ?? "…")}
          hint="niets meer op voorraad"
          toon={samenvatting && samenvatting.leeg > 0 ? "alarm" : "ok"}
        />
        <Kpi
          label="Uitverkochte gerechten"
          waarde={String(samenvatting?.uitverkochteGerechten ?? "…")}
          hint="kunnen nu niet gemaakt worden"
          toon={
            samenvatting && samenvatting.uitverkochteGerechten > 0
              ? "alarm"
              : "ok"
          }
        />
        <Kpi
          label="Wacht op goedkeuring"
          waarde={String(openAanvragen.length)}
          hint="grote uitgiftes voor de hoofdchef"
          toon={openAanvragen.length > 0 ? "warn" : "ok"}
        />
        <Kpi
          label="Mutaties vandaag"
          waarde={String(samenvatting?.mutatiesVandaag ?? "…")}
          hint="leveringen, verbruik en tellingen"
        />
      </section>

      <section className="voorraad-toolbar">
        <input
          className="voorraad-zoek"
          value={zoek}
          onChange={(event) => setZoek(event.target.value)}
          placeholder="Zoek op product of leverancier"
          aria-label="Zoeken in de voorraad"
        />
        <select
          className="voorraad-select"
          value={sortering}
          onChange={(event) => setSortering(event.target.value as Sortering)}
          aria-label="Sorteren"
        >
          {Object.entries(SORTERING_LABEL).map(([waarde, label]) => (
            <option key={waarde} value={waarde}>
              {label}
            </option>
          ))}
        </select>
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
            checked={alleenAandacht}
            onChange={(event) => setAlleenAandacht(event.target.checked)}
          />
          Alleen wat aandacht nodig heeft
        </label>
        <label
          className="voorraad-check"
          title="Zet dit uit als de keuken zelf afboekt op het uitgiftescherm; dan wordt er nooit dubbel geteld."
        >
          <input
            type="checkbox"
            checked={overzicht?.automatischAfboeken ?? true}
            onChange={(event) => zetAutomatischAfboeken(event.target.checked)}
            disabled={bezig || !overzicht}
          />
          Bestellingen automatisch afboeken
        </label>
        <label
          className="voorraad-check"
          title="Uitgiftes vanaf dit bedrag moeten door de hoofdchef worden goedgekeurd. 0 betekent: geen goedkeuring nodig."
        >
          Goedkeuring vanaf €
          <input
            className="boek-input"
            type="number"
            min="0"
            step="1"
            defaultValue={overzicht?.goedkeuringsdrempel ?? 0}
            onBlur={(event) =>
              zetDrempel(Number(event.target.value.replace(",", ".")))
            }
            disabled={bezig || !overzicht}
            aria-label="Goedkeuringsdrempel in euro's"
          />
        </label>
        <button
          type="button"
          className="mini-button accent"
          onClick={vulAllesAan}
          disabled={bezig}
        >
          Alles bijvullen tot par
        </button>
        <button
          type="button"
          className="mini-button ghost"
          onClick={herstelBeginvoorraad}
          disabled={bezig}
        >
          Beginvoorraad herstellen
        </button>
      </section>

      <div className="voorraad-panelen">
        <section className="panel" ref={lijstRef}>
          <h2 className="panel-heading">
            Producten{gerecht ? ` · ${gerechtNaam(gerecht).naam}` : ""}
            <span className="panel-teller">{producten.length}</span>
          </h2>
          {gerecht && (
            <p className="panel-uitleg">
              Alleen de ingrediënten van dit gerecht, met wat er per portie in
              gaat. Kies <em>Alle gerechten</em> om alles weer te zien.
            </p>
          )}

          {!overzicht && <p className="panel-leeg">Voorraad laden…</p>}
          {overzicht && producten.length === 0 && (
            <p className="panel-leeg">Geen producten die hierbij passen.</p>
          )}

          <ul className="product-lijst">
            {producten.map((product) => (
              <ProductRij
                key={product.id}
                product={product}
                gebruik={gebruik[product.id] ?? []}
                perPortie={ingredienten?.[product.id]}
                bezig={bezig}
                onBoek={boek}
                onBewaar={bewaarProduct}
                onVerwijder={verwijderProduct}
              />
            ))}
          </ul>
        </section>

        <div className="voorraad-zijkolom">
          <section className="panel">
            <h2 className="panel-heading">Nieuw product</h2>
            <NieuweProduct onToevoegen={nieuwProduct} bezig={bezig} />
          </section>

          <section className="panel">
            <h2 className="panel-heading">Mutatielog</h2>
            {overzicht && overzicht.mutaties.length === 0 && (
              <p className="panel-leeg">Nog geen mutaties geboekt.</p>
            )}
            <ul className="mutatie-lijst">
              {overzicht?.mutaties.slice(0, 25).map((mutatie) => {
                const eenheid =
                  overzicht.producten.find(
                    (p) => p.id === mutatie.ingredientId
                  )?.unit ?? "stuk";
                return (
                  <li key={mutatie.id} className="mutatie-rij">
                    <span className="mutatie-tijd">
                      {formatTijdstip(mutatie.createdAt)}
                    </span>
                    <span className="mutatie-naam">
                      {mutatie.name}
                      {mutatie.note && (
                        <small className="mutatie-notitie">{mutatie.note}</small>
                      )}
                    </span>
                    <span
                      className={`mutatie-delta ${mutatie.delta >= 0 ? "plus" : "min"}`}
                    >
                      {formatDelta(mutatie.delta, eenheid)}
                    </span>
                    <span className="mutatie-reden">
                      {REDEN_LABEL[mutatie.reason]}
                      {mutatie.door ? ` · ${ROL_LABEL[mutatie.door]}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      <section className="panel">
        {/* Inklapbaar: het is naslaginformatie, geen dagelijks werkblad. */}
        <details className="recepten-details">
          <summary className="panel-heading">
            Recepten per gerecht
            <span className="panel-teller">
              {overzicht
                ? Object.values(overzicht.status).filter((s) => !s.maakbaar).length
                : 0}{" "}
              uitverkocht
            </span>
          </summary>
          <p className="panel-uitleg">
            Elk gerecht trekt deze ingrediënten van de voorraad af bij een
            bestelling. Recepten pas je aan in <code>lib/voorraad-seed.ts</code>.
          </p>
          <div className="recept-grid">
            {overzicht?.recepten.map((recipe) => (
              <ReceptKaart
                key={recipe.menuItemId}
                recipe={recipe}
                status={overzicht.status[recipe.menuItemId]}
                producten={overzicht.producten}
                onKiesGerecht={kiesGerecht}
              />
            ))}
          </div>
        </details>
      </section>
    </main>
  );
}

function Kpi({
  label,
  waarde,
  hint,
  toon = "neutraal",
}: {
  label: string;
  waarde: string;
  hint: string;
  toon?: "neutraal" | "ok" | "warn" | "alarm";
}) {
  return (
    <article className={`kpi-card ${toon}`}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-waarde">{waarde}</p>
      <p className="kpi-hint">{hint}</p>
    </article>
  );
}

function ProductRij({
  product,
  gebruik,
  perPortie,
  bezig,
  onBoek,
  onBewaar,
  onVerwijder,
}: {
  product: Product;
  /** De gerechten waarin dit ingrediënt zit. */
  gebruik: { menuItemId: string; naam: string; amount: number }[];
  /** Is er op een gerecht gefilterd? Dan staat hier de hoeveelheid per portie. */
  perPortie?: number;
  bezig: boolean;
  onBoek: (
    id: string,
    invoer: { delta?: number; naar?: number; reason: MovementReason; note?: string }
  ) => void;
  onBewaar: (id: string, patch: Partial<Product>) => void;
  onVerwijder: (product: Product) => void;
}) {
  const [aantal, setAantal] = useState(product.unit === "stuk" ? "1" : "1000");
  const [reden, setReden] = useState<MovementReason>("levering");
  const [open, setOpen] = useState(false);
  const [par, setPar] = useState(String(product.parLevel));
  const [prijs, setPrijs] = useState(String(product.costPerUnit));
  const [leverancier, setLeverancier] = useState(product.supplier ?? "");

  const niveau = voorraadNiveau(product);
  const schaal = Math.max(product.parLevel, product.stock);
  const percentage = schaal > 0 ? Math.min(100, (product.stock / schaal) * 100) : 0;

  function boek() {
    const getal = Number(aantal.replace(",", "."));
    if (!Number.isFinite(getal) || getal === 0) return;

    if (reden === "correctie") {
      onBoek(product.id, { naar: getal, reason: "correctie", note: "Handmatige telling" });
      return;
    }
    onBoek(product.id, {
      delta: reden === "verlies" ? -Math.abs(getal) : Math.abs(getal),
      reason: reden,
    });
  }

  return (
    <li className="product-rij">
      <div className="product-naam-cel">
        <p className="product-naam">{product.name}</p>
        <p className="product-meta">
          {formatUnitPrice(product.costPerUnit, product.unit)}
          {product.supplier ? ` · ${product.supplier}` : ""}
        </p>
        <p className="product-gerechten">
          {gebruik.length
            ? `voor ${gebruik.map((regel) => regel.naam).join(", ")}`
            : "niet aan een gerecht gekoppeld"}
          {perPortie !== undefined &&
            ` · nodig: ${formatAmount(perPortie, product.unit)} per portie`}
        </p>
      </div>

      <div className="product-voorraad-cel">
        <p className="product-aantal">{formatAmount(product.stock, product.unit)}</p>
        <span className="product-bar" aria-hidden="true">
          <span
            className={`product-bar-fill ${niveau}`}
            style={{ width: `${percentage}%` }}
          />
        </span>
        <p className="product-meta">
          par {formatAmount(product.parLevel, product.unit)} ·{" "}
          {formatPrice(product.stock * product.costPerUnit)}
        </p>
      </div>

      <div className="product-status-cel">
        <span className={`status-badge ${niveau}`}>{NIVEAU_LABEL[niveau]}</span>
      </div>

      <div className="product-acties">
        <input
          className="boek-input"
          value={aantal}
          onChange={(event) => setAantal(event.target.value)}
          inputMode="decimal"
          aria-label={`Aantal voor ${product.name}`}
          title={reden === "correctie" ? "Nieuw geteld aantal" : "Aantal"}
        />
        <select
          className="boek-select"
          value={reden}
          onChange={(event) => setReden(event.target.value as MovementReason)}
          aria-label={`Soort mutatie voor ${product.name}`}
        >
          <option value="levering">Levering</option>
          <option value="verlies">Verlies</option>
          <option value="correctie">Telling</option>
        </select>
        <button
          type="button"
          className="mini-button accent"
          onClick={boek}
          disabled={bezig}
        >
          Boeken
        </button>
        <button
          type="button"
          className="mini-button ghost"
          onClick={() =>
            onBoek(product.id, {
              naar: product.parLevel,
              reason: "levering",
              note: "Aangevuld tot par-niveau",
            })
          }
          disabled={bezig || product.stock >= product.parLevel}
          title="Direct bijvullen tot het par-niveau"
        >
          + par
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={`Productgegevens van ${product.name} aanpassen`}
        >
          ✎
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => onVerwijder(product)}
          aria-label={`${product.name} verwijderen`}
        >
          ✕
        </button>
      </div>

      {open && (
        <div className="product-bewerken">
          <label className="boek-veld">
            Par-niveau
            <input
              className="boek-input breed"
              value={par}
              onChange={(event) => setPar(event.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="boek-veld">
            Inkoopprijs per eenheid
            <input
              className="boek-input breed"
              value={prijs}
              onChange={(event) => setPrijs(event.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="boek-veld">
            Leverancier
            <input
              className="boek-input breed"
              value={leverancier}
              onChange={(event) => setLeverancier(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="mini-button accent"
            onClick={() => {
              onBewaar(product.id, {
                parLevel: Number(par.replace(",", ".")),
                costPerUnit: Number(prijs.replace(",", ".")),
                supplier: leverancier,
              });
              setOpen(false);
            }}
            disabled={bezig}
          >
            Opslaan
          </button>
        </div>
      )}
    </li>
  );
}

function ReceptKaart({
  recipe,
  status,
  producten,
  onKiesGerecht,
}: {
  onKiesGerecht?: (menuItemId: string) => void;
  recipe: Recipe;
  status?: GerechtStatus;
  producten: Product[];
}) {
  const { naam, categorie } = gerechtNaam(recipe.menuItemId);

  return (
    <article className={`recept-kaart ${status?.maakbaar ? "" : "uitverkocht"}`}>
      <header className="recept-kop">
        <div>
          <p className="recept-categorie">{categorie}</p>
          <h3 className="recept-titel">{naam}</h3>
        </div>
        <span className={`status-badge ${status?.maakbaar ? "ok" : "leeg"}`}>
          {status?.maakbaar ? `nog ${status.porties} porties` : "uitverkocht"}
        </span>
      </header>

      {onKiesGerecht && (
        <button
          type="button"
          className="mini-button ghost recept-kies"
          onClick={() => onKiesGerecht(recipe.menuItemId)}
        >
          Toon deze ingrediënten in de lijst
        </button>
      )}

      <ul className="recept-regels">
        {recipe.lines.map((line) => {
          const product = producten.find((p) => p.id === line.ingredientId);
          const tekort = status?.tekort.some(
            (t) => t.ingredientId === line.ingredientId
          );
          return (
            <li key={line.ingredientId} className={tekort ? "tekort" : ""}>
              <span>{product?.name ?? line.ingredientId}</span>
              <span>
                {formatAmount(line.amount, product?.unit ?? "stuk")}
                {tekort && " tekort"}
              </span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

type ZoekResultaat = {
  code: string;
  naam: string;
  merk?: string;
  hoeveelheid?: string;
  categorie?: string;
  eenheid: Unit;
  inhoud?: number;
};

function NieuweProduct({
  onToevoegen,
  bezig,
}: {
  onToevoegen: (invoer: {
    name: string;
    unit: Unit;
    stock: number;
    parLevel: number;
    costPerUnit: number;
    supplier: string;
  }) => Promise<boolean>;
  bezig: boolean;
}) {
  const [naam, setNaam] = useState("");
  const [eenheid, setEenheid] = useState<Unit>("gram");
  const [voorraad, setVoorraad] = useState("0");
  const [par, setPar] = useState("0");
  const [prijs, setPrijs] = useState("0");
  const [leverancier, setLeverancier] = useState("");
  const [zoekterm, setZoekterm] = useState("");
  const [resultaten, setResultaten] = useState<ZoekResultaat[]>([]);
  const [zoekBezig, setZoekBezig] = useState(false);
  const [zoekMelding, setZoekMelding] = useState<string | null>(null);

  async function zoekProduct() {
    if (zoekterm.trim().length < 2) {
      setZoekMelding("Typ minimaal twee letters.");
      return;
    }
    setZoekBezig(true);
    setZoekMelding(null);
    try {
      const antwoord = await fetch(
        `/api/voorraad/zoek?q=${encodeURIComponent(zoekterm)}`,
        { cache: "no-store" }
      );
      const data = (await antwoord.json()) as {
        resultaten?: ZoekResultaat[];
        waarschuwing?: string;
      };
      setResultaten(data.resultaten ?? []);
      setZoekMelding(
        data.waarschuwing ??
          (data.resultaten?.length
            ? null
            : "Niets gevonden, vul het product met de hand in.")
      );
    } catch {
      setZoekMelding("Zoeken mislukte, vul het product met de hand in.");
    } finally {
      setZoekBezig(false);
    }
  }

  async function verstuur(event: React.FormEvent) {
    event.preventDefault();
    const gelukt = await onToevoegen({
      name: naam,
      unit: eenheid,
      stock: Number(voorraad.replace(",", ".")) || 0,
      parLevel: Number(par.replace(",", ".")) || 0,
      costPerUnit: Number(prijs.replace(",", ".")) || 0,
      supplier: leverancier,
    });
    if (gelukt) {
      setNaam("");
      setVoorraad("0");
      setPar("0");
      setPrijs("0");
      setLeverancier("");
      setResultaten([]);
      setZoekterm("");
    }
  }

  return (
    <form className="nieuw-product" onSubmit={verstuur}>
      <p className="panel-uitleg">
        Weet je de naam niet precies? Zoek het product op in de gratis
        productendatabase <strong>Open Food Facts</strong> (geen account nodig).
      </p>

      <div className="zoek-rij">
        <input
          className="boek-input breed"
          value={zoekterm}
          onChange={(event) => setZoekterm(event.target.value)}
          placeholder="bijv. olijfolie"
          aria-label="Product opzoeken"
        />
        <button
          type="button"
          className="mini-button ghost"
          onClick={zoekProduct}
          disabled={zoekBezig}
        >
          {zoekBezig ? "Zoeken…" : "Zoek"}
        </button>
      </div>

      {zoekMelding && <p className="zoek-melding">{zoekMelding}</p>}

      {resultaten.length > 0 && (
        <ul className="zoek-resultaten">
          {resultaten.map((resultaat) => (
            <li key={`${resultaat.code}-${resultaat.naam}`}>
              <button
                type="button"
                onClick={() => {
                  setNaam(resultaat.merk ? `${resultaat.merk} ${resultaat.naam}` : resultaat.naam);
                  setEenheid(resultaat.eenheid);
                  setResultaten([]);
                  setZoekterm("");
                }}
              >
                <span className="zoek-naam">{resultaat.naam}</span>
                <span className="zoek-detail">
                  {[resultaat.merk, resultaat.hoeveelheid, resultaat.categorie]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="boek-veld">
        Naam
        <input
          className="boek-input breed"
          value={naam}
          onChange={(event) => setNaam(event.target.value)}
          placeholder="bijv. Knoflook"
          required
          minLength={2}
        />
      </label>

      <div className="nieuw-rij">
        <label className="boek-veld">
          Eenheid
          <select
            className="boek-select breed"
            value={eenheid}
            onChange={(event) => setEenheid(event.target.value as Unit)}
          >
            <option value="gram">gram</option>
            <option value="ml">ml</option>
            <option value="stuk">stuk</option>
          </select>
        </label>
        <label className="boek-veld">
          Voorraad
          <input
            className="boek-input breed"
            value={voorraad}
            onChange={(event) => setVoorraad(event.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="boek-veld">
          Par-niveau
          <input
            className="boek-input breed"
            value={par}
            onChange={(event) => setPar(event.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="boek-veld">
          Inkoopprijs
          <input
            className="boek-input breed"
            value={prijs}
            onChange={(event) => setPrijs(event.target.value)}
            inputMode="decimal"
          />
        </label>
      </div>

      <label className="boek-veld">
        Leverancier
        <input
          className="boek-input breed"
          value={leverancier}
          onChange={(event) => setLeverancier(event.target.value)}
        />
      </label>

      <button type="submit" className="mini-button accent" disabled={bezig}>
        Product toevoegen
      </button>
    </form>
  );
}
