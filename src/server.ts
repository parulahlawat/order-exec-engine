import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { env } from "./env.js";
import { startRedis } from "./redis.js";
import { registerWs } from "./wsHub.js";
import { ordersQ, startWorker } from "./queue.js";
import { insertOrder } from "./db.js";
import { randomUUID } from "node:crypto";

async function main() {
  await startRedis();

  const app = Fastify({ logger: true });
  await app.register(fastifyWebsocket);

  registerWs(app);

  app.get("/", async () => ({ ok: true }));

  app.post("/api/orders/execute", async (req, reply) => {
    const body: any = req.body;
    if (body?.type !== "market") return reply.code(400).send({ error: "Only market is supported in this demo" });
    if (!body.tokenIn || !body.tokenOut || typeof body.amount !== "number") {
      return reply.code(400).send({ error: "tokenIn, tokenOut, amount are required" });
    }

    const orderId = randomUUID();
    await insertOrder({ id: orderId, status: "pending", tokenIn: body.tokenIn, tokenOut: body.tokenOut, amount: body.amount });

    await ordersQ.add("execute", {
      orderId, tokenIn: body.tokenIn, tokenOut: body.tokenOut, amount: body.amount, maxSlippageBps: body.maxSlippageBps
    });

    return reply.send({ orderId, ws: `/api/orders/execute?orderId=${orderId}` });
  });

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

startWorker();
main().catch(err => { console.error(err); process.exit(1); });
