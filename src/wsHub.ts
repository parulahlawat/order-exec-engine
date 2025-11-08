import { FastifyInstance } from "fastify";
import { sub } from "./redis.js";

export function registerWs(app: FastifyInstance) {
  app.get("/api/orders/execute", { websocket: true }, async (conn, req) => {
    const orderId = (req.query as any).orderId;
    if (!orderId) { conn.socket.close(); return; }
    const channel = `order:updates:${orderId}`;
    const listener = (message: string, ch: string) => {
      if (ch === channel) conn.socket.send(message);
    };
    await sub.subscribe(channel, listener);

    conn.socket.on("close", async () => {
      try { await sub.unsubscribe(channel, listener); } catch {}
    });
  });
}
