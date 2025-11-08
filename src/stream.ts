import { pub } from "./redis.js";
export async function emit(orderId: string, payload: any) {
  await pub.publish(`order:updates:${orderId}`, JSON.stringify({ orderId, ...payload, ts: new Date().toISOString() }));
}
