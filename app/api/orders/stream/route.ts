import { orderStore } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = orderStore();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Stuur direct de huidige stand zodat het scherm niet leeg start.
      send("orders", store.list());

      const unsubscribe = store.subscribe(() => {
        try {
          send("orders", store.list());
        } catch {
          // client weggevallen; unsubscribe gebeurt via cancel()
        }
      });

      // Houd de verbinding actief en detecteer dode verbindingen.
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

      // Next.js roept cancel() aan wanneer de client de verbinding verbreekt.
      // We stoppen dan de ping en het subscription.
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
