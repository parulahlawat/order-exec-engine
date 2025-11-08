cd ~/Desktop/order-exec-engine

cat > docs/VIDEO_SCRIPT.md <<'EOF'
# 1–2 Minute Demo (Order Execution Engine)

## What you’ll say (natural voice)
**Intro (0:00–0:10)**  
“Hi, I’m Parul. This is my mock Order Execution Engine for Solana DEX market orders.  
It routes between **Raydium** and **Meteora** and streams **live WebSocket** updates.”

**Run stack (0:10–0:25)**  
“I’ll start Postgres, Redis, and the API with Docker.”  
`docker compose up --build`  
Then: `curl http://localhost:3000/` → should return `{"ok":true}`.

**Create orders (0:25–0:45)**  
“I’ll send two orders: one normal and one with tight slippage to force a failure.”  
Use curl (or Postman) to create both; copy the `orderId`s.

**Live updates (0:45–1:10)**  
“I open two WebSocket viewers to watch both in real time.”  
Narrate state changes: pending → routing (quotes) → building → submitted → **confirmed**.  
Show that the tight-slippage order ends **failed** with a reason.

**Routing & persistence (1:10–1:25)**  
“Logs show the best-price DEX chosen.”  
“Every order is saved in Postgres with chosen DEX, prices, tx hash / fail reason.”

**Wrap (1:25–1:55)**  
“Docs are in `docs/`, Postman collection in `postman/`, CI on GitHub Actions.  
Real devnet swaps are a drop-in next step. Demo video link is in README.”

## On-screen shot list / commands

### Start services
```bash
docker compose up --build
# in another terminal:
curl http://localhost:3000/