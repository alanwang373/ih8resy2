"use client"

import { useState, useEffect, useCallback } from "react"
import { FilterPanel } from "@/components/FilterPanel"
import { RestaurantCard } from "@/components/RestaurantCard"
import { fetchFiltersMeta, searchRestaurants } from "@/lib/api"
import { todayISO } from "@/lib/utils"
import type { FiltersMeta, Restaurant, SearchRequest } from "@/lib/types"

const DEFAULT_FILTERS: SearchRequest = {
  date: todayISO(),
  time_start: 18,
  time_end: 22.5,
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
  const [results, setResults] = useState<Restaurant[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [vibeQuery, setVibeQuery] = useState("")

  useEffect(() => {
    fetchFiltersMeta()
      .then(setMeta)
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
              <p className="font-serif text-xl text-[#1a3a6c]">Backend offline</p>
              <p className="text-sm font-sans text-[#9ca3af] max-w-xs">{errorMsg}</p>
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
        onSearch={handleSearch}
        loading={status === "loading"}
      />

      {/* Results pane */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#faf9f6]/90 backdrop-blur-sm border-b border-[#e8e4df] px-8 py-4 flex items-center justify-between">
          {status === "success" && total !== null ? (
            <p className="font-serif text-base text-[#1a3a6c]">
              <span className="font-semibold">{total}</span>{" "}
              <span className="font-normal italic">tables available</span>
            </p>
          ) : status === "loading" ? (
            <p className="font-sans text-sm text-[#9ca3af]">Searching Resy…</p>
          ) : (
            <div />
          )}
          {status === "error" && (
            <p className="text-xs font-sans text-red-400">{errorMsg}</p>
          )}
        </div>

        {/* Grid / empty states */}
        <div className="px-8 py-6">

          {/* ── Idle: centered hero + vibe search bar ── */}
          {status === "idle" && (
            <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-8">
              <div className="space-y-3">
                <p className="font-serif text-4xl font-semibold text-[#1a3a6c] leading-tight tracking-tight">
                  Where are you<br />dining tonight?
                </p>
                <p className="font-sans text-sm text-[#b0aca8]">
                  Set your filters on the left, then hit{" "}
                  <span className="font-medium text-[#6b7280]">Find tables</span>.
                </p>
              </div>

              {/* Vibe search */}
              <div className="w-full max-w-md space-y-2">
                <p className="text-xs font-sans text-[#b0aca8] italic">
                  or try describing what you&apos;re looking for:
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={vibeQuery}
                    onChange={(e) => setVibeQuery(e.target.value)}
                    placeholder="cozy italian vibes with a great wine list…"
                    className="w-full font-sans text-sm px-4 py-3.5 pr-12 rounded-xl border border-[#e8e4df] bg-white text-[#1a1a2e] placeholder:text-[#c8c4bf] focus:outline-none focus:ring-1 focus:ring-[#1a3a6c] focus:border-[#1a3a6c] shadow-sm transition-all"
                    onKeyDown={(e) => e.key === "Enter" && vibeQuery && handleSearch()}
                  />
                  <button
                    type="button"
                    disabled={!vibeQuery}
                    onClick={handleSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0aca8] hover:text-[#1a3a6c] disabled:opacity-30 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 13l3 3m-3-3a5 5 0 10-7.07-7.07A5 5 0 0013 13z"/>
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] font-sans text-[#d1cdc8]">
                  AI-powered vibe matching — coming soon
                </p>
              </div>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {status === "loading" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e8e4df] overflow-hidden animate-pulse">
                  <div className="h-44 bg-[#f0ede8]" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-[#f0ede8] rounded w-3/4" />
                    <div className="h-3 bg-[#f0ede8] rounded w-1/2" />
                    <div className="flex gap-2 mt-2">
                      <div className="h-5 bg-[#f0ede8] rounded-full w-16" />
                      <div className="h-5 bg-[#f0ede8] rounded-full w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── No results ── */}
          {status === "success" && results.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-3">
              <p className="font-serif text-2xl text-[#1a3a6c]">No tables found</p>
              <p className="font-sans text-sm text-[#b0aca8] max-w-xs">
                Try widening your time window, adding more neighborhoods, or relaxing your filters.
              </p>
            </div>
          )}

          {/* ── Results grid ── */}
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
