#!/usr/bin/env python3
"""
One-shot script to enrich venues_seed.json with live data from the Resy /3/venue API.

Populates per venue: id (if 0/missing), name, neighborhood, cuisine, tags, rating,
price_range, images (up to 2).

Usage:
    cd server && python enrich_venues.py

No RESY_AUTH_TOKEN required — uses the public API key only.
Rate-limited to batches of 5 with a 1.2 s pause between batches.
Expected runtime: ~30-45 s for 50 venues.
"""

import asyncio
import json
import os

import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

RESY_API_KEY = "VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"
RESY_AUTH_TOKEN = os.getenv("RESY_AUTH_TOKEN", "")
VENUES_FILE = os.path.join(os.path.dirname(__file__), "venues_seed.json")
BATCH_SIZE = 5
BATCH_PAUSE = 1.2  # seconds between batches to avoid rate-limiting


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


async def enrich_one(client: httpx.AsyncClient, venue: dict) -> dict:
    slug = venue["slug"]
    try:
        resp = await client.get(
            "https://api.resy.com/3/venue",
            params={"url_slug": slug, "location": "new-york-ny"},
            headers=resy_headers(),
            timeout=12.0,
        )
    except Exception as exc:
        print(f"  ERROR   {venue.get('name', slug):<35} {exc}")
        return venue

    if resp.status_code != 200:
        print(f"  SKIP    {venue.get('name', slug):<35} HTTP {resp.status_code}")
        return venue

    try:
        data = resp.json()
    except Exception:
        print(f"  SKIP    {venue.get('name', slug):<35} bad JSON")
        return venue

    # ID — Resy returns either {id: {resy: N}} or {id: N}
    raw_id = data.get("id")
    vid = raw_id.get("resy") if isinstance(raw_id, dict) else raw_id
    if vid:
        venue["id"] = vid

    venue["name"] = data.get("name") or venue.get("name", "")
    venue["neighborhood"] = (
        data.get("location", {}).get("neighborhood", "")
        or venue.get("neighborhood", "")
    )
    venue["cuisine"] = [c.get("locale", "") for c in data.get("cuisine", []) if c.get("locale")]
    venue["tags"] = [t.get("locale", "") for t in data.get("tags", []) if t.get("locale")]
    venue["rating"] = data.get("rating") or venue.get("rating")
    venue["price_range"] = data.get("price_range_id") or venue.get("price_range")

    images = data.get("images", [])
    if images:
        venue["images"] = images[:2]

    status = "OK " if vid else "PARTIAL"
    print(
        f"  {status}    {venue['name']:<35} "
        f"cuisine={str(venue['cuisine'][:2]):<28} "
        f"rating={venue.get('rating')}"
    )
    return venue


async def main() -> None:
    if not RESY_AUTH_TOKEN:
        print("WARNING: RESY_AUTH_TOKEN not set in server/.env — requests will likely 403.")
        print("         Add it and re-run to fetch cuisine, tags, ratings, and images.\n")

    with open(VENUES_FILE) as f:
        venues = json.load(f)

    print(f"Enriching {len(venues)} venues from Resy /3/venue ...\n")
    enriched: list[dict] = []

    for batch_start in range(0, len(venues), BATCH_SIZE):
        batch = venues[batch_start : batch_start + BATCH_SIZE]
        async with httpx.AsyncClient() as client:
            results = await asyncio.gather(*[enrich_one(client, v) for v in batch])
        enriched.extend(results)

        remaining = len(venues) - (batch_start + BATCH_SIZE)
        if remaining > 0:
            batch_num = batch_start // BATCH_SIZE + 1
            print(f"  --- batch {batch_num} done, {max(remaining, 0)} left ---")
            await asyncio.sleep(BATCH_PAUSE)

    with open(VENUES_FILE, "w") as f:
        json.dump(enriched, f, indent=2, ensure_ascii=False)

    ok = sum(1 for v in enriched if v.get("cuisine"))
    print(f"\nDone. {ok}/{len(enriched)} venues enriched with cuisine data.")
    print(f"Saved → {VENUES_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
