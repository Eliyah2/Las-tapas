import { voorraadStore } from "@/lib/inventory";

export const dynamic = "force-dynamic";

/**
 * Live voorraad. Zelfde aanpak als het keukenscherm: de server stuurt bij elke
 * wijziging een nieuw overzicht, zodat het voorraadscherm en de menukaart
 * meelopen zonder te verversen.
 */
export async function GET() {
  const store = voorraadStore();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: voorraad\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Direct de huidige stand, zodat het scherm niet leeg start.
      send(store.overzicht());

      const unsubscribe = store.subscribe(() => {
        try {
          send(store.overzicht());
        } catch {
          // client weggevallen; opruimen gebeurt via cancel()
        }
      });

      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // stream al dicht
        }
      }, 25_000);

      const cleanup = () => {
        clearInterval(ping);
        unsubscribe();
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
