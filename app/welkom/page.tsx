import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Welkom bij Las Tapas",
  description: "Scan de QR-code aan tafel en bestel direct — de keuken ontvangt je bestelling live.",
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ tafel?: string }>;
}) {
  const { tafel } = await searchParams;
  const table = tafel?.trim() || "?";

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden p-6 text-center text-white">
      {/* Foto op de achtergrond */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/tacos-bg.jpg')" }}
        aria-hidden
      />
      {/* Donkere overlay zodat de tekst leesbaar blijft */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35"
        aria-hidden
      />

      <div className="relative z-10 flex max-w-md flex-col items-center gap-6">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">
          Mexican Cuisine
        </p>
        <h1 className="text-4xl font-bold leading-tight drop-shadow-lg">
          ¡Bienvenidos!
        </h1>
        <p className="text-lg leading-relaxed text-white/90">
          Welkom bij Las Tapas. Bestel vanaf je eigen telefoon — je bestelling
          gaat direct naar de keuken, zonder wachten op de bediening.
        </p>
        <p className="text-sm text-white/60">Tafel {table}</p>
        <Link
          href={`/menu?tafel=${encodeURIComponent(table)}`}
          className="mt-2 w-full rounded-full bg-red-600 px-8 py-4 text-lg font-bold shadow-lg transition active:scale-95"
        >
          Bekijk de menukaart
        </Link>
      </div>
    </main>
  );
}
