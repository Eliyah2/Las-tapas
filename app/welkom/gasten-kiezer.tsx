"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

type Tarief = {
  tariefPerPersoon: number;
  duurMinuten: number;
  laatsteRondeMinuten: number;
};

/** Zo lang duurt de eetperiode, leesbaar als "2,5 uur". */
function duurTekst(minuten: number): string {
  const uren = minuten / 60;
  return `${uren.toString().replace(".", ",")} uur`;
}

export default function GastenKiezer({ tafel }: { tafel: string }) {
  const router = useRouter();
  const [personen, setPersonen] = useState(2);
  // Namen horen bij een plek aan tafel: naam[0] is persoon 1, enzovoort.
  const [namen, setNamen] = useState<string[]>([]);
  const [tarief, setTarief] = useState<Tarief | null>(null);
  const [alBegonnen, setAlBegonnen] = useState<number | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  // Staat deze tafel al open? Dan vullen we het aantal personen en de namen in.
  useEffect(() => {
    fetch(`/api/tafel?tafel=${encodeURIComponent(tafel)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.tariefPerPersoon === "number") {
          setTarief({
            tariefPerPersoon: data.tariefPerPersoon,
            duurMinuten: data.duurMinuten,
            laatsteRondeMinuten: data.laatsteRondeMinuten,
          });
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

  async function start() {
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

  const totaal = tarief ? personen * tarief.tariefPerPersoon : null;

  return (
    <div className="gasten-kiezer">
      {alBegonnen !== null && (
        <p className="gasten-al-open">
          Deze tafel is al begonnen
          {alBegonnen > 0 ? ` · nog ${alBegonnen} minuten` : " · de tijd is om"}
        </p>
      )}

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

      <p className="gasten-vraag gasten-namen-vraag">
        Wie zitten er aan tafel? <span>Namen maken de bestelling duidelijk.</span>
      </p>

      <div className="gasten-namen">
        {Array.from({ length: personen }, (_, index) => (
          <input
            key={index}
            value={namen[index] ?? ""}
            onChange={(event) => zetNaam(index, event.target.value)}
            placeholder={`Persoon ${index + 1}`}
            maxLength={20}
            className="gasten-naam"
            aria-label={`Naam van persoon ${index + 1}`}
          />
        ))}
      </div>

      {tarief && totaal !== null && (
        <p className="gasten-tarief">
          {formatPrice(tarief.tariefPerPersoon)} per persoon ·{" "}
          {duurTekst(tarief.duurMinuten)} onbeperkt tapas
          <span className="gasten-totaal">samen {formatPrice(totaal)}</span>
        </p>
      )}

      <button
        type="button"
        onClick={start}
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
        {tarief?.laatsteRondeMinuten ?? 30} minuten, zodat alles op tijd op tafel
        staat.
      </p>
    </div>
  );
}
