import { setTimeout as sleep } from "node:timers/promises";
import crypto from "node:crypto";

export class MockDexRouter {
  constructor(private basePrice: number) {}

  async getRaydiumQuote(): Promise<{ price: number; fee: number }> {
    await sleep(200);
    return { price: this.basePrice * (0.98 + Math.random() * 0.04), fee: 0.003 };
  }

  async getMeteoraQuote(): Promise<{ price: number; fee: number }> {
    await sleep(200);
    return { price: this.basePrice * (0.97 + Math.random() * 0.05), fee: 0.002 };
  }

  async executeSwap(): Promise<{ txHash: string; executedPrice: number }> {
    await sleep(2000 + Math.random() * 1000);
    return {
      txHash: `0x${crypto.randomUUID().replace(/-/g, "").slice(0, 32)}`,
      executedPrice: this.basePrice * (0.98 + Math.random() * 0.04),
    };
  }
}
