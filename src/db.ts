import { Pool } from "pg";
import { env } from "./env.js";

export const pg = new Pool({ connectionString: env.PG_URL });

export async function insertOrder(o: any) {
  await pg.query(`CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL,
    token_in TEXT NOT NULL,
    token_out TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    chosen_dex TEXT,
    quoted_price NUMERIC,
    executed_price NUMERIC,
    tx_hash TEXT,
    fail_reason TEXT
  )`);
  await pg.query(`INSERT INTO orders (id,status,token_in,token_out,amount,created_at,updated_at)
                  VALUES ($1,$2,$3,$4,$5,now(),now())`,
                 [o.id, "pending", o.tokenIn, o.tokenOut, o.amount]);
}

export async function patchOrder(id: string, fields: Record<string, any>) {
  const mapping: Record<string,string> = {
    status: "status",
    chosen_dex: "chosen_dex",
    quoted_price: "quoted_price",
    executed_price: "executed_price",
    tx_hash: "tx_hash",
    fail_reason: "fail_reason"
  };
  const keys = Object.keys(fields).filter(k => mapping[k]);
  if (!keys.length) return;
  const cols = keys.map((k, i) => `${mapping[k]}=$${i+2}`).join(",");
  const vals = keys.map(k => fields[k]);
  await pg.query(`UPDATE orders SET ${cols}, updated_at=now() WHERE id=$1`, [id, ...vals]);
}
