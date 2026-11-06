import { orderStore } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Live bestellingen voor het keukenscherm (Server-Sent Events).
 *
 * Eerder hing deze route aan een in-memory pub/sub in lib/orders.ts. Nu de
 * bestellingen in Supabase staan, is er geen gedeeld geheugen meer om op te
 * luisteren: elke serverinstantie heeft zijn eigen proces. Daarom kijkt de
 * server hier elke twee seconden of er iets veranderd is en stuurt alleen dan
 * een bericht. Dat is simpel en werkt zonder extra dienst.
 *
 * Wil je dit netter doen, gebruik dan Supabase Realtime op de tabel `orders`
 * (die staat al in de publicatie, zie supabase/schema.sql). Dan is er geen
 * polling meer nodig en is de update direct.
 */
const POLL_MS = 2000;
const PING_MS = 25_000;

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let vorige = "";
      let gestopt = false;

      const stuurStand = async () => {
        if (gestopt) return;
        try {
          const json = JSON.stringify(await orderStore().list());
          // Alleen zenden als er echt iets veranderd is.
          if (json === vorige) return;
          vorige = json;
          controller.enqueue(
            encoder.encode(`event: orders\ndata: ${json}\n\n`)
          );
        } catch {
          // Database even onbereikbaar: de volgende ronde opnieuw proberen.
        }
      };

      // Direct de huidige stand zodat het scherm niet leeg start.
      await stuurStand();

      const poll = setInterval(() => void stuurStand(), POLL_MS);

      // Houd de verbinding actief en detecteer dode verbindingen.
      const ping = setInterval(() => {
        if (gestopt) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // stream al dicht
        }
      }, PING_MS);

      const cleanup = () => {
        gestopt = true;
        clearInterval(poll);
        clearInterval(ping);
      };

      // Next.js roept cancel() aan wanneer de client de verbinding verbreekt.
      (controller as unknown as { _cleanup?: () => void })._cleanup = cleanup;
    },
    cancel() {
      const cleanup = (this as unknown as { _cleanup?: () => void })._cleanup;
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
