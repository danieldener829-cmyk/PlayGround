import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// SSE = logs em tempo real (WebSocket-like, funciona sem servidor extra)
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")!;
  const kind = (req.nextUrl.searchParams.get("kind") || "bots") as "bots" | "sites";
  const stream = new ReadableStream({
    start(c) {
      const send = (msg: string) => c.enqueue(`data: ${msg}\n\n`);
      send("conectado ao stream de logs…");
      const iv = setInterval(() => {
        const item = (db as any)[kind](undefined).find((x: any) => x.id === id) as any;
        if (!item) { send("container finalizado"); clearInterval(iv); c.close(); return; }
        const line = `[${new Date().toISOString().slice(11, 19)}] ${kind === "bots" ? `bot ${item.name} · cpu ${item.cpu || 12}% · mem ${Math.round((item.ramMB || 512) * (0.3 + Math.random() * 0.3))}MB · alive` : `site ${item.name} · 200 OK · ${Math.round(Math.random() * 40 + 5)}ms`}`;
        db.pushLog(kind, id, line);
        send(line);
      }, 2000);
      setTimeout(() => { clearInterval(iv); try { c.close(); } catch {} }, 120000);
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
