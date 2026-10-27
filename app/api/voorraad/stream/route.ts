import { voorraadStore } from "@/lib/inventory";

export const dynamic = "force-dynamic";

/**
 * Live voorraad, zodat het voorraadscherm en de menukaart meelopen zonder te
 * verversen.
 *
 * Zelfde aanpak als het keukenscherm: de voorraad staat in Supabase, dus er is
 * geen in-memory pub/sub meer om op te luisteren. De server pollt de database
 * en stuurt alleen een bericht als de stand echt veranderd is.
 *
 * Let op: dit overzicht kost vijf queries (producten, mutaties, aanvragen,
 * instellingen en een telling), dus dit interval staat ruimer dan bij het
 * keukenscherm. Met Supabase Realtime op `stock_movements` en `stock_requests`
 * zou dat niet nodig zijn.
 */
const POLL_MS = 3000;
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
          const json = JSON.stringify(await voorraadStore().overzicht());
          if (json === vorige) return;
          vorige = json;
          controller.enqueue(
            encoder.encode(`event: voorraad\ndata: ${json}\n\n`)
          );
        } catch {
          // Database even onbereikbaar: de volgende ronde opnieuw proberen.
        }
      };

      // Direct de huidige stand, zodat het scherm niet leeg start.
      await stuurStand();

      const poll = setInterval(() => void stuurStand(), POLL_MS);

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
