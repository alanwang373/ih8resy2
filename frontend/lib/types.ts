export interface SearchRequest {
  date: string
  time_start: number
  time_end: number
  party_size: number
  neighborhoods: string[]
  cuisines: string[]
  vibe_tags: string[]
  price_range: number | null
  min_rating: number | null
}

export interface FiltersMeta {
  cuisines: string[]
  vibes: Record<string, string[]>
  price_options: number[]
}

export interface AvailableSlot {
  time: string
  type: string
}

export interface Restaurant {
  id: number
  name: string
  slug: string
  neighborhood: string
  address: string
  cuisine: string[]
  tags: string[]
  rating: number | null
  price_range: number | null
  images: string[]
  available_slots: AvailableSlot[]
  resy_url: string
}

export interface SearchResponse {
  total: number
  results: Restaurant[]
}
