"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./inloggen.css";

export default function InlogPagina() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [fout, setFout] = useState("");
  const [bezig, setBezig] = useState(false);

  async function inloggen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout("");

    try {
      const antwoord = await fetch("/api/inloggen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!antwoord.ok) {
        setFout("Die pincode klopt niet. Probeer het nog eens.");
        setPin("");
        return;
      }

      router.replace("/manager");
      router.refresh();
    } catch {
      setFout("Inloggen lukte niet. Controleer je verbinding.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <main className="inlog-pagina">
      <span className="inlog-tegel" aria-hidden="true" />

      <section className="inlog-kaart">
        <div className="inlog-merk">
          <span className="inlog-merk-mark" aria-hidden="true">
            L
          </span>
          <div>
            <p className="inlog-merk-naam">Las Tapas</p>
            <p className="inlog-merk-sub">bar de tapas · desde 2010</p>
          </div>
        </div>

        <p className="inlog-eyebrow">Beheersysteem</p>
        <h1 className="inlog-titel">Inloggen voor de bedrijfsleiding</h1>
        <p className="inlog-intro">
          Bezetting, bestellingen en omzet van de hele zaak in één overzicht.
          Alleen de manager komt hier binnen.
        </p>

        <form className="inlog-formulier" onSubmit={inloggen}>
          <label className="inlog-label" htmlFor="pin">
            Pincode
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            className="inlog-input"
            placeholder="••••"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            aria-invalid={fout ? true : undefined}
            required
          />

          {fout && (
            <p className="inlog-fout" role="alert">
              {fout}
            </p>
          )}

          <button
            type="submit"
            className="inlog-knop"
            disabled={bezig || pin.length === 0}
          >
            {bezig ? "Bezig…" : "Inloggen"}
          </button>
        </form>

        <p className="inlog-voet">
          De pincode wordt per dienst gedeeld met de bedrijfsleiding.
        </p>
        <Link href="/" className="inlog-terug">
          ← Terug naar de menukaart
        </Link>
      </section>
    </main>
  );
}
