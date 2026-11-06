"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

/* Het oberdashboard laat de zaak zien zoals hij op de plattegrond staat:
   beneden tien tafels, boven zestien. Per tafel zie je meteen of hij bezet is,
   wat er nog in de keuken ligt en hoelang de gasten nog mogen blijven. */

type Status = "vrij" | "bezet" | "laatste-ronde" | "tijd-om";

type TafelStand = {
  code: string;
  zone: string;
  stoelen: number;
  bezet: boolean;
  personen: number;
  resterend: number | null;
  status: Status;
  open: number;
  klaar: number;
  bedrag: number;
};

type Vloer = {
  id: string;
  naam: string;
  ondertitel: string;
  kolommen: number;
  tafels: TafelStand[];
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
  tarief: { tariefPerPersoon: number; duurMinuten: number };
  bijgewerkt: number;
};

const STATUS_LABEL: Record<Status, string> = {
  vrij: "Vrij",
  bezet: "Bezet",
  "laatste-ronde": "Laatste ronde",
  "tijd-om": "Tijd om",
};

function minutenTekst(minuten: number | null): string {
  if (minuten === null) return "";
  if (minuten <= 0) return "periode voorbij";
  if (minuten < 60) return `nog ${minuten} min`;
  const uur = Math.floor(minuten / 60);
  const rest = minuten % 60;
  return rest > 0 ? `nog ${uur} u ${rest} min` : `nog ${uur} uur`;
}

function tijdKort(tijdstip: number): string {
  return new Date(tijdstip).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OberDashboard() {
  const [data, setData] = useState<Overzicht | null>(null);
  const [fout, setFout] = useState("");
  const [vloer, setVloer] = useState("alles");
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

  const vloeren = useMemo(() => {
    const alles = data?.verdiepingen ?? [];
    return vloer === "alles" ? alles : alles.filter((rij) => rij.id === vloer);
  }, [data, vloer]);

  const aandacht = (data?.verdiepingen ?? [])
    .flatMap((rij) => rij.tafels)
    .filter((tafel) => tafel.status === "laatste-ronde" || tafel.status === "tijd-om");

  const kpi = data?.kpi;

  return (
    <main className="ober-pagina">
      <header className="ober-kop">
        <div className="ober-kop-inner">
          <div className="ober-merk">
            <span className="ober-merk-mark" aria-hidden="true">
              L
            </span>
            <div>
              <p className="ober-merk-naam">Las Tapas</p>
              <p className="ober-merk-sub">Oberdashboard · bediening</p>
            </div>
          </div>

          <div className="ober-kop-meta">
            {data && (
              <span className="ober-pil">
                {kpi?.bezet} / {kpi?.tafels} tafels bezet
              </span>
            )}
            {data && (
              <span className="ober-pil zacht">
                {tijdKort(data.bijgewerkt)}
              </span>
            )}
            <button
              type="button"
              onClick={laad}
              className="ober-ververs"
              disabled={laadt}
              aria-label="Verversen"
            >
              ↻ Verversen
            </button>
            <Link href="/manager" className="ober-pil">
              ◆ Manageroverzicht
            </Link>
            <Link href="/" className="ober-pil">
              ← Home
            </Link>
          </div>
        </div>

        <nav className="menu-tabs" aria-label="Verdieping">
          <button
            type="button"
            onClick={() => setVloer("alles")}
            className={`menu-tab${vloer === "alles" ? " actief" : ""}`}
          >
            Hele zaak
          </button>
          {(data?.verdiepingen ?? []).map((rij) => (
            <button
              key={rij.id}
              type="button"
              onClick={() => setVloer(rij.id)}
              className={`menu-tab${vloer === rij.id ? " actief" : ""}`}
            >
              {rij.naam}
            </button>
          ))}
        </nav>
      </header>

      <div className="ober-inhoud">
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
            <span className="ober-kpi-waarde">{kpi?.vrij ?? "–"}</span>
            <span className="ober-kpi-label">Vrije tafels</span>
          </article>
          <article className="ober-kpi">
            <span className="ober-kpi-waarde">{kpi?.gasten ?? "–"}</span>
            <span className="ober-kpi-label">Gasten in huis</span>
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
            <span className="ober-kpi-label">
              Openstaand
              {data ? ` · vanaf ${formatPrice(data.tarief.tariefPerPersoon)} p.p.` : ""}
            </span>
          </article>
        </section>

        {aandacht.length > 0 && (
          <p className="ober-melding" role="status">
            <strong>Aandacht:</strong>{" "}
            {aandacht
              .map((tafel) => `tafel ${tafel.code} (${STATUS_LABEL[tafel.status]})`)
              .join(", ")}
            .
          </p>
        )}

        {vloeren.map((rij) => (
          <section key={rij.id} className="ober-vloer">
            <div className="ober-vloer-kop">
              <div>
                <p className="eyebrow">{rij.ondertitel}</p>
                <h2>{rij.naam}</h2>
              </div>
              <p className="ober-vloer-meta">
                {rij.tafels.length} tafels · {rij.stoelen} zitplaatsen ·{" "}
                {rij.bezet} bezet
              </p>
            </div>

            <div
              className="ober-vloer-grid"
              style={{ "--kolommen": rij.kolommen } as CSSProperties}
            >
              {rij.tafels.map((tafel) => (
                <Link
                  key={tafel.code}
                  href={
                    tafel.bezet
                      ? `/rekening?tafel=${encodeURIComponent(tafel.code)}`
                      : `/welkom?tafel=${encodeURIComponent(tafel.code)}`
                  }
                  className={`ober-tafel ${tafel.status}`}
                >
                  <span className="ober-tafel-kop">
                    <span className="ober-tafel-nr">
                      <span className="ober-tafel-label">Tafel</span>
                      {tafel.code}
                    </span>
                    <span className="ober-tafel-status">
                      {STATUS_LABEL[tafel.status]}
                    </span>
                  </span>

                  <span className="ober-tafel-meta">
                    {tafel.bezet
                      ? `${tafel.personen} van ${tafel.stoelen} gasten`
                      : `${tafel.stoelen} zitplaatsen`}
                  </span>

                  {tafel.bezet ? (
                    <>
                      <span className="ober-tafel-info">
                        {tafel.open > 0
                          ? `${tafel.open} bestelling${tafel.open === 1 ? "" : "en"} open`
                          : "Nog niets besteld"}
                        {tafel.klaar > 0 ? ` · ${tafel.klaar} klaar` : ""}
                      </span>
                      <span className="ober-tafel-voet">
                        <span>{minutenTekst(tafel.resterend)}</span>
                        <strong>{formatPrice(tafel.bedrag)}</strong>
                      </span>
                    </>
                  ) : (
                    <span className="ober-tafel-info">{tafel.zone}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}

        <p className="ober-voetnoot">
          Tik op een bezette tafel om de rekening te openen, of op een vrije tafel
          om gasten aan te melden. Dit overzicht ververst elke vijf seconden.
        </p>
      </div>
    </main>
  );
}
