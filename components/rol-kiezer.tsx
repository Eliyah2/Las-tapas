"use client";

import { useCallback, useEffect, useState } from "react";
import { isRol, ROL_LABEL, ROLLEN, type Rol } from "@/lib/voorraad-types";

const SLEUTEL = "lastapas-rol";

/**
 * Rolkeuze zonder inloggen: op een tablet in de keuken klik je een keer op je
 * rol en die wordt in de browser bewaard. Zo weet het systeem wie wat boekt,
 * en of iemand grote uitgiftes mag goedkeuren.
 *
 * In een echt systeem zou dit een account met wachtwoord zijn; dat vroeg echter
 * om een dienst met een account, en dat mocht niet voor deze opdracht.
 */
export function useRol(standaard: Rol = "kok") {
  const [rol, setRol] = useState<Rol>(standaard);

  useEffect(() => {
    // Pas na de eerste render lezen, anders verschillen server en browser.
    const timer = window.setTimeout(() => {
      const bewaard = window.localStorage.getItem(SLEUTEL);
      if (isRol(bewaard)) setRol(bewaard);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const kiesRol = useCallback((nieuweRol: Rol) => {
    setRol(nieuweRol);
    try {
      window.localStorage.setItem(SLEUTEL, nieuweRol);
    } catch {
      // Privémodus zonder opslag: de rol geldt dan alleen deze sessie.
    }
  }, []);

  return [rol, kiesRol] as const;
}

export function RolKiezer({
  rol,
  onKies,
  rollen = ROLLEN,
}: {
  rol: Rol;
  onKies: (rol: Rol) => void;
  rollen?: Rol[];
}) {
  return (
    <div className="rol-kiezer" role="group" aria-label="Met welke rol werk je?">
      <span className="rol-kiezer-label">Ik werk als</span>
      {rollen.map((waarde) => (
        <button
          key={waarde}
          type="button"
          className={`rol-knop ${waarde === rol ? "actief" : ""}`}
          onClick={() => onKies(waarde)}
          aria-pressed={waarde === rol}
        >
          {ROL_LABEL[waarde]}
        </button>
      ))}
    </div>
  );
}

export { SLEUTEL as ROL_SLEUTEL };
