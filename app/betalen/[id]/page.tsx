"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatPrice, formatTijdstip } from "@/lib/format";
import { Rosette } from "@/components/decor";

type Sessie = {
  id: string;
  table: string;
  bedrag: number;
  status: "open" | "betaald";
  laatsteVier?: string;
  betaaldOp?: number;
};

type Bonregel = {
  omschrijving: string;
  aantal: number;
  stukprijs: number;
  bedrag: number;
};

type BtwRegel = {
  tarief: number;
  grondslag: number;
  btw: number;
};

type Bonnetje = {
  nummer: string;
  restaurant: {
    naam: string;
    straat: string;
    plaats: string;
    kvk: string;
    btwNummer: string;
  };
  tafel: string;
  personen: number;
  betaaldOp?: number;
  laatsteVier?: string;
  regels: Bonregel[];
  btw: BtwRegel[];
  totaal: number;
  totaalExclusief: number;
};

/** Kaartnummers en codes bestaan alleen uit cijfers; spaties zetten we er zelf in. */
function alleenCijfers(waarde: string): string {
  return waarde.replace(/\D/g, "");
}

/** 4242424242424242 wordt "4242 4242 4242 4242". */
function formatKaartnummer(waarde: string): string {
  return alleenCijfers(waarde)
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

/** 0928 wordt "09/28"; de schuine streep komt er dus vanzelf in. */
function formatVervaldatum(waarde: string): string {
  const cijfers = alleenCijfers(waarde).slice(0, 4);
  return cijfers.length <= 2 ? cijfers : `${cijfers.slice(0, 2)}/${cijfers.slice(2)}`;
}

export default function BetalenPage() {
  // Het sessie-id zit in het pad van de route (/betalen/[id]), niet in de query.
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] ?? "" : params.id ?? "";

  const [sessie, setSessie] = useState<Sessie | null>(null);
  const [bon, setBon] = useState<Bonnetje | null>(null);
  const [nummer, setNummer] = useState("");
  const [houder, setHouder] = useState("");
  const [vervalt, setVervalt] = useState("");
  const [cvc, setCvc] = useState("");
  const [fout, setFout] = useState("");
  const [verzenden, setVerzenden] = useState(false);
  const [gelukt, setGelukt] = useState(false);
  const [laden, setLaden] = useState(true);

  // Het bedrag komt altijd van de server via de sessie: in de URL staat
  // uitsluitend het sessienummer, dus knutselen aan het bedrag heeft geen effect.
  const idOntbreekt = !id.trim();

  useEffect(() => {
    if (idOntbreekt) return;
    fetch(`/api/betalen/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.sessie) {
          setFout(data.error ?? "Betaalsessie niet gevonden.");
        } else if (data.sessie.status === "betaald") {
          setGelukt(true);
          setSessie(data.sessie);
          setBon(data.bonnetje ?? null);
        } else {
          setSessie(data.sessie);
        }
      })
      .catch(() => setFout("Geen verbinding met de server."))
      .finally(() => setLaden(false));
  }, [id, idOntbreekt]);

  async function betaal(e: React.FormEvent) {
    e.preventDefault();

    // Eerst zelf controleren, zodat de gast meteen ziet wat er mis is in
    // plaats van te wachten op een antwoord van de server.
    if (alleenCijfers(nummer).length !== 16) {
      setFout("Vul een kaartnummer van 16 cijfers in.");
      return;
    }
    if (!houder.trim()) {
      setFout("Vul de naam op de kaart in.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(vervalt)) {
      setFout("Vul de vervaldatum in als MM/JJ, bijvoorbeeld 09/28.");
      return;
    }
    if (!/^\d{3,4}$/.test(cvc)) {
      setFout("De CVC bestaat uit 3 of 4 cijfers.");
      return;
    }

    setVerzenden(true);
    setFout("");
    try {
      const res = await fetch(`/api/betalen/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kaart: { nummer, houder, vervalt, cvc },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFout(data.error ?? "De betaling is mislukt. Probeer het opnieuw.");
        return;
      }
      // Kaartgegevens direct uit de pagina halen: het restaurant bewaart ze niet.
      setNummer("");
      setHouder("");
      setVervalt("");
      setCvc("");
      setSessie(data.sessie);
      setBon(data.bonnetje ?? null);
      setGelukt(true);
    } catch {
      setFout("Geen verbinding met de server.");
    } finally {
      setVerzenden(false);
    }
  }

  return (
    <main className="pay-page">
      <div className="pay-card">
        {idOntbreekt ? (
          <>
            <h1>Betaling niet mogelijk</h1>
            <p>Er is geen betaalsessie meegegeven in de link.</p>
            <Link href="/" className="button">
              Terug naar de homepage
            </Link>
          </>
        ) : laden ? (
          <p>Betaalpagina laden…</p>
        ) : fout && !sessie ? (
          <>
            <h1>Betaling niet mogelijk</h1>
            <p>{fout}</p>
            <Link href="/" className="button">
              Terug naar de homepage
            </Link>
          </>
        ) : gelukt && sessie ? (
          <>
            <div className="betaald-kop">
              <Rosette size={80} />
              <p className="eyebrow">Pago aceptado</p>
              <h1>Betaling geslaagd</h1>
            </div>

            {bon ? (
              <div className="bon">
                <div className="bon-restaurant">
                  <p className="bon-naam">{bon.restaurant.naam}</p>
                  <p>
                    {bon.restaurant.straat} · {bon.restaurant.plaats}
                  </p>
                  <p>
                    KvK {bon.restaurant.kvk} · btw-nr. {bon.restaurant.btwNummer}
                  </p>
                </div>

                <div className="bon-meta">
                  <span>Bon {bon.nummer}</span>
                  <span>Tafel {bon.tafel}</span>
                  <span>
                    {bon.personen} {bon.personen === 1 ? "persoon" : "personen"}
                  </span>
                  <span>
                    {bon.betaaldOp ? formatTijdstip(bon.betaaldOp) : ""}
                  </span>
                </div>

                <div className="bon-groep">
                  {bon.regels.map((regel) => (
                    <div className="bon-rij" key={regel.omschrijving}>
                      <span>
                        {regel.aantal}× {regel.omschrijving}
                        <small className="bon-per-stuk">
                          {formatPrice(regel.stukprijs)} per persoon
                        </small>
                      </span>
                      <span>{formatPrice(regel.bedrag)}</span>
                    </div>
                  ))}
                </div>

                <div className="bon-totalen">
                  {bon.btw.map((regel) => (
                    <div className="bon-rij zacht" key={regel.tarief}>
                      <span>
                        Btw {Math.round(regel.tarief * 100)}% over{" "}
                        {formatPrice(regel.grondslag)}
                      </span>
                      <span>{formatPrice(regel.btw)}</span>
                    </div>
                  ))}
                  <div className="bon-rij zacht">
                    <span>Totaal exclusief btw</span>
                    <span>{formatPrice(bon.totaalExclusief)}</span>
                  </div>
                  <div className="bon-rij sterk">
                    <span>Totaal</span>
                    <span>{formatPrice(bon.totaal)}</span>
                  </div>
                  <div className="bon-rij zacht">
                    <span>Betaald met kaart</span>
                    <span>•••• {bon.laatsteVier}</span>
                  </div>
                </div>

                <p className="bon-bedankt">
                  ¡Gracias! Bewaar dit bonnetje voor je administratie.
                </p>
              </div>
            ) : (
              <p className="pay-betaald-uitleg">
                Tafel {sessie.table} is afgerekend met kaart{" "}
                <b>•••• {sessie.laatsteVier}</b>
                {sessie.betaaldOp
                  ? ` om ${formatTijdstip(sessie.betaaldOp)}`
                  : ""}
                .
              </p>
            )}

            <div className="pay-acties">
              <Link
                href={`/menu?tafel=${encodeURIComponent(sessie.table)}`}
                className="button"
              >
                Nog iets bestellen
              </Link>
              {bon && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="button-licht"
                >
                  Bonnetje afdrukken
                </button>
              )}
            </div>
          </>
        ) : sessie ? (
          <>
            <header className="pay-header">
              <span className="brand-mark" aria-hidden="true">
                L
              </span>
              <div>
                <p className="eyebrow">Veilig afrekenen</p>
                <h1>Betaling tafel {sessie.table}</h1>
              </div>
            </header>

            <div className="pay-total-blok">
              <small>Te betalen · onbeperkt tapas per persoon</small>
              <span className="pay-total">{formatPrice(sessie.bedrag)}</span>
            </div>

            <form onSubmit={betaal} className="pay-form">
              <label className="pay-label" htmlFor="kaartnummer">
                Kaartnummer
              </label>
              <input
                id="kaartnummer"
                inputMode="numeric"
                autoComplete="cc-number"
                value={nummer}
                onChange={(e) => setNummer(formatKaartnummer(e.target.value))}
                placeholder="4242 4242 4242 4242"
                className="pay-input"
                maxLength={19}
                required
              />

              <label className="pay-label" htmlFor="houder">
                Naam op de kaart
              </label>
              <input
                id="houder"
                autoComplete="cc-name"
                value={houder}
                onChange={(e) => setHouder(e.target.value)}
                placeholder="Zoals op de kaart"
                className="pay-input"
                required
              />

              <div className="pay-rij">
                <div>
                  <label className="pay-label" htmlFor="vervalt">
                    Vervaldatum
                  </label>
                  <input
                    id="vervalt"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={vervalt}
                    onChange={(e) => setVervalt(formatVervaldatum(e.target.value))}
                    placeholder="MM/JJ"
                    className="pay-input"
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <label className="pay-label" htmlFor="cvc">
                    CVC
                  </label>
                  <input
                    id="cvc"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cvc}
                    onChange={(e) => setCvc(alleenCijfers(e.target.value).slice(0, 4))}
                    placeholder="123"
                    className="pay-input"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              {fout && (
                <p className="order-error" role="alert">
                  {fout}
                </p>
              )}

              <button
                type="submit"
                disabled={verzenden}
                className="button pay-submit"
              >
                {verzenden
                  ? "Bezig met betalen…"
                  : `Betaal ${formatPrice(sessie.bedrag)}`}
              </button>

              <p className="pay-klein">
                Demo-omgeving: gebruik testkaart 4242 4242 4242 4242 om te
                slagen of 4000 0000 0000 0002 om een weigering te zien. Je
                kaartgegevens worden alleen gecontroleerd en daarna weggegooid —
                het restaurant slaat ze niet op.
              </p>
            </form>
          </>
        ) : null}
      </div>
    </main>
  );
}
