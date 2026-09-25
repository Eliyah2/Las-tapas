import Link from "next/link";
import { AzulejoBand, Divider, Rosette } from "@/components/decor";

const actions = [
  {
    href: "/welkom?tafel=5",
    icon: "✦",
    title: "Menukaart",
    description: "Bestel tapas aan tafel",
  },
  {
    href: "/keuken",
    icon: "♨",
    title: "Keukenscherm",
    description: "Bekijk live bestellingen",
  },
  {
    href: "/voorraad",
    icon: "▤",
    title: "Voorraad",
    description: "Voor de manager: bijhouden en bijbestellen",
  },
  {
    href: "/uitgifte",
    icon: "✷",
    title: "Uitgifte",
    description: "Voor de keuken: pakken wat je nodig hebt",
  },
  {
    href: "/qr",
    icon: "▦",
    title: "QR-codes",
    description: "Maak een code per tafel",
  },
];

export default function Home() {
  return (
    <main className="home-page">
      <div
        className="page-photo"
        style={{ backgroundImage: "url('/tapas.jpg')" }}
        aria-hidden="true"
      />
      <div className="page-overlay" aria-hidden="true" />

      <nav className="home-nav" aria-label="Hoofdnavigatie">
        <div className="home-brand">
          <span className="brand-mark" aria-hidden="true">L</span>
          <div>
            <div className="home-brand-name">Las Tapas</div>
            <div className="home-brand-subtitle">bar de tapas · desde 2026</div>
          </div>
        </div>
        <p className="home-nav-note">Pequeños platos, grandes momentos</p>
      </nav>

      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-copy">
            <p className="eyebrow">Welkom bij ons aan tafel</p>
            <h1>Een tafel vol <em>Spaanse</em> verhalen</h1>
            <Divider />
            <p className="home-copy-intro">
              Van knapperige bravas tot een ijskoud glas sangria. De gerechten
              komen in kleine porties, zodat je met elkaar kunt delen, precies
              zoals in een tasca in Sevilla.
            </p>
            <div className="home-detail">
              <span className="home-detail-line" aria-hidden="true" />
              <span>Vers bereid · samen gedeeld · siempre con alegría</span>
            </div>
          </div>

          <div className="home-actions">
            <p className="eyebrow">Achter de schermen</p>
            <h2 className="home-actions-heading">Waar wil je naartoe?</h2>
            {actions.map((action) => (
              <Link key={action.href} href={action.href} className="home-action">
                <span className="home-action-icon" aria-hidden="true">{action.icon}</span>
                <span className="home-action-copy">
                  <span className="home-action-title">{action.title}</span>
                  <span className="home-action-description">{action.description}</span>
                </span>
                <span className="home-action-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-note">
        <Rosette size={72} />
        <div>
          <p className="eyebrow">Hoy en la cocina</p>
          <p className="home-note-text">
            Elke dag verse tapas, gebakken in olijfolie en op smaak gebracht met
            pimentón, knoflook en citroen. Vraag onze bediening naar de keuken
            van de dag.
          </p>
        </div>
      </section>

      <div className="tile-band" aria-hidden="true">
        <AzulejoBand />
      </div>
    </main>
  );
}
