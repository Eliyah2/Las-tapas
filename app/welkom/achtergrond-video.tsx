"use client";

import { useEffect, useRef } from "react";

/**
 * De sfeerlus achter de tekst op het welkomstscherm.
 *
 * De browser start zo'n video meestal vanzelf, maar niet altijd: op de iPad
 * gebeurt dat niet in de spaarstand, en zodra het venster even niet getekend
 * wordt zet de browser het afspelen stil. In die gevallen zie je alleen de foto
 * die eronder ligt. Daarom proberen we het hier opnieuw zodra het scherm weer
 * zichtbaar is.
 */
export default function AchtergrondVideo({
  src,
  poster,
}: {
  src: string;
  poster: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Wie heeft ingesteld dat hij minder beweging wil, krijgt geen video te
    // zien; de foto hieronder blijft dan staan (zie ook globals.css).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let laatstePoging = 0;

    const start = () => {
      if (document.hidden || !video.paused) return;
      // Niet blijven proberen als de browser echt niet wil.
      const nu = Date.now();
      if (nu - laatstePoging < 1000) return;
      laatstePoging = nu;
      void video.play().catch(() => {
        // Afspelen geweigerd: dan blijft de foto staan die eronder ligt.
      });
    };

    video.muted = true; // stom en gedempt, anders start hij niet vanzelf
    start();

    // Op de iPad in de spaarstand start hij pas na een eerste aanraking.
    video.addEventListener("pause", start);
    document.addEventListener("visibilitychange", start);
    document.addEventListener("pointerdown", start);
    window.addEventListener("focus", start);
    return () => {
      video.removeEventListener("pause", start);
      document.removeEventListener("visibilitychange", start);
      document.removeEventListener("pointerdown", start);
      window.removeEventListener("focus", start);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="page-video"
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
