# order-exec-engine
![CI](https://github.com/parulahlawat/order-exec-engine/actions/workflows/ci.yml/badge.svg)

A small but complete backend that “executes” **market orders** by routing between two **mock DEXes** (Raydium & Meteora), protects against **slippage**, streams **live WebSocket** updates, and **persists** each order to Postgres. Built with **TypeScript**, **Fastify**, **BullMQ**, **Redis**, and **Postgres**. Packaged for local use via **Docker Compose**.

> This project focuses on backend architecture, reliability, and clear developer ergonomics. The swap is **simulated**; you can swap in real devnet SDKs later without changing the public API.

---

## Table of Contents
- [What You Get](#what-you-get)
- [How It Works (High Level)](#how-it-works-high-level)
- [Quick Start (Docker)](#quick-start-docker)
- [API](#api)
- [WebSocket Events](#websocket-events)
- [Inspecting Data (Postgres)](#inspecting-data-postgres)
- [Configuration](#configuration)
- [Development Notes](#development-notes)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Demo Video](#demo-video)
- [License](#license)

---

## What You Get
- **DEX Routing (mocked):** asks two simulated DEXes for a quote and chooses the better price.
- **Slippage protection:** refuses execution if final price breaches `maxSlippageBps`.
- **Live status stream:** WebSocket pushes `pending → routing → building → submitted → confirmed/failed`.
- **Persistence:** every order saved to Postgres (chosen DEX, quoted/executed price, tx hash / fail reason).
- **Queue-based workers:** BullMQ + Redis for reliable, concurrent processing.
- **Containerized dev:** `docker compose up --build` brings up db, redis, and api.

---

## How It Works (High Level)

Client (POST /api/orders/execute)
│
▼
API enqueues job  ─────────►  Worker pulls job
(BullMQ / Redis)
│
ask mock DEXes for quotes ◄──┤──► choose best price
│
simulate swap + slippage check
│
emit WebSocket updates (ws://…?orderId=…)
│
save result to Postgres


**Why a queue?** It decouples API latency from DEX/network delays, enables backoff/retries, and keeps throughput predictable.

---

## Quick Start (Docker)

**Prereqs:** Docker Desktop, `curl`. Optional: `websocat` (WS viewer) and `jq` (JSON).

```bash
# 1) Start services
docker compose up --build

# 2) Health check (new terminal)
curl http://localhost:3000/
# -> {"ok":true}

# 3) Create a "success" order
curl -sS -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"type":"market","tokenIn":"SOL","tokenOut":"USDC","amount":1.25,"maxSlippageBps":100}'
# -> {"orderId":"<uuid>","ws":"/api/orders/execute?orderId=<uuid>"}

# 4) Create a "failure" (tight slippage)
curl -sS -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"type":"market","tokenIn":"SOL","tokenOut":"USDC","amount":0.5,"maxSlippageBps":1}'



# macOS (one-time)
brew install websocat jq

# subscribe while creating the order (so you see all states)
ID=$(curl -sS -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"type":"market","tokenIn":"SOL","tokenOut":"USDC","amount":1.25,"maxSlippageBps":100}' | jq -r .orderId)

websocat ws://localhost:3000/api/orders/execute?orderId=$ID



API

POST /api/orders/execute

Creates a market order and returns an orderId plus the WebSocket path to watch it live.

Request body
{
  "type": "market",
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amount": 1.25,
  "maxSlippageBps": 100
}

Response
{
  "orderId": "3f422723-e557-4ce7-9c8f-e9c0b93f7534",
  "ws": "/api/orders/execute?orderId=3f422723-e557-4ce7-9c8f-e9c0b93f7534"
}

WebSocket Events

Connect to:ws://localhost:3000/api/orders/execute?orderId=<uuid>
You’ll see a sequence similar to:
{ "orderId": "<id>", "status": "pending",  "ts": "2025-11-08T12:40:20.000Z" }
{ "orderId": "<id>", "status": "routing",  "quotes": [{"dex":"raydium","price":98.3},{"dex":"meteora","price":98.1}], "ts": "…" }
{ "orderId": "<id>", "status": "building", "ts": "…" }
{ "orderId": "<id>", "status": "submitted","ts": "…" }
{ "orderId": "<id>", "status": "confirmed","txHash":"0x79580350421245a39bd179b71bcf4199","executedPrice":98.2868,"ts":"…" }


Development Notes
	•	Runtime: Node 20, TypeScript
	•	Only compiles src/** (tests are excluded) to keep Docker builds clean.
	•	Queue worker & routing logic live in src/queue.ts and src/mockDexRouter.ts.
	•	WebSocket hub: src/wsHub.ts
	•	DB/Redis helpers: src/db.ts, src/redis.ts