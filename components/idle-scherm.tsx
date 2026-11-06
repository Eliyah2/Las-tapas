"use client";

import { useEffect, useRef, useState } from "react";

/** De klok in de hoek, klein gehouden zoals de opdrachtgever vroeg. */
function Klok() {
  const [tijd, setTijd] = useState("");

  useEffect(() => {
    const zet = () =>
      setTijd(
        new Date().toLocaleTimeString("nl-NL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    zet();
    const timer = window.setInterval(zet, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  return <span className="tabular-nums">{tijd}</span>;
}

/**
 * Schermbeveiliging voor de schermen in de zaak: na twintig seconden zonder
 * aanraking wordt het beeld donker en staat de klok klein in de hoek. Eén tik
 * of toets haalt hem weg. Bewust geen grote tijd midden in beeld: dat vond de
 * opdrachtgever te opvallend.
 */
export default function IdleScherm({ seconden = 20 }: { seconden?: number }) {
  const [rustig, setRustig] = useState(false);
  // De tijd van de laatste aanraking; pas binnen het effect gezet, want een
  // component hoort tijdens het renderen geen klok te lezen.
  const laatste = useRef(0);

  useEffect(() => {
    laatste.current = Date.now();

    const wakker = () => {
      laatste.current = Date.now();
      setRustig(false);
    };

    // Alles wat een mens doet telt als activiteit, ook scrollen en typen.
    const gebeurtenissen = [
      "pointerdown",
      "pointermove",
      "keydown",
      "wheel",
      "touchstart",
    ];
    for (const naam of gebeurtenissen) {
      window.addEventListener(naam, wakker, { passive: true });
    }

    const timer = window.setInterval(() => {
      if (Date.now() - laatste.current >= seconden * 1000) setRustig(true);
    }, 1000);

    return () => {
      for (const naam of gebeurtenissen) {
        window.removeEventListener(naam, wakker);
      }
      window.clearInterval(timer);
    };
  }, [seconden]);

  if (!rustig) return null;

  return (
    <button
      type="button"
      onClick={() => {
        laatste.current = Date.now();
        setRustig(false);
      }}
      className="fixed inset-0 z-50 cursor-default bg-[#0f0b0a]/95 text-left backdrop-blur-sm"
      aria-label="Scherm weer wakker maken"
    >
      <span className="absolute bottom-4 right-5 text-right leading-tight text-white/45">
        <span className="block text-lg font-semibold">
          <Klok />
        </span>
        <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.18em] text-white/25">
          tik om verder te gaan
        </span>
      </span>
    </button>
  );
}
