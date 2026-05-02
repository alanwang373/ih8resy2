"use client"

import { useState, useEffect, useCallback } from "react"
import { FilterPanel } from "@/components/FilterPanel"
import { RestaurantCard } from "@/components/RestaurantCard"
import { fetchFiltersMeta, fetchNeighborhoods, searchRestaurants } from "@/lib/api"
import { todayISO } from "@/lib/utils"
import type { FiltersMeta, Restaurant, SearchRequest } from "@/lib/types"

const DEFAULT_FILTERS: SearchRequest = {
  date: todayISO(),
  time_start: 18,
  time_end: 22,
  party_size: 2,
  neighborhoods: [],
  cuisines: [],
  vibe_tags: [],
  price_range: null,
  min_rating: null,
}

type Status = "idle" | "loading" | "success" | "error"

export default function Home() {
  const [filters, setFilters] = useState<SearchRequest>(DEFAULT_FILTERS)
  const [meta, setMeta] = useState<FiltersMeta | null>(null)
  const [neighborhoods, setNeighborhoods] = useState<string[]>([])
  const [results, setResults] = useState<Restaurant[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    Promise.all([fetchFiltersMeta(), fetchNeighborhoods()])
      .then(([m, n]) => {
        setMeta(m)
        setNeighborhoods(n)
      })
      .catch(() => setErrorMsg("Could not connect to backend — is the server running?"))
  }, [])

  const handleSearch = useCallback(async () => {
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await searchRestaurants(filters)
      setResults(res.results)
      setTotal(res.total)
      setStatus("success")
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Search failed")
      setStatus("error")
    }
  }, [filters])

  function updateFilters(partial: Partial<SearchRequest>) {
    setFilters((prev) => ({ ...prev, ...partial }))
  }

  if (!meta) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#faf9f6]">
        <div className="text-center space-y-3">
          {errorMsg ? (
            <>
              <p className="font-serif text-xl text-[#0e1c3d]">Backend offline</p>
              <p className="text-sm font-sans text-[#9ca3af]">{errorMsg}</p>
            </>
          ) : (
            <p className="font-sans text-sm text-[#9ca3af]">Loading…</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf9f6]">
      <FilterPanel
        filters={filters}
        onChange={updateFilters}
        meta={meta}
        neighborhoods={neighborhoods}
        onSearch={handleSearch}
        loading={status === "loading"}
      />

      {/* Results pane */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#faf9f6]/90 backdrop-blur-sm border-b border-[#e8e4df] px-8 py-4 flex items-center justify-between">
          <div>
            {status === "success" && total !== null ? (
              <p className="font-serif text-base text-[#0e1c3d]">
                <span className="font-semibold">{total}</span>{" "}
                <span className="font-normal italic">tables available</span>
              </p>
            ) : status === "idle" ? (
              <p className="font-serif italic text-[#b0aca8] text-base">
                Set your filters and find a table
              </p>
            ) : status === "loading" ? (
              <p className="font-sans text-sm text-[#9ca3af]">Searching Resy…</p>
            ) : null}
          </div>
          {status === "error" && (
            <p className="text-xs font-sans text-red-500">{errorMsg}</p>
          )}
        </div>

        {/* Grid */}
        <div className="px-8 py-6">
          {status === "idle" && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
              <p className="font-serif text-3xl text-[#0e1c3d] font-semibold leading-snug">
                Where are you dining tonight?
              </p>
              <p className="font-sans text-sm text-[#b0aca8] max-w-xs">
                Set your date, time, and preferences on the left, then hit{" "}
                <span className="font-medium text-[#6b7280]">Find tables</span>.
              </p>
            </div>
          )}

          {status === "loading" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e8e4df] overflow-hidden animate-pulse">
                  <div className="h-44 bg-[#f0ede8]" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-[#f0ede8] rounded w-3/4" />
                    <div className="h-3 bg-[#f0ede8] rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-[#f0ede8] rounded-full w-16" />
                      <div className="h-5 bg-[#f0ede8] rounded-full w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {status === "success" && results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-3">
              <p className="font-serif text-2xl text-[#0e1c3d]">No tables found</p>
              <p className="font-sans text-sm text-[#b0aca8] max-w-xs">
                Try widening your time window, adding more neighborhoods, or relaxing your filters.
              </p>
            </div>
          )}

          {status === "success" && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
