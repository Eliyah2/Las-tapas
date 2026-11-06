"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import {
  ARRANGEMENTEN,
  STANDAARD_ARRANGEMENT,
  arrangementVan,
  type ArrangementId,
} from "@/lib/arrangementen";

export default function GastenKiezer({ tafel }: { tafel: string }) {
  const router = useRouter();
  const [personen, setPersonen] = useState(2);
  // Namen horen bij een plek aan tafel: naam[0] is persoon 1, enzovoort.
  const [namen, setNamen] = useState<string[]>([]);
  // Welk arrangement de tafel heeft gekozen; de server kan er al één hebben.
  const [arrangementId, setArrangementId] =
    useState<ArrangementId>(STANDAARD_ARRANGEMENT);
  // Heeft de gast zelf al een arrangement aangetikt? Dan mag het antwoord van
  // de server (dat even later binnenkomt) die keuze niet terugdraaien.
  const zelfGekozen = useRef(false);
  const [alBegonnen, setAlBegonnen] = useState<number | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const arrangement = arrangementVan(arrangementId);

  // Staat deze tafel al open? Dan vullen we het aantal personen, de namen en het
  // arrangement in dat de bediening al had gekozen.
  useEffect(() => {
    fetch(`/api/tafel?tafel=${encodeURIComponent(tafel)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!zelfGekozen.current && typeof data.arrangement === "string") {
          setArrangementId(data.arrangement as ArrangementId);
        }
        if (data.personen > 0) setPersonen(data.personen);
        if (Array.isArray(data.namen) && data.namen.length > 0) {
          setNamen(data.namen);
        }
        if (data.sessie) setAlBegonnen(data.resterendeMinuten);
      })
      .catch(() => {
        // Geen verbinding? Dan tonen we gewoon de standaardgegevens.
      });
  }, [tafel]);

  function verstel(verschil: number) {
    setPersonen((huidig) => Math.min(Math.max(huidig + verschil, 1), 40));
  }

  function zetNaam(index: number, waarde: string) {
    setNamen((huidig) => {
      const volgende = [...huidig];
      volgende[index] = waarde;
      return volgende;
    });
  }

  // De tijd is om: dan begint een nieuwe eetperiode (bediening verlengt de tafel).
  const tijdOm = alBegonnen !== null && alBegonnen <= 0;
  const totaal =
    Math.round(personen * arrangement.prijsPerPersoon * 100) / 100;

  // Met JavaScript sturen we de tafel zelf door, zodat we hier een fout kunnen
  // tonen. Zonder JavaScript doet het formulier hieronder hetzelfde werk: het
  // post naar /api/tafel en die stuurt door naar de menukaart. Zo werkt de knop
  // ook meteen, voordat React klaar is met laden (op de iPad van de zaak duurt
  // dat even).
  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout("");
    try {
      const res = await fetch("/api/tafel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tafel,
          personen,
          namen: Array.from({ length: personen }, (_, i) => namen[i] ?? ""),
          arrangement: arrangementId,
          herstart: tijdOm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFout(data.error ?? "De tafel kon niet gestart worden.");
        return;
      }
      router.push(`/menu?tafel=${encodeURIComponent(tafel)}`);
    } catch {
      setFout("Geen verbinding met de server.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="gasten-kiezer">
      {alBegonnen !== null && (
        <p className="gasten-al-open">
          Deze tafel is al begonnen
          {alBegonnen > 0 ? ` · nog ${alBegonnen} minuten` : " · de tijd is om"}
        </p>
      )}

      <form
        method="post"
        action="/api/tafel"
        onSubmit={start}
        className="gasten-form"
      >
        <input type="hidden" name="tafel" value={tafel} />
        <input type="hidden" name="personen" value={personen} />
        <input type="hidden" name="arrangement" value={arrangementId} />
        {tijdOm && <input type="hidden" name="herstart" value="true" />}

        <p className="gasten-vraag">Met hoeveel personen eten jullie?</p>

        <div className="gasten-teller">
          <button
            type="button"
            onClick={() => verstel(-1)}
            disabled={personen <= 1}
            className="gasten-knop"
            aria-label="Eén persoon minder"
          >
            −
          </button>
          <span className="gasten-aantal" aria-live="polite">
            {personen}
          </span>
          <button
            type="button"
            onClick={() => verstel(1)}
            disabled={personen >= 40}
            className="gasten-knop"
            aria-label="Eén persoon meer"
          >
            +
          </button>
          <span className="gasten-personen">
            {personen === 1 ? "persoon" : "personen"}
          </span>
        </div>

        <p className="gasten-vraag gasten-arrangement-vraag">
          Welk arrangement?{" "}
          <span>All you can eat, per persoon, eten inbegrepen.</span>
        </p>

        <div
          className="gasten-arrangementen"
          role="radiogroup"
          aria-label="Arrangement"
        >
          {ARRANGEMENTEN.map((optie) => (
            <button
              key={optie.id}
              type="button"
              role="radio"
              aria-checked={optie.id === arrangementId}
              onClick={() => {
                zelfGekozen.current = true;
                setArrangementId(optie.id);
              }}
              className={`gasten-arrangement${
                optie.id === arrangementId ? " actief" : ""
              }`}
            >
              <span className="gasten-arrangement-naam">{optie.naam}</span>
              <span className="gasten-arrangement-prijs">
                {formatPrice(optie.prijsPerPersoon)} p.p.
              </span>
            </button>
          ))}
        </div>

        <p className="gasten-vraag gasten-namen-vraag">
          Wie zitten er aan tafel? <span>Namen maken de bestelling duidelijk.</span>
        </p>

        <div className="gasten-namen">
          {Array.from({ length: personen }, (_, index) => (
            <input
              key={index}
              name="namen"
              value={namen[index] ?? ""}
              onChange={(event) => zetNaam(index, event.target.value)}
              placeholder={`Persoon ${index + 1}`}
              maxLength={20}
              className="gasten-naam"
              aria-label={`Naam van persoon ${index + 1}`}
            />
          ))}
        </div>

        <p className="gasten-tarief">
          {arrangement.naam} · {formatPrice(arrangement.prijsPerPersoon)} per
          persoon
          <span className="gasten-totaal">samen {formatPrice(totaal)}</span>
        </p>

        <button
          type="submit"
          disabled={bezig}
          className="button welcome-button"
        >
          {bezig
            ? "Bezig…"
            : tijdOm
              ? "Nieuwe eetperiode starten"
              : alBegonnen !== null
                ? "Verder bestellen"
                : "Aan tafel · bekijk de kaart"}
        </button>

        {fout && (
          <p className="order-error" role="alert">
            {fout}
          </p>
        )}

        <p className="gasten-klein">
          De keuken stopt met nieuwe gerechten in de laatste{" "}
          {arrangement.laatsteRondeMinuten} minuten, zodat alles op tijd op tafel
          staat.
        </p>
      </form>
    </div>
  );
}
