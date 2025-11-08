# 1–2 Minute Demo Script (Talking + Shot List)

**0:00–0:10 (Intro)**
- “This is a mock Order Execution Engine for market orders on Solana DEXes with DEX routing and live WebSocket updates.”
- Show repo root and README.

**0:10–0:25 (Run stack)**
- Terminal: `docker compose up --build` (containers: db, redis, api).

**0:25–0:50 (Create orders)**
- Postman or curl: send **3 orders** quickly.
- Show returned `orderId` and `ws` URL.

**0:50–1:20 (Live updates)**
- Open 2 terminals running `websocat ws://localhost:3000/api/orders/execute?orderId=<id>`.
- On screen: events `pending → routing (with quotes) → building → submitted → confirmed`.
- In API logs, show "best DEX" routing decision.

**1:20–1:40 (Concurrency & retries)**
- Trigger a slippage failure once (set `maxSlippageBps` tiny). Show `failed` with reason.
- Mention 10 concurrent workers, 100 orders/min limiter, exponential backoff.

**1:40–1:55 (Wrap-up)**
- “Docs & design in `docs/`, CI on GitHub Actions, Docker for local dev. Real devnet is a drop-in.”
- End with repo URL.

**Recording Tips**
- Use a screen recorder (macOS: QuickTime). Keep terminal font large (16–18pt).
- One browser tab for Postman; two terminal panes for WS streams.
