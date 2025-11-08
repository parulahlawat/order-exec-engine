# Design Decisions

## Chosen Order Type: Market

- **Why**: Easiest to reason about and to demonstrate the full lifecycle (routing → swap → confirm).
- **How to extend**
  - **Limit**: Queue order until `bestQuote >= limitPrice` (poll quotes or subscribe to price source). Execute when condition holds.
  - **Sniper**: Await token launch/migration trigger (on-chain or event), then immediately execute via router.

## HTTP → WebSocket Pattern

- Clients **POST** `/api/orders/execute` → returns `{ orderId, ws }`.
- Clients **open WS** to `/api/orders/execute?orderId=<id>` and receive live events.
- Internally WS hub uses **Redis Pub/Sub**; workers emit on `order:updates:<id>`.

## DEX Router (Mock)

- Quotes are fetched from “Raydium” and “Meteora” with **~200ms** delays.
- Price variance emulates 2–5% differences and per-DEX fee differences.
- We compute effective price (price × (1 - fee)) and select the best.
- Slippage bound via `maxSlippageBps` against base reference price.

## Concurrency & Throughput

- **BullMQ** worker with `concurrency: 10`.
- **Limiter**: `max=100, duration=60000` → **100 orders/min**.
- **Backoff**: exponential, ≤3 attempts; on final failure we emit `failed` and persist `fail_reason`.

## Persistence

- **PostgreSQL** stores order lifecycle (status, chosen DEX, quoted/executed price, tx hash, fail reason).
- **Redis** stores active order snapshot & powers WS pub/sub.

## Error Handling

- Input validation on POST.
- Slippage violations fail early.
- Execution failures → retries; final fail persisted + WS `failed` event.

## Real Devnet (Future Bonus)

- Swap `MockDexRouter` with SDKs:
  - `@solana/web3.js`, `@solana/spl-token`
  - `@raydium-io/raydium-sdk-v2`
  - `@meteora-ag/dynamic-amm-sdk`
- Wrap native SOL if needed, execute, and return actual `txHash`.
