import type { Metadata } from "next";
import { Divider } from "@/components/decor";
import { formatPrice } from "@/lib/format";
import { laagstePrijsPerPersoon } from "@/lib/tafel";
import AchtergrondVideo from "./achtergrond-video";
import GastenKiezer from "./gasten-kiezer";

export const metadata: Metadata = {
  title: "Welkom bij Las Tapas",
  description: "Bestel aan tafel op de iPad van Las Tapas: onbeperkt tapas, 2 of 3 uur, met of zonder drinken.",
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ tafel?: string }>;
}) {
  const { tafel } = await searchParams;
  const table = tafel?.trim() || "?";
  const vanaf = laagstePrijsPerPersoon();

  return (
    <main className="welcome-page">
      <div
        className="page-photo"
        style={{ backgroundImage: "url('/tapas.jpg')" }}
        aria-hidden="true"
      />
      {/* Korte sfeerlus achter de tekst. De foto hierboven blijft staan als
          terugval: zolang de video nog niet speelt, of wanneer iemand minder
          beweging wil (zie prefers-reduced-motion), zie je gewoon het beeld. */}
      <AchtergrondVideo src="/tapas-loop.mp4" poster="/tapas.jpg" />
      <div className="page-overlay" aria-hidden="true" />

      <div className="welcome-content">
        <span className="brand-mark" aria-hidden="true">L</span>
        <p className="eyebrow">Bar de tapas · cocina española</p>
        <h1>Bienvenidos</h1>
        <Divider />
        <p className="welcome-description">
          Welkom bij Las Tapas. Onbeperkt tapas: 2 of 3 uur, met of zonder
          drinken, vanaf {formatPrice(vanaf)} per persoon. Bestel op de iPad van
          de zaak; je bestelling gaat meteen naar de keuken.
        </p>
        <p className="welcome-table">Tafel {table}</p>
        <GastenKiezer tafel={table} />
      </div>
    </main>
  );
}
