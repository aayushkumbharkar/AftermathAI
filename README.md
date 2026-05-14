<div align="center">

# ⚡ Aftermath AI

### Decision Analysis Engine

**See what happens after your decision. No comfort, no filler — just consequences.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://aftermathai.vercel.app)
[![Backend API](https://img.shields.io/badge/API-Render-10b981?style=for-the-badge&logo=render&logoColor=white)](https://aftermathai-api.onrender.com)

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3-f55036?style=flat-square)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white)

</div>

---

## What Is This?

Aftermath AI is a thinking tool that simulates what happens **after** a decision is made. It doesn't validate your ideas — it stress-tests them.

Enter any decision. Get back a structured analysis covering failure modes, hidden assumptions, second-order effects, and a realistic failure timeline.

> The system uses **provider fallback routing** to maintain low-latency inference under free-tier rate limits.

---

## Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │              Inference Router                │
┌──────────┐       │                                              │
│  React   │ POST  │  ┌────────────┐       ┌─────────────────┐   │
│  + Vite  │──────▶│  │    Groq    │──X──▶ │     Gemini      │   │
│ Frontend │◀──────│  │  (primary) │ fail  │   (fallback)    │   │
└──────────┘  JSON │  │ llama-3.3  │       │  2.0-flash      │   │
                    │  └────────────┘       └─────────────────┘   │
                    │         Express + Node.js                   │
                    └──────────────────────────────────────────────┘
```

### Multi-Provider Inference Routing

Most apps make a single API call. Aftermath AI implements **provider fallback routing**:

1. **Primary:** [Groq](https://groq.com) — `llama-3.3-70b-versatile` — optimized for ultra-low-latency inference (~300ms)
2. **Fallback:** [Google Gemini](https://ai.google.dev) — `gemini-2.0-flash` — automatic failover on rate limit (429) or provider error

Each response includes routing metadata:

| Field | Description |
|-------|-------------|
| `provider` | Which provider served the request (`groq` or `gemini`) |
| `latencyMs` | End-to-end inference time in milliseconds |
| `fallbackUsed` | Whether the primary provider failed and fallback was used |

---

## Analysis Sections

Every decision is analyzed across **9 dimensions**:

| # | Section | Purpose |
|---|---------|---------|
| 01 | **Direct Outcome** | Most likely immediate result |
| 02 | **Second-Order Effects** | Non-obvious downstream consequences |
| 03 | **Failure Points** | Where it's most likely to break |
| 04 | **Hidden Assumptions** | What must hold true but probably won't |
| 05 | **What You're Underestimating** | Blind spots in effort, cost, or risk |
| 06 | **Long-Term Consequences** | Trajectory if the decision continues |
| 07 | **Pattern Recognition** | Known failure patterns (e.g., premature scaling) |
| 08 | **Failure Timeline** | Stage-by-stage simulation (early → mid → late) |
| 09 | **Self-Critique** | The analysis challenges its own conclusions |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite 8 | Fast SPA with HMR |
| Backend | Express 4 (Node.js) | API server with `/analyze` endpoint |
| Primary LLM | Groq (LLaMA 3.3 70B) | Ultra-low-latency inference |
| Fallback LLM | Google Gemini 2.0 Flash | Reliable fallback provider |
| Frontend Deploy | Vercel | Edge-optimized static hosting |
| Backend Deploy | Render | Managed Node.js service |

---

## Quick Start

### Prerequisites

- Node.js 18+
- [Groq API key](https://console.groq.com/keys) (free tier)
- [Gemini API key](https://aistudio.google.com/apikey) (free tier)

### Setup

```bash
# Clone
git clone https://github.com/aayushkumbharkar/AftermathAI.git
cd AftermathAI

# Backend
cd backend
cp .env.example .env    # Add your API keys
npm install
npm run dev             # → http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev             # → http://localhost:5173
```

### Environment Variables

```env
GROQ_API_KEY=gsk_...        # Primary inference provider
GEMINI_API_KEY=AIza...       # Fallback inference provider
PORT=3001                    # Backend port
```

---

## API Reference

### `POST /analyze`

Analyze a decision with multi-provider inference routing.

**Request:**
```json
{
  "decision": "I want to quit my job to build a startup"
}
```

**Response:**
```json
{
  "analysis": "Direct Outcome:\n...",
  "provider": "groq",
  "latencyMs": 342,
  "fallbackUsed": false
}
```

### `GET /health`

Check provider availability.

```json
{
  "status": "ok",
  "providers": [
    { "name": "groq", "configured": true },
    { "name": "gemini", "configured": true }
  ]
}
```

---

## Deployment

### Frontend → Vercel

- Framework: Vite
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_URL` → your Render backend URL

### Backend → Render

- Environment: Node
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment Variables: `GROQ_API_KEY`, `GEMINI_API_KEY`, `PORT`

---

## License

MIT

---

<div align="center">
<sub>Built by <a href="https://github.com/aayushkumbharkar">Aayush Kumbharkar</a></sub>
</div>
