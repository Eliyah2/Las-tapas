import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Kaushan_Script,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Warme menukaart-serif voor de koppen (Spaanse kaart-uitstraling).
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Handgeschreven accentletters, zoals op een schoolbord in een tasca.
const kaushan = Kaushan_Script({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Las Tapas · Bestel aan tafel",
  description: "Scan de QR-code aan tafel en bestel direct: de keuken ontvangt je bestelling live.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${kaushan.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
