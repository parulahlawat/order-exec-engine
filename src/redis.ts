import { createClient } from "redis";
import { env } from "./env.js";

export const redis = createClient({ url: env.REDIS_URL });
export const pub = redis.duplicate();
export const sub = redis.duplicate();

export async function startRedis() {
  await redis.connect();
  await pub.connect();
  await sub.connect();
}
