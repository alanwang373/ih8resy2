import os
import asyncio
import httpx
import logging
from datetime import datetime
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
MANHATTAN_CENTER = (40.7580, -73.9855)

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


async def fetch_available_venues(
    client: httpx.AsyncClient,
    date: str,
    party_size: int,
) -> list[dict]:
    # Resy currently returns broad inventory regardless of neighborhood/radius inputs.
    # We fetch once and apply neighborhood filtering locally for better latency/reliability.
    lat, lng = MANHATTAN_CENTER
    url = (
        f"https://api.resy.com/4/find"
        f"?lat={lat}&long={lng}&day={date}&party_size={party_size}"
        f"&per_page=30&page=1&radius=0.5"
    )
    try:
        resp = await client.get(url, headers=resy_headers())
        if resp.status_code != 200:
            logger.warning(f"Resy /4/find failed: {resp.status_code} {resp.text[:200]}")
            return []
        data = resp.json()
        return data.get("results", {}).get("venues", [])
    except Exception as e:
        logger.error(f"Error querying /4/find: {e}")
        return []


def slot_in_window(slot: dict, time_start: int, time_end: int) -> bool:
    time_str = slot.get("date", {}).get("start", "")
    if not time_str:
        return False

    try:
        # Usually "YYYY-MM-DD HH:MM:SS"
        hour = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S").hour
    except ValueError:
        try:
            # Fallback for ISO timestamp shape.
            hour = datetime.fromisoformat(time_str.replace("Z", "+00:00")).hour
        except Exception:
            try:
                # Last resort, keep previous permissive parser.
                hour = int(time_str.split(" ")[1].split(":")[0])
            except Exception:
                return False
    return time_start <= hour <= time_end


def extract_cuisines(detail: dict) -> list[str]:
    cuisines = [c.get("locale", "") for c in detail.get("cuisine", []) if c.get("locale")]
    if detail.get("type"):
        cuisines.append(detail["type"])
    deduped = []
    seen = set()
    for cuisine in cuisines:
        key = cuisine.strip().lower()
        if cuisine and key not in seen:
            seen.add(key)
            deduped.append(cuisine)
    return deduped


def extract_vibe_text(detail: dict) -> str:
    parts: list[str] = []
    for tag in detail.get("tags", []) or []:
        if isinstance(tag, dict) and tag.get("locale"):
            parts.append(tag["locale"])
    for content in detail.get("content", []) or []:
        if not isinstance(content, dict):
            continue
        for key in ("name", "title", "body"):
            val = content.get(key)
            if isinstance(val, str) and val.strip():
                parts.append(val)
    return " ".join(parts).lower()


def extract_image_urls(detail: dict) -> list[str]:
    urls: list[str] = []
    responsive_images = detail.get("responsive_images") or {}
    originals = responsive_images.get("originals", {}) if isinstance(responsive_images, dict) else {}
    if isinstance(originals, dict):
        for image_data in originals.values():
            if isinstance(image_data, dict) and image_data.get("url"):
                urls.append(image_data["url"])
    return urls


def venue_neighborhood(venue: dict) -> str:
    detail = venue.get("venue", {})
    return (detail.get("location", {}) or {}).get("neighborhood", "")


def venue_matches_neighborhoods(venue: dict, neighborhoods: list[str]) -> bool:
    if not neighborhoods:
        return True
    selected = {n.strip().lower() for n in neighborhoods if n.strip()}
    if not selected:
        return True
    return venue_neighborhood(venue).strip().lower() in selected


def match_filters(venue: dict, req: SearchRequest) -> bool:
    detail = venue.get("venue", {})

    if req.price_range is not None:
        price = detail.get("price_range")
        if price and price > req.price_range:
            return False

    if req.min_rating is not None:
        rating = detail.get("rating") or 0
        if rating < req.min_rating:
            return False

    if req.cuisines:
        venue_cuisines = [c.lower() for c in extract_cuisines(detail)]
        requested_cuisines = [c.lower() for c in req.cuisines]
        if not any(
            any(requested in cuisine for cuisine in venue_cuisines)
            for requested in requested_cuisines
        ):
            return False

    if req.vibe_tags:
        searchable = extract_vibe_text(detail)
        # Some venues do not expose any vibe metadata; don't hard-fail those entries.
        if searchable and not any(v.lower() in searchable for v in req.vibe_tags):
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
    if not slug:
        return None

    available_slots = []
    seen_slots = set()
    for slot in windowed:
        slot_time = slot.get("date", {}).get("start", "").split(" ")[1][:5]
        slot_type = slot.get("config", {}).get("type", "")
        slot_key = f"{slot_time}|{slot_type}"
        if slot_time and slot_key not in seen_slots:
            seen_slots.add(slot_key)
            available_slots.append({"time": slot_time, "type": slot_type})

    tags = [t.get("locale", "") for t in detail.get("tags", []) if isinstance(t, dict) and t.get("locale")]

    return {
        "id": detail.get("id", {}).get("resy"),
        "name": detail.get("name", ""),
        "slug": slug,
        "neighborhood": venue_neighborhood(venue),
        "address": (detail.get("location", {}) or {}).get("name", ""),
        "cuisine": extract_cuisines(detail),
        "tags": tags,
        "rating": detail.get("rating"),
        "price_range": detail.get("price_range"),
        "images": extract_image_urls(detail)[:1],
        "available_slots": available_slots,
        "resy_url": build_resy_url(slug, date, party_size, time_slot),
    }


@app.post("/api/search")
async def search_restaurants(request: SearchRequest):
    async with httpx.AsyncClient(timeout=httpx.Timeout(45.0, connect=10.0)) as client:
        all_venues = await fetch_available_venues(client, request.date, request.party_size)

    by_neighborhood = [v for v in all_venues if venue_matches_neighborhoods(v, request.neighborhoods)]

    # Deduplicate by venue id.
    deduped: list[dict] = []
    seen_ids: set = set()
    for venue in by_neighborhood:
        venue_id = venue.get("venue", {}).get("id", {}).get("resy")
        if venue_id and venue_id not in seen_ids:
            seen_ids.add(venue_id)
            deduped.append(venue)

    filtered = [v for v in deduped if match_filters(v, request)]

    results = []
    for venue in filtered:
        formatted = format_result(venue, request.date, request.party_size, request.time_start, request.time_end)
        if formatted:
            results.append(formatted)

    results.sort(key=lambda x: x.get("rating") or 0, reverse=True)

    return {"results": results, "total": len(results)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
