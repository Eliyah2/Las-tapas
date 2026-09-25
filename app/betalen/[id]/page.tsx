"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatPrice } from "@/lib/format";

type Sessie = {
  id: string;
  table: string;
  bedrag: number;
  status: "open" | "betaald";
  laatsteVier?: string;
};

export default function BetalenPage() {
  // Het sessie-id zit in het pad van de route (/betalen/[id]), niet in de query.
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] ?? "" : params.id ?? "";

  const [sessie, setSessie] = useState<Sessie | null>(null);
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
        } else {
          setSessie(data.sessie);
        }
      })
      .catch(() => setFout("Geen verbinding met de server."))
      .finally(() => setLaden(false));
  }, [id, idOntbreekt]);

  async function betaal(e: React.FormEvent) {
    e.preventDefault();
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
            <p className="eyebrow">Pago aceptado</p>
            <h1>Betaling geslaagd</h1>
            <p className="pay-total">{formatPrice(sessie.bedrag)}</p>
            <p>
              Tafel {sessie.table} is afgerekend met kaart{" "}
              <b>•••• {sessie.laatsteVier}</b>. Bewaar deze bevestiging als
              bonnetje.
            </p>
            <Link
              href={`/status?tafel=${encodeURIComponent(sessie.table)}`}
              className="button pay-submit"
            >
              Status van mijn bestelling
            </Link>
            <Link href="/" className="pay-klein">
              Terug naar de homepage
            </Link>
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
              <small>Te betalen</small>
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
                onChange={(e) => setNummer(e.target.value)}
                placeholder="4242 4242 4242 4242"
                className="pay-input"
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
                    onChange={(e) => setVervalt(e.target.value)}
                    placeholder="MM/JJ"
                    className="pay-input"
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
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    className="pay-input"
                    required
                  />
                </div>
              </div>

              {fout && <p className="order-error">{fout}</p>}

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
