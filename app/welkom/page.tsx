import type { Metadata } from "next";
import Link from "next/link";
import { Divider } from "@/components/decor";

export const metadata: Metadata = {
  title: "Welkom bij Las Tapas",
  description: "Scan de QR-code aan tafel en bestel direct: de keuken ontvangt je bestelling live.",
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ tafel?: string }>;
}) {
  const { tafel } = await searchParams;
  const table = tafel?.trim() || "?";

  return (
    <main className="welcome-page">
      <div
        className="page-photo"
        style={{ backgroundImage: "url('/tapas.jpg')" }}
        aria-hidden="true"
      />
      <div className="page-overlay" aria-hidden="true" />

      <div className="welcome-content">
        <span className="brand-mark" aria-hidden="true">L</span>
        <p className="eyebrow">Bar de tapas · cocina española</p>
        <h1>¡Bienvenidos!</h1>
        <Divider />
        <p className="welcome-description">
          Welkom bij Las Tapas. Bestel vanaf je eigen telefoon, je bestelling
          gaat direct naar de keuken, zonder wachten op de bediening.
        </p>
        <p className="welcome-table">Tafel {table}</p>
        <Link
          href={`/menu?tafel=${encodeURIComponent(table)}`}
          className="button welcome-button"
        >
          Bekijk de menukaart <span aria-hidden="true">&nbsp;↗</span>
        </Link>
      </div>
    </main>
  );
}
