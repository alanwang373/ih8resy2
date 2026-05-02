import type { FiltersMeta, SearchRequest, SearchResponse } from "@/lib/types"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = response.statusText
    try {
      const data = (await response.json()) as { detail?: string }
      if (data?.detail) {
        detail = data.detail
      }
    } catch {
      // Keep HTTP status text fallback.
    }
    throw new Error(`Backend request failed: ${detail}`)
  }
  return (await response.json()) as T
}

export async function fetchNeighborhoods(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/neighborhoods`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
  const data = await parseJson<{ neighborhoods: string[] }>(response)
  return data.neighborhoods ?? []
}

export async function fetchFiltersMeta(): Promise<FiltersMeta> {
  const response = await fetch(`${API_BASE}/api/filters-meta`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
  return parseJson<FiltersMeta>(response)
}

export async function searchRestaurants(payload: SearchRequest): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  })
  return parseJson<SearchResponse>(response)
}
