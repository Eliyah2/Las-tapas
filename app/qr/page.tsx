"use client";

import { useState } from "react";

export default function QrPage() {
  const [table, setTable] = useState("1");

  const qrSrc = `/api/qr?tafel=${encodeURIComponent(table)}`;

  return (
    <main className="qr-page">
      <div className="qr-card">
        <header className="qr-card-header">
          <span className="brand-mark" aria-hidden="true">L</span>
          <div>
            <p className="eyebrow">Bar de tapas</p>
            <h1>QR-codes maken</h1>
          </div>
        </header>

        <p className="qr-description">
          Vul het tafelnummer in en zet de iPad van die tafel op deze menukaart:
          scan de code één keer, of open de link. De gasten bestellen daarna op
          de iPad, dus niet op hun eigen telefoon.
        </p>

        <label className="qr-label" htmlFor="tafel">
          Tafelnummer
        </label>
        <input
          id="tafel"
          value={table}
          onChange={(e) => setTable(e.target.value)}
          className="qr-input"
          placeholder="bijv. 5"
        />

        {table.trim() !== "" && (
          <div className="qr-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt={`QR-code voor tafel ${table}`}
              className="qr-image"
            />
            <p className="qr-table">Tafel {table}</p>
            <p className="qr-link">
              Opent de welkomstpagina van tafel {table}; zet deze op de iPad van
              die tafel.
            </p>
            <a
              href={qrSrc}
              download={`qr-tafel-${table}.png`}
              className="button qr-download"
            >
              Download PNG
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
