import { NextResponse } from "next/server";
import type { Unit } from "@/lib/voorraad-types";

export const dynamic = "force-dynamic";

/**
 * Producten opzoeken terwijl je een nieuw artikel toevoegt.
 *
 * Hiervoor is Open Food Facts gebruikt: een gratis, open database zonder
 * account, zonder inloggen en zonder API-sleutel. Vraagt de dienst niets terug
 * of is er geen internet, dan krijg je gewoon een lege lijst en kun je het
 * product met de hand invullen.
 */
const ZOEK_URL = "https://world.openfoodfacts.org/cgi/search.pl";

type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_nl?: string;
  brands?: string;
  quantity?: string;
  categories?: string;
};

type Resultaat = {
  code: string;
  naam: string;
  merk?: string;
  hoeveelheid?: string;
  categorie?: string;
  eenheid: Unit;
  inhoud?: number;
};

/** Leidt een eenheid en inhoud af uit tekst als "500 ml" of "1 kg". */
function raadEenheid(hoeveelheid?: string): { eenheid: Unit; inhoud?: number } {
  if (!hoeveelheid) return { eenheid: "stuk" };

  const tekst = hoeveelheid.toLowerCase().replace(",", ".");
  const match = tekst.match(/(\d+(?:\.\d+)?)\s*(kg|kilogram|g|gram|gr|ml|l|liter|cl)/);

  if (!match) return { eenheid: "stuk" };

  const waarde = Number(match[1]);
  const maat = match[2];

  if (maat.startsWith("k") && maat !== "cl") return { eenheid: "gram", inhoud: waarde * 1000 };
  if (maat === "g" || maat === "gr" || maat === "gram") return { eenheid: "gram", inhoud: waarde };
  if (maat === "l" || maat === "liter") return { eenheid: "ml", inhoud: waarde * 1000 };
  if (maat === "cl") return { eenheid: "ml", inhoud: waarde * 10 };
  return { eenheid: "ml", inhoud: waarde };
}

export async function GET(request: Request) {
  const zoekterm = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (zoekterm.length < 2) {
    return NextResponse.json(
      { error: "Typ minimaal twee letters", resultaten: [] },
      { status: 400 }
    );
  }

  const url = new URL(ZOEK_URL);
  url.searchParams.set("search_terms", zoekterm);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "8");
  url.searchParams.set(
    "fields",
    "code,product_name,product_name_nl,brands,quantity,categories"
  );

  try {
    const antwoord = await fetch(url, {
      headers: {
        "User-Agent": "LasTapasSchoolProject/1.0 (schoolopdracht voorraadsysteem)",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!antwoord.ok) {
      return NextResponse.json(
        { resultaten: [], waarschuwing: "Productendatabase reageerde niet" },
        { status: 200 }
      );
    }

    const data = (await antwoord.json()) as { products?: OffProduct[] };
    const resultaten: Resultaat[] = (data.products ?? [])
      .map((product) => {
        const naam = (product.product_name_nl || product.product_name || "").trim();
        if (!naam) return null;
        const { eenheid, inhoud } = raadEenheid(product.quantity);
        const resultaat: Resultaat = {
          code: product.code ?? "",
          naam,
          merk: product.brands?.split(",")[0]?.trim() || undefined,
          hoeveelheid: product.quantity || undefined,
          categorie: product.categories?.split(",").pop()?.trim() || undefined,
          eenheid,
          inhoud,
        };
        return resultaat;
      })
      .filter((r): r is Resultaat => r !== null)
      .slice(0, 6);

    return NextResponse.json({ resultaten, bron: "Open Food Facts" });
  } catch {
    return NextResponse.json(
      { resultaten: [], waarschuwing: "Geen verbinding met de productendatabase" },
      { status: 200 }
    );
  }
}
