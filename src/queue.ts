import { Queue, Worker, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { env } from "./env.js";
import { emit } from "./stream.js";
import { patchOrder } from "./db.js";
import { MockDexRouter } from "./mockDexRouter.js";

const connection = new IORedis(env.REDIS_URL, {
  // Required by BullMQ for blocking ops
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
export const ordersQ = new Queue("orders", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 }
  } as JobsOptions,
});

export function startWorker() {
  const worker = new Worker("orders", async job => {
    const { orderId, tokenIn, tokenOut, amount, maxSlippageBps } = job.data;

    await emit(orderId, { status: "pending" });
    await emit(orderId, { status: "routing" });

    const basePrice = 100; // mock reference price
    const router = new MockDexRouter(basePrice);

    const [rQuote, mQuote] = await Promise.all([router.getRaydiumQuote(), router.getMeteoraQuote()]);

    const eff = (q: {price:number; fee:number}) => q.price * (1 - q.fee);
    const chosen = eff(rQuote) >= eff(mQuote) ? { dex: "raydium", q: rQuote } : { dex: "meteora", q: mQuote };

    await patchOrder(orderId, { status: "routing", chosen_dex: chosen.dex, quoted_price: chosen.q.price });
    await emit(orderId, {
      status: "routing",
      bestDex: chosen.dex,
      quotes: { raydium: rQuote, meteora: mQuote }
    });

    await emit(orderId, { status: "building" });

    const maxSlip = (maxSlippageBps ?? 100) / 10_000;
    if (Math.abs(chosen.q.price / basePrice - 1) > maxSlip) {
      throw new Error(`slippage too high (price=${chosen.q.price.toFixed(4)} base=${basePrice})`);
    }

    await emit(orderId, { status: "submitted" });

    const { txHash, executedPrice } = await router.executeSwap();

    await patchOrder(orderId, { status: "confirmed", executed_price: executedPrice, tx_hash: txHash });
    await emit(orderId, { status: "confirmed", txHash, executedPrice });
    return { txHash, executedPrice };
  }, {
    connection,
    concurrency: 10,
    limiter: { max: 100, duration: 60_000 }
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const orderId = job.data.orderId;
    await patchOrder(orderId, { status: "failed", fail_reason: err?.message ?? "unknown" });
    await emit(orderId, { status: "failed", error: err?.message ?? "unknown" });
  });
}
