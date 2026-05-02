import os
import json
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
VENUES_FILE = os.path.join(os.path.dirname(__file__), "venues_seed.json")

NEIGHBORHOODS: dict[str, tuple[float, float]] = {
    "Battery Park City":    (40.7077, -74.0156),
    "Civic Center":         (40.7130, -74.0089),
    "Chinatown":            (40.7158, -73.9970),
    "East Village":         (40.7265, -73.9815),
    "Financial District":   (40.7075, -74.0113),
    "Fulton / Seaport":     (40.7063, -74.0045),
    "Little Italy":         (40.7191, -73.9973),
    "Lower East Side":      (40.7153, -73.9862),
    "Nolita":               (40.7228, -73.9958),
    "SoHo":                 (40.7233, -74.0030),
    "Greenwich Village":    (40.7308, -74.0002),
    "West Village":         (40.7339, -74.0063),
    "Hudson Square":        (40.7259, -74.0080),
    "Tribeca":              (40.7163, -74.0086),
    "Chelsea":              (40.7465, -74.0014),
    "West Chelsea":         (40.7483, -74.0074),
    "Flatiron":             (40.7410, -73.9896),
    "NoMad":                (40.7453, -73.9882),
    "Gramercy Park":        (40.7379, -73.9840),
    "Central Park South":   (40.7657, -73.9785),
    "Midtown":              (40.7549, -73.9840),
    "Midtown South":        (40.7484, -73.9880),
    "Midtown West":         (40.7580, -73.9927),
    "Hell's Kitchen":       (40.7638, -73.9918),
    "Hudson Yards":         (40.7549, -74.0014),
    "Midtown East":         (40.7549, -73.9720),
    "Kips Bay":             (40.7425, -73.9758),
    "Murray Hill":          (40.7484, -73.9780),
    "Sutton Place":         (40.7566, -73.9604),
    "Turtle Bay":           (40.7519, -73.9656),
    "Beekman":              (40.7571, -73.9600),
    "Upper East Side":      (40.7739, -73.9565),
    "Carnegie Hill":        (40.7835, -73.9548),
    "Lenox Hill":           (40.7680, -73.9623),
    "Upper Carnegie Hill":  (40.7868, -73.9535),
    "Yorkville":            (40.7762, -73.9479),
    "Upper West Side":      (40.7870, -73.9754),
    "Lincoln Square":       (40.7740, -73.9836),
    "Manhattan Valley":     (40.7987, -73.9656),
    "Manhattanville":       (40.8097, -73.9584),
    "Central Harlem":       (40.8116, -73.9465),
    "South Harlem":         (40.8061, -73.9503),
    "East Harlem":          (40.7957, -73.9376),
    "Hamilton Heights":     (40.8228, -73.9487),
    "Morningside Heights":  (40.8072, -73.9635),
    "Washington Heights":   (40.8417, -73.9395),
    "Fort George":          (40.8573, -73.9300),
    "Hudson Heights":       (40.8504, -73.9362),
    "Inwood":               (40.8679, -73.9206),
    "Marble Hill":          (40.8764, -73.9100),
}


def load_venues() -> list[dict]:
    if os.path.exists(VENUES_FILE):
        with open(VENUES_FILE) as f:
            return json.load(f)
    return []


def save_venues(venues: list[dict]):
    with open(VENUES_FILE, "w") as f:
        json.dump(venues, f, indent=2)


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
    date: str
    time_start: float
    time_end: float
    party_size: int
    neighborhoods: list[str] = []
    cuisines: list[str] = []
    vibe_tags: list[str] = []
    price_range: Optional[int] = None
    min_rating: Optional[float] = None


class AddVenueRequest(BaseModel):
    slug: str


# ── Helpers ──────────────────────────────────────────────────────────


def venue_matches_filters(venue: dict, req: SearchRequest) -> bool:
    if req.neighborhoods:
        nbhd = venue.get("neighborhood", "").lower()
        if not any(n.lower() in nbhd or nbhd in n.lower() for n in req.neighborhoods):
            return False

    if req.cuisines:
        venue_cuisines = " ".join(c.lower() for c in venue.get("cuisine", []))
        if not any(c.lower() in venue_cuisines for c in req.cuisines):
            return False

    if req.price_range is not None:
        price = venue.get("price_range")
        if price and price > req.price_range:
            return False

    if req.min_rating is not None:
        rating = venue.get("rating") or 0
        if rating < req.min_rating:
            return False

    if req.vibe_tags:
        venue_tags = " ".join(t.lower() for t in venue.get("tags", []))
        if not any(v.lower() in venue_tags for v in req.vibe_tags):
            return False

    return True


async def check_venue_availability(
    client: httpx.AsyncClient,
    venue: dict,
    date: str,
    party_size: int,
) -> Optional[dict]:
    """Call /4/find for a single venue. Returns the venue result dict or None."""
    venue_id = venue["id"]
    url = (
        f"https://api.resy.com/4/find"
        f"?lat=0&long=0&day={date}&party_size={party_size}&venue_id={venue_id}"
    )
    try:
        resp = await client.get(url, headers=resy_headers())
        if resp.status_code != 200:
            logger.warning(f"find failed for {venue.get('name')} (id={venue_id}): {resp.status_code}")
            return None
        data = resp.json()
        venues = data.get("results", {}).get("venues", [])
        if venues and venues[0].get("slots"):
            return venues[0]
        return None
    except Exception as e:
        logger.error(f"Error checking {venue.get('name')}: {e}")
        return None


def slot_in_window(slot: dict, time_start: float, time_end: float) -> bool:
    try:
        time_str = slot.get("date", {}).get("start", "")
        h, m = time_str.split(" ")[1].split(":")[:2]
        slot_time = int(h) + int(m) / 60
        return time_start <= slot_time <= time_end
    except Exception:
        return False


def build_resy_url(slug: str, date: str, party_size: int, time_slot: str) -> str:
    return f"https://resy.com/cities/ny/{slug}?date={date}&seats={party_size}&time_slot={time_slot}"


def format_result(
    resy_venue: dict, seed_venue: dict, date: str, party_size: int,
    time_start: float, time_end: float,
) -> Optional[dict]:
    detail = resy_venue.get("venue", {})
    slots = resy_venue.get("slots", [])

    windowed = [s for s in slots if slot_in_window(s, time_start, time_end)]
    if not windowed:
        return None

    windowed.sort(key=lambda s: s.get("date", {}).get("start", ""))
    earliest = windowed[0]
    time_slot = earliest.get("date", {}).get("start", "").split(" ")[1][:5]
    slug = detail.get("url_slug", "") or seed_venue.get("slug", "")

    images = detail.get("images", [])
    if not images:
        images = seed_venue.get("images", [])

    return {
        "id": seed_venue["id"],
        "name": detail.get("name", "") or seed_venue.get("name", ""),
        "slug": slug,
        "neighborhood": detail.get("location", {}).get("neighborhood", "") or seed_venue.get("neighborhood", ""),
        "address": detail.get("location", {}).get("address_1", ""),
        "cuisine": [c.get("locale", "") for c in detail.get("cuisine", [])] or seed_venue.get("cuisine", []),
        "tags": [t.get("locale", "") for t in detail.get("tags", [])] or seed_venue.get("tags", []),
        "rating": detail.get("rating") or seed_venue.get("rating"),
        "price_range": detail.get("price_range_id") or seed_venue.get("price_range"),
        "images": images[:1],
        "available_slots": [
            {
                "time": s.get("date", {}).get("start", "").split(" ")[1][:5],
                "type": s.get("config", {}).get("type", ""),
            }
            for s in windowed
        ],
        "resy_url": build_resy_url(slug, date, party_size, time_slot),
    }


# ── Endpoints ────────────────────────────────────────────────────────


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


@app.get("/api/venues")
async def list_venues():
    venues = load_venues()
    return {"venues": venues, "total": len(venues)}


@app.post("/api/venues/add")
async def add_venue(req: AddVenueRequest):
    slug = req.slug.strip().lower()
    slug = slug.replace("https://resy.com/cities/ny/", "").split("?")[0]
    parts = slug.split("-")
    # Strip trailing city tokens like "new-york-new-york" or "brooklyn"
    # Try progressively shorter slugs until we get a hit
    async with httpx.AsyncClient(timeout=8.0) as client:
        for end in range(len(parts), 0, -1):
            candidate = "-".join(parts[:end])
            resp = await client.get(
                "https://api.resy.com/3/venue",
                params={"url_slug": candidate, "location": "new-york-ny"},
                headers=resy_headers(),
            )
            if resp.status_code == 200 and resp.text.strip().startswith("{"):
                data = resp.json()
                vid = data.get("id", {}).get("resy") if isinstance(data.get("id"), dict) else data.get("id")
                if not vid:
                    continue
                venues = load_venues()
                if any(v["id"] == vid for v in venues):
                    return {"status": "exists", "venue": {"id": vid, "name": data.get("name", "")}}
                new_venue = {
                    "id": vid,
                    "slug": candidate,
                    "name": data.get("name", ""),
                    "neighborhood": data.get("location", {}).get("neighborhood", ""),
                    "cuisine": [c.get("locale", "") for c in data.get("cuisine", [])],
                    "price_range": data.get("price_range_id"),
                    "rating": data.get("rating"),
                    "tags": [t.get("locale", "") for t in data.get("tags", [])],
                }
                venues.append(new_venue)
                save_venues(venues)
                return {"status": "added", "venue": new_venue}
    raise HTTPException(status_code=404, detail=f"Could not find venue for slug: {req.slug}")


@app.post("/api/search")
async def search_restaurants(request: SearchRequest):
    if not RESY_AUTH_TOKEN:
        raise HTTPException(status_code=500, detail="RESY_AUTH_TOKEN not configured in .env")

    venues = load_venues()
    candidates = [v for v in venues if venue_matches_filters(v, request)]

    logger.info(f"Search: {len(candidates)}/{len(venues)} venues match filters, checking availability...")

    async with httpx.AsyncClient(timeout=10.0) as client:
        tasks = [
            check_venue_availability(client, v, request.date, request.party_size)
            for v in candidates
        ]
        resy_results = await asyncio.gather(*tasks)

    results = []
    for seed_venue, resy_venue in zip(candidates, resy_results):
        if resy_venue is None:
            continue
        formatted = format_result(
            resy_venue, seed_venue, request.date, request.party_size,
            request.time_start, request.time_end,
        )
        if formatted:
            results.append(formatted)

    results.sort(key=lambda x: x.get("rating") or 0, reverse=True)
    logger.info(f"Search complete: {len(results)} venues with availability in time window")

    return {"results": results, "total": len(results)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
