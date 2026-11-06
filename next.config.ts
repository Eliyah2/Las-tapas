import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // De demo draait op een telefoon via het netwerkadres van de laptop.
  // Zonder deze regel blokkeert Next.js de dev-bestanden voor dat adres en
  // werkt er op de telefoon geen enkele knop (de kaart laadt dan zonder JS).
  // Is je IP anders, zet hier het adres van dat moment neer.
  allowedDevOrigins: ["192.168.178.75"],
};

export default nextConfig;
