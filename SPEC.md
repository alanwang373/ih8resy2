# ResyFinder — Product Spec

## Overview

ResyFinder is a personal web dashboard for discovering available NYC restaurant reservations on Resy, filtered by taste preferences. It replaces the original CLI reservation-sniper with a fast, filter-first search UI. Personal use only — single Resy auth token in `.env`.

---

## Architecture

```
frontend/   → Next.js 14 (App Router), TypeScript, Tailwind CSS
server/     → Python FastAPI, talks to Resy's unofficial API
```

The frontend sends a search request to the backend; the backend fans out to Resy's `/4/find` endpoint in parallel (one request per selected neighborhood), deduplicates, filters, and returns ranked results. Clicking a result opens the Resy venue page with date/party size pre-filled.

---

## Priority 1 — Core Search + Filter

### Input panel

| Filter | Type | Detail |
|---|---|---|
| Date | Date picker | Single specific date |
| Time window | Range slider | Hour granularity, e.g. 7–9 PM |
| Party size | Stepper | 1–10 |
| Neighborhood | Multi-select checklist | Manhattan neighborhoods; mirrors StreetEasy UX |
| Cuisine | Multi-select dropdown | Up to 5 at once, ~20 options |
| Vibe | Grouped tag pills | L1 buckets → L2 options (see below) |
| Price | Toggle buttons | $, $$, $$$, $$$$ |
| Min rating | Star slider | Pulled from Resy; Google rating P2 |

**Vibe tag structure (L1 → L2):**
- **Energy:** Quiet & Intimate · Lively · Bustling
- **Seating / Space:** Bar Seating · Outdoor · Private Dining · Counter / Chef's Table
- **Occasion:** Date Night · Business Dining · Special Occasion · Brunch Spot · Late Night

### Results

- Show only restaurants with **open slots** inside the requested time window (strict — no greyed-out / waitlist cards in P1)
- Cards sorted by Resy rating descending
- Each card shows: restaurant name, neighborhood, cuisine tags, vibe tags, price range, rating, available time slots, hero image
- Clicking a card (or a specific time slot chip) opens `resy.com/cities/ny/[slug]?date=X&seats=Y&time_slot=HH:MM` in a new tab — no in-app booking flow

---

## Priority 2 — Beli "Want to Try" Overlay

- User manually exports/scrapes their Beli profile and imports a JSON list of restaurant names
- Matching restaurants in the results get a "⭐ On your Beli list" badge
- No live Beli API (no public API available); manual refresh workflow

---

## Priority 2–3 — Agentic Vibe Search

- Freetext input: user types e.g. *"cozy low-lit spot for a first date, not too loud"*
- Backend calls Claude API; agent is given the query + a list of available restaurant names/tags from the current result set
- Agent reads indexed content from target Substacks (Rare Medium, Juliette Sibley, Robert Sietsema) to score each restaurant against the query
- Returns a ranked list overlaid on the main results — ranked match score shown as a match % or label
- Filtering remains additive: agentic rank is a sort layer on top of the existing filters

---

## API Endpoints (FastAPI)

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/neighborhoods` | Returns sorted list of Manhattan neighborhoods |
| GET | `/api/filters-meta` | Returns cuisines, vibe tags, price options for frontend dropdowns |
| POST | `/api/search` | Main search — fans out to Resy, filters, returns results |

### POST `/api/search` request shape

```json
{
  "date": "2026-05-09",
  "time_start": 19,
  "time_end": 21,
  "party_size": 2,
  "neighborhoods": ["West Village", "SoHo"],
  "cuisines": ["Italian", "Japanese"],
  "vibe_tags": ["Date Night", "Quiet & Intimate"],
  "price_range": 3,
  "min_rating": 4.0
}
```

### POST `/api/search` response shape

```json
{
  "total": 12,
  "results": [
    {
      "id": 1234,
      "name": "Via Carota",
      "slug": "via-carota-new-york-new-york",
      "neighborhood": "West Village",
      "address": "51 Grove St",
      "cuisine": ["Italian"],
      "tags": ["Date Night", "Quiet & Intimate"],
      "rating": 4.8,
      "price_range": 3,
      "images": ["https://..."],
      "available_slots": [
        { "time": "19:30", "type": "Indoor" },
        { "time": "20:00", "type": "Bar" }
      ],
      "resy_url": "https://resy.com/cities/ny/via-carota-new-york-new-york?date=2026-05-09&seats=2&time_slot=19:30"
    }
  ]
}
```

---

## Resy API Notes

- Auth: hardcoded `api_key` + personal `RESY_AUTH_TOKEN` from `.env`
- Discovery: `GET https://api.resy.com/4/find?lat=&long=&day=&party_size=&per_page=30&radius=0.5` — queried once per selected neighborhood center (lat/long lookup table in server)
- The `/4/find` response includes `results.venues[].slots[]` with `date.start` timestamps — these are filtered by the time window on the backend before returning to the frontend

---

## Setup

```bash
# Backend
cd server
pip install -r requirements.txt
cp .env.example .env   # add RESY_AUTH_TOKEN
python server.py

# Frontend
cd frontend
npm install
npm run dev
```

---

## Out of Scope (deleted from original codebase)

- Reservation sniping / auto-booking loop
- CLI interface
- Task queue (tasks.json)
- Proxy management
- CAPTCHA solving (CAPSolver / CapMonster)
- Account generation
- Discord webhook notifications
- Scheduling (APScheduler)
