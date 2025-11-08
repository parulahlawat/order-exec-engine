export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  PG_URL: process.env.PG_URL ?? "postgres://postgres:postgres@localhost:5432/orders",
};
