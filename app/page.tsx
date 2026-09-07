import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <div className="mb-2 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          Demo restaurant
        </p>
        <h1 className="text-3xl font-bold">Las Tapas</h1>
        <p className="mt-2 text-neutral-600">
          Scan een QR-code aan tafel, bestel vanaf je telefoon en de bestelling
          komt direct op het keukenscherm terecht.
        </p>
      </div>

      <Link
        href="/welkom?tafel=5"
        className="rounded-xl border border-neutral-200 bg-white p-4 font-semibold shadow-sm"
      >
        📱 Menukaart (klant) <span className="float-right">→</span>
      </Link>
      <Link
        href="/keuken"
        className="rounded-xl border border-neutral-200 bg-white p-4 font-semibold shadow-sm"
      >
        🍳 Keukenscherm <span className="float-right">→</span>
      </Link>
      <Link
        href="/qr"
        className="rounded-xl border border-neutral-200 bg-white p-4 font-semibold shadow-sm"
      >
        🔲 QR-codes printen <span className="float-right">→</span>
      </Link>
    </main>
  );
}
