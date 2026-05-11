import type { FiltersMeta, Restaurant, SearchRequest } from "@/lib/types"

const API_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:8000"

export async function fetchFiltersMeta(): Promise<FiltersMeta> {
  const res = await fetch(`${API_BASE}/api/filters-meta`)
  if (!res.ok) throw new Error(`Failed to load filters: ${res.status}`)
  return res.json() as Promise<FiltersMeta>
}

export async function searchRestaurants(
  req: SearchRequest
): Promise<{ results: Restaurant[]; total: number }> {
  const res = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Search failed (${res.status})`)
  }
  return res.json() as Promise<{ results: Restaurant[]; total: number }>
}
