/* De QR op tafel brengt gasten naar de menukaart, niet naar het bestellen.
   Zo kunnen ze alvast kijken wat er is terwijl ze wachten, en bestellen ze
   daarna op de iPad van de tafel zelf. */
export default function QrPage() {
  const qrSrc = "/api/qr";

  return (
    <main className="qr-page">
      <div className="qr-card">
        <header className="qr-card-header">
          <span className="brand-mark" aria-hidden="true">
            L
          </span>
          <div>
            <p className="eyebrow">Bar de tapas</p>
            <h1>QR voor de menukaart</h1>
          </div>
        </header>

        <p className="qr-description">
          Deze code brengt gasten naar de menukaart, niet naar het bestellen.
          Ze scannen hem aan tafel en kijken alvast rustig wat er is, zonder te
          wachten tot de bediening langskomt. Bestellen doen ze daarna op de
          iPad van de tafel.
        </p>

        <div className="qr-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="QR-code naar de menukaart van Las Tapas"
            className="qr-image"
          />
          <p className="qr-table">Menukaart · kijken</p>
          <p className="qr-link">
            Opent de kaart zonder bestelknoppen op de telefoon van de gast.
          </p>
          <a
            href={qrSrc}
            download="qr-menukaart.png"
            className="button qr-download"
          >
            Download PNG
          </a>
        </div>
      </div>
    </main>
  );
}
