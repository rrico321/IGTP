import { getCurrentUserId } from "@/lib/auth";
import { getMachines, getUnreadCountForUser, isMachineOnline } from "@/lib/db";

export const dynamic = "force-dynamic";

// Poll interval in ms — how often the SSE loop re-queries the DB.
const POLL_MS = 5000;

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  function encode(event: string, data: unknown) {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      let open = true;

      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encode(event, data));
        } catch {
          open = false;
        }
      };

      // Initial ping to confirm connection
      send("connected", { ok: true });

      while (open) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (!open) break;

        try {
          const [machines, unreadCount] = await Promise.all([
            getMachines(),
            getUnreadCountForUser(userId),
          ]);

          const machineStatuses = machines.map((m) => ({
            id: m.id,
            status: m.status,
            online: isMachineOnline(m),
            lastHeartbeatAt: m.lastHeartbeatAt,
          }));

          send("machines", machineStatuses);
          send("notifications", { unreadCount });
        } catch {
          // DB error — send a heartbeat-only event and continue
          send("ping", { ts: Date.now() });
        }
      }
    },
    cancel() {
      // Stream closed by the client — loop will exit on next iteration
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
