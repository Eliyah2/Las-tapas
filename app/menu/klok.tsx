"use client";

import { useEffect, useState } from "react";

/**
 * Het klokscherm voor de gasten.
 *
 * Even na een bestelling neemt dit het scherm over: grote cijfers met de tijd
 * die nog over is van de eetperiode, zodat de gasten weten waar ze aan toe
 * zijn. Eén tik op het scherm brengt ze terug bij de kaart om bij te bestellen.
 */

/** Resterende tijd als 0:00:00, met de seconden erbij zodat het echt loopt. */
function klokTekst(milliseconden: number): string {
  const totaal = Math.max(0, Math.floor(milliseconden / 1000));
  const uren = Math.floor(totaal / 3600);
  const minuten = String(Math.floor((totaal % 3600) / 60)).padStart(2, "0");
  const seconden = String(totaal % 60).padStart(2, "0");
  return `${uren}:${minuten}:${seconden}`;
}

export default function Klok({
  tafel,
  eindeOp,
  resterendeMinuten,
  laatsteRondeMinuten,
  onTerug,
}: {
  tafel: string;
  /** Het moment waarop de eetperiode afloopt, zoals de server het berekent. */
  eindeOp: number | null;
  resterendeMinuten: number | null;
  laatsteRondeMinuten: number;
  onTerug: () => void;
}) {
  const [nu, setNu] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNu(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // De server bepaalt wanneer de periode afloopt. Kent de kaart dat moment nog
  // niet, dan rekenen we verder met de minuten die ze al wist.
  const einde =
    eindeOp ?? (resterendeMinuten !== null ? nu + resterendeMinuten * 60_000 : null);
  const over = einde === null ? null : Math.max(0, einde - nu);
  const voorbij = over === null || over <= 0;
  const laatsteRonde =
    over !== null && over > 0 && over <= laatsteRondeMinuten * 60_000;

  return (
    <div
      className="klok-scherm"
      role="dialog"
      aria-label="Resterende eettijd"
      onClick={onTerug}
    >
      <p className="eyebrow klok-kop">Las Tapas · tafel {tafel}</p>

      <p className={`klok-cijfers${voorbij ? " klok-cijfers-klein" : ""}`}>
        {voorbij ? "Tijd is om" : klokTekst(over)}
      </p>

      <p className="klok-uitleg">
        {voorbij
          ? "De eetperiode is voorbij. Vraag de bediening als je wilt verlengen."
          : laatsteRonde
            ? "Laatste ronde: de keuken neemt geen nieuwe gerechten meer aan."
            : "Onbeperkt tapas. Bijbestellen kan zo vaak als je wilt, betalen pas aan het einde."}
      </p>

      <button type="button" className="klok-terug" onClick={onTerug}>
        Tik op het scherm om weer te bestellen
      </button>
    </div>
  );
}
