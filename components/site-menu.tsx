"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Eén menu-item: ofwel een link naar een pagina, ofwel een actie op deze
 * pagina (zoals de samenvatting open- en dichtklappen).
 */
export type MenuItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  /** Laat zien dat deze actie nu aan staat. */
  actief?: boolean;
  /** Voor de belangrijkste actie, zoals exporteren. */
  accent?: boolean;
  /** Een gewone link in plaats van Next-navigatie, bijvoorbeeld een download. */
  extern?: boolean;
};

type Props = {
  items: MenuItem[];
  /** Tekst op de knop; standaard "Menu". */
  label?: string;
};

/**
 * Burgermenu voor de koppen van de werkpagina's. Alles wat vroeger als rij
 * knoppen in de kop stond, zit hier achter één knop, zodat de kop rustig
 * blijft en er op een tablet meer ruimte overblijft voor het werk zelf.
 */
export default function SiteMenu({ items, label = "Menu" }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sluiten bij een klik ergens anders of met Escape: zo blijft het menu
  // nooit boven het werk hangen.
  useEffect(() => {
    if (!open) return;

    function bijKlik(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function bijToets(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", bijKlik);
    document.addEventListener("keydown", bijToets);
    return () => {
      document.removeEventListener("mousedown", bijKlik);
      document.removeEventListener("keydown", bijToets);
    };
  }, [open]);

  return (
    <div className="site-menu" ref={wrapRef}>
      <button
        type="button"
        className="mini-button ghost site-menu-knop"
        onClick={() => setOpen((huidig) => !huidig)}
        aria-expanded={open}
        aria-controls="site-menu-paneel"
      >
        <span className="site-menu-icoon" aria-hidden="true">
          {open ? "▴" : "☰"}
        </span>
        {label}
      </button>

      {open && (
        <div className="site-menu-paneel" id="site-menu-paneel" role="menu">
          {items.map((item) =>
            item.href && item.extern ? (
              <a
                key={item.label}
                href={item.href}
                role="menuitem"
                className={`site-menu-item${item.accent ? " accent" : ""}`}
              >
                {item.label}
              </a>
            ) : item.href ? (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                className={`site-menu-item${item.accent ? " accent" : ""}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`site-menu-item${item.accent ? " accent" : ""}${
                  item.actief ? " actief" : ""
                }`}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
