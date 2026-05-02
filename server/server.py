import os
import asyncio
import httpx
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

RESY_API_KEY = "VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"
RESY_AUTH_TOKEN = os.getenv("RESY_AUTH_TOKEN", "")

NEIGHBORHOODS: dict[str, tuple[float, float]] = {
    "Financial District": (40.7075, -74.0113),
    "Tribeca": (40.7163, -74.0086),
    "SoHo": (40.7233, -74.0030),
    "Little Italy": (40.7191, -73.9973),
    "Lower East Side": (40.7153, -73.9862),
    "Chinatown": (40.7158, -73.9970),
    "West Village": (40.7339, -74.0063),
    "Greenwich Village": (40.7308, -74.0002),
    "East Village": (40.7265, -73.9815),
    "NoHo": (40.7278, -73.9942),
    "Nolita": (40.7228, -73.9958),
    "Chelsea": (40.7465, -74.0014),
    "Flatiron": (40.7410, -73.9896),
    "Gramercy": (40.7379, -73.9840),
    "Murray Hill": (40.7484, -73.9780),
    "Midtown West": (40.7549, -73.9840),
    "Midtown East": (40.7549, -73.9720),
    "Hell's Kitchen": (40.7638, -73.9918),
    "Upper West Side": (40.7870, -73.9754),
    "Upper East Side": (40.7739, -73.9565),
    "Harlem": (40.8116, -73.9465),
}


def resy_headers() -> dict:
    h = {
        "Authorization": f'ResyAPI api_key="{RESY_API_KEY}"',
        "X-Origin": "https://resy.com",
        "Referer": "https://resy.com/",
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Cache-Control": "no-cache",
    }
    if RESY_AUTH_TOKEN:
        h["X-Resy-Auth-Token"] = RESY_AUTH_TOKEN
        h["X-Resy-Universal-Auth"] = RESY_AUTH_TOKEN
    return h


class SearchRequest(BaseModel):
    date: str                          # YYYY-MM-DD
    time_start: int                    # hour 0–23
    time_end: int                      # hour 0–23
    party_size: int
    neighborhoods: list[str] = []
    cuisines: list[str] = []
    vibe_tags: list[str] = []
    price_range: Optional[int] = None  # 1–4; None = any
    min_rating: Optional[float] = None


@app.get("/")
async def index():
    return {"message": "ResyFinder API is live"}


@app.get("/api/neighborhoods")
async def get_neighborhoods():
    return {"neighborhoods": sorted(NEIGHBORHOODS.keys())}


@app.get("/api/filters-meta")
async def get_filters_meta():
    return {
        "cuisines": sorted([
            "American", "Italian", "Japanese", "Chinese", "Mexican",
            "French", "Korean", "Mediterranean", "Indian", "Thai",
            "Spanish", "Middle Eastern", "Seafood", "Steakhouse", "Pizza",
            "Sushi", "Ramen", "Dim Sum", "Tapas", "Farm-to-Table",
        ]),
        "vibes": {
            "Energy": ["Quiet & Intimate", "Lively", "Bustling"],
            "Seating / Space": ["Bar Seating", "Outdoor", "Private Dining", "Counter / Chef's Table"],
            "Occasion": ["Date Night", "Business Dining", "Special Occasion", "Brunch Spot", "Late Night"],
        },
        "price_options": [1, 2, 3, 4],
    }


async def find_venues_for_neighborhood(
    client: httpx.AsyncClient,
    neighborhood: str,
    date: str,
    party_size: int,
) -> list[dict]:
    if neighborhood not in NEIGHBORHOODS:
        return []
    lat, lng = NEIGHBORHOODS[neighborhood]
    url = (
        f"https://api.resy.com/4/find"
        f"?lat={lat}&long={lng}&day={date}&party_size={party_size}"
        f"&per_page=30&page=1&radius=0.5"
    )
    try:
        resp = await client.get(url, headers=resy_headers())
        if resp.status_code != 200:
            logger.warning(f"Resy /4/find failed for {neighborhood}: {resp.status_code} {resp.text[:200]}")
            return []
        data = resp.json()
        return data.get("results", {}).get("venues", [])
    except Exception as e:
        logger.error(f"Error querying {neighborhood}: {e}")
        return []


def slot_in_window(slot: dict, time_start: int, time_end: int) -> bool:
    try:
        time_str = slot.get("date", {}).get("start", "")
        hour = int(time_str.split(" ")[1].split(":")[0])
        return time_start <= hour <= time_end
    except Exception:
        return False


def match_filters(venue: dict, req: SearchRequest) -> bool:
    detail = venue.get("venue", {})

    if req.price_range is not None:
        price = detail.get("price_range_id")
        if price and price > req.price_range:
            return False

    if req.min_rating is not None:
        rating = detail.get("rating") or 0
        if rating < req.min_rating:
            return False

    if req.cuisines:
        venue_cuisines = " ".join(
            c.get("locale", "").lower() for c in detail.get("cuisine", [])
        )
        if not any(c.lower() in venue_cuisines for c in req.cuisines):
            return False

    if req.vibe_tags:
        venue_tags = " ".join(
            t.get("locale", "").lower() for t in detail.get("tags", [])
        )
        if not any(v.lower() in venue_tags for v in req.vibe_tags):
            return False

    return True


def build_resy_url(slug: str, date: str, party_size: int, time_slot: str) -> str:
    return f"https://resy.com/cities/ny/{slug}?date={date}&seats={party_size}&time_slot={time_slot}"


def format_result(venue: dict, date: str, party_size: int, time_start: int, time_end: int) -> Optional[dict]:
    detail = venue.get("venue", {})
    slots = venue.get("slots", [])

    windowed = [s for s in slots if slot_in_window(s, time_start, time_end)]
    if not windowed:
        return None

    windowed.sort(key=lambda s: s.get("date", {}).get("start", ""))
    earliest = windowed[0]
    time_slot = earliest.get("date", {}).get("start", "").split(" ")[1][:5]
    slug = detail.get("url_slug", "")

    return {
        "id": detail.get("id", {}).get("resy"),
        "name": detail.get("name", ""),
        "slug": slug,
        "neighborhood": detail.get("location", {}).get("neighborhood", ""),
        "address": detail.get("location", {}).get("address_1", ""),
        "cuisine": [c.get("locale", "") for c in detail.get("cuisine", [])],
        "tags": [t.get("locale", "") for t in detail.get("tags", [])],
        "rating": detail.get("rating"),
        "price_range": detail.get("price_range_id"),
        "images": detail.get("images", [])[:1],
        "available_slots": [
            {
                "time": s.get("date", {}).get("start", "").split(" ")[1][:5],
                "type": s.get("config", {}).get("type", ""),
            }
            for s in windowed
        ],
        "resy_url": build_resy_url(slug, date, party_size, time_slot),
    }


@app.post("/api/search")
async def search_restaurants(request: SearchRequest):
    if not RESY_AUTH_TOKEN:
        raise HTTPException(status_code=500, detail="RESY_AUTH_TOKEN not configured in .env")

    target_neighborhoods = request.neighborhoods or list(NEIGHBORHOODS.keys())

    async with httpx.AsyncClient(timeout=15.0) as client:
        tasks = [
            find_venues_for_neighborhood(client, n, request.date, request.party_size)
            for n in target_neighborhoods
        ]
        batches = await asyncio.gather(*tasks)

    # Deduplicate across neighborhoods
    seen: set = set()
    all_venues: list[dict] = []
    for batch in batches:
        for v in batch:
            vid = v.get("venue", {}).get("id", {}).get("resy")
            if vid and vid not in seen:
                seen.add(vid)
                all_venues.append(v)

    filtered = [v for v in all_venues if match_filters(v, request)]

    results = []
    for v in filtered:
        formatted = format_result(v, request.date, request.party_size, request.time_start, request.time_end)
        if formatted:
            results.append(formatted)

    results.sort(key=lambda x: x.get("rating") or 0, reverse=True)

    return {"results": results, "total": len(results)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
