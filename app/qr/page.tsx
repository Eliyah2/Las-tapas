"use client";

import { useState } from "react";

export default function QrPage() {
  const [table, setTable] = useState("1");

  const qrSrc = `/api/qr?tafel=${encodeURIComponent(table)}`;

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">QR-codes maken</h1>
      <p className="mt-1 mb-6 text-neutral-600">
        Vul het tafelnummer in, print de QR-code en plak hem op tafel. Door hem te
        scannen opent de menukaart met het juiste tafelnummer.
      </p>

      <label className="block text-sm font-semibold" htmlFor="tafel">
        Tafelnummer
      </label>
      <input
        id="tafel"
        value={table}
        onChange={(e) => setTable(e.target.value)}
        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-lg"
        placeholder="bijv. 5"
      />

      {table.trim() !== "" && (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-neutral-200 bg-white p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt={`QR-code voor tafel ${table}`}
            className="h-64 w-64"
          />
          <p className="mt-3 font-semibold">Tafel {table}</p>
          <p className="text-xs text-neutral-500">
            Linkt naar /welkom?tafel={table}
          </p>
          <a
            href={qrSrc}
            download={`qr-tafel-${table}.png`}
            className="mt-4 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Download PNG
          </a>
        </div>
      )}
    </main>
  );
}
