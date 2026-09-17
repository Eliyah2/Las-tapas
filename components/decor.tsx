/**
 * Decoratieve Spaans-geïnspireerde elementen, allemaal als SVG zodat ze
 * scherp blijven en geen externe afbeeldingen nodig hebben.
 */

/**
 * Strook met Spaans tegelmotief (azulejos).
 * Let op: gebruik deze maar één keer per pagina, het patroon-id is vast.
 */
export function AzulejoBand({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`azulejo ${className}`.trim()}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id="azulejo-tegel"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M24 5 L43 24 L24 43 L5 24 Z"
            fill="none"
            style={{ stroke: "var(--rojo)", strokeOpacity: 0.4, strokeWidth: 1.1 }}
          />
          <circle
            cx="24"
            cy="24"
            r="4.5"
            fill="none"
            style={{ stroke: "var(--rojo)", strokeOpacity: 0.4, strokeWidth: 1.1 }}
          />
          <circle cx="24" cy="24" r="1.3" style={{ fill: "var(--rojo)", fillOpacity: 0.7 }} />
          {[
            [0, 24],
            [48, 24],
            [24, 0],
            [24, 48],
          ].map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r="2"
              style={{ fill: "var(--amarillo)", fillOpacity: 0.95 }}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#azulejo-tegel)" />
    </svg>
  );
}

/** Geschilderde tegel als rond sieraad (bijv. bij een leeg of geslaagd scherm). */
export function Rosette({
  size = 88,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const dots = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    return {
      x: 60 + Math.cos(angle) * 38,
      y: 60 + Math.sin(angle) * 38,
    };
  });

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="57" style={{ fill: "var(--crema)" }} />
      <circle
        cx="60"
        cy="60"
        r="57"
        fill="none"
        style={{ stroke: "var(--rojo)", strokeWidth: 3 }}
      />
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        style={{ stroke: "var(--amarillo)", strokeWidth: 2 }}
      />
      {dots.map((dot, i) => (
        <circle key={i} cx={dot.x} cy={dot.y} r="4" style={{ fill: "var(--rojo)", fillOpacity: 0.85 }} />
      ))}
      <path
        d="M60 32 L88 60 L60 88 L32 60 Z"
        fill="none"
        style={{ stroke: "var(--rojo)", strokeWidth: 2.4, strokeLinejoin: "round" }}
      />
      <path
        d="M60 44 L76 60 L60 76 L44 60 Z"
        fill="none"
        style={{ stroke: "var(--amarillo)", strokeWidth: 2 }}
      />
      <circle cx="60" cy="60" r="6" style={{ fill: "var(--amarillo)" }} />
    </svg>
  );
}

/** Sierlijke scheidingslijn met een tegelruitje in het midden. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`divider ${className}`.trim()} aria-hidden="true">
      <span className="divider-line" />
      <span className="divider-diamond" />
      <span className="divider-line" />
    </div>
  );
}
