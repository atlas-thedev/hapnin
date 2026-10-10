import { subscribe, type BusMessage } from "@/lib/bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Server-sent events: one connection per tab, filtered by event id when given.
export async function GET(req: Request) {
  const eventId = Number(new URL(req.url).searchParams.get("event")) || null;
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (name: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          cleanup();
        }
      };

      send("hello", { at: Date.now() });

      const off = subscribe((msg: BusMessage) => {
        if (eventId && "eventId" in msg && msg.eventId !== eventId) return;
        send(msg.type, "eventId" in msg ? { eventId: msg.eventId, ...(msg.payload as object) } : msg.payload);
      });
      // තත්පර 25න් 25ට ping එකක් යවනවා, නැත්නම් nginx / cloudflare connection එක කපනවා
      const ping = setInterval(() => send("ping", Date.now()), 25_000);

      cleanup = () => {
        clearInterval(ping);
        off();
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
