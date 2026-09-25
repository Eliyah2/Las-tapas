// Server-only Supabase-client.
//
// LET OP: deze client gebruikt de secret key, die RLS omzeilt en dus volledige
// toegang tot de database geeft. Importeer dit bestand daarom NOOIT in een
// client component of een pagina met "use client": dan lekt de sleutel naar de
// browser. Alle aanroepen horen in de API-routes te zitten.
//
// Daarom staat er ook geen NEXT_PUBLIC_ voor de sleutel in .env.local; alleen de
// URL heeft die prefix (die is niet geheim).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SLEUTEL = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const SUPABASE_URL = URL;

/** Is de omgeving ingevuld? Zonder dit kan de app niets opslaan. */
export function supabaseGeconfigureerd(): boolean {
  return Boolean(URL && SLEUTEL);
}

let client: SupabaseClient | null = null;

/**
 * De database-client. Gooit een duidelijke fout als de omgevingsvariabelen
 * ontbreken, zodat je niet naar een vage "fetch failed" hoeft te zoeken.
 */
export function db(): SupabaseClient {
  if (!URL || !SLEUTEL) {
    throw new Error(
      "Supabase is niet geconfigureerd. Zet NEXT_PUBLIC_SUPABASE_URL en " +
        "SUPABASE_SERVICE_ROLE_KEY in .env.local (lokaal) en in de " +
        "omgevingsvariabelen van je Vercel-project (productie)."
    );
  }

  if (!client) {
    client = createClient(URL, SLEUTEL, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}

/** Een databasefout omzetten in een leesbare Error met context erbij. */
export function dbFout(wat: string, fout: { message: string } | null): Error {
  return new Error(`${wat} mislukt: ${fout?.message ?? "onbekende databasefout"}`);
}
