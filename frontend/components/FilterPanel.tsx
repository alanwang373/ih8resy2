"use client"

import { cn, priceLabel, todayISO } from "@/lib/utils"
import { TimeSlider } from "./TimeSlider"
import { NeighborhoodSelector } from "./NeighborhoodSelector"
import { CuisineSelector } from "./CuisineSelector"
import { VibeSelector } from "./VibeSelector"
import type { FiltersMeta, SearchRequest } from "@/lib/types"

interface Props {
  filters: SearchRequest
  onChange: (f: Partial<SearchRequest>) => void
  meta: FiltersMeta
  neighborhoods: string[]
  onSearch: () => void
  loading: boolean
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#9ca3af] font-sans">
        {title}
      </h3>
      {children}
    </div>
  )
}

export function FilterPanel({ filters, onChange, meta, neighborhoods, onSearch, loading }: Props) {
  return (
    <aside className="w-72 shrink-0 bg-white border-r border-[#e8e4df] h-screen sticky top-0 flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-6 pt-7 pb-5 border-b border-[#e8e4df]">
        <h1 className="font-serif text-2xl font-semibold text-[#0e1c3d] tracking-tight leading-none">
          ResyFinder
        </h1>
        <p className="text-xs text-[#9ca3af] mt-1.5 font-sans">
          Manhattan · available reservations
        </p>
      </div>

      {/* Filters */}
      <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">

        <Section title="Date">
          <input
            type="date"
            min={todayISO()}
            value={filters.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="w-full text-sm font-sans border border-[#e8e4df] rounded-lg px-3 py-2.5 bg-[#faf9f6] focus:outline-none focus:ring-1 focus:ring-[#0e1c3d] focus:border-[#0e1c3d] transition-colors text-[#1a1a2e]"
          />
        </Section>

        <Section title="Time window">
          <TimeSlider
            value={[filters.time_start, filters.time_end]}
            onChange={([s, e]) => onChange({ time_start: s, time_end: e })}
          />
        </Section>

        <Section title="Party size">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onChange({ party_size: Math.max(1, filters.party_size - 1) })}
              className="w-8 h-8 rounded-full border border-[#e8e4df] text-[#6b7280] text-base flex items-center justify-center hover:border-[#0e1c3d] hover:text-[#0e1c3d] transition-colors"
            >
              −
            </button>
            <span className="text-sm font-semibold font-sans text-[#1a1a2e] w-4 text-center">
              {filters.party_size}
            </span>
            <button
              type="button"
              onClick={() => onChange({ party_size: Math.min(10, filters.party_size + 1) })}
              className="w-8 h-8 rounded-full border border-[#e8e4df] text-[#6b7280] text-base flex items-center justify-center hover:border-[#0e1c3d] hover:text-[#0e1c3d] transition-colors"
            >
              +
            </button>
          </div>
        </Section>

        <Section title="Neighborhood">
          <NeighborhoodSelector
            neighborhoods={neighborhoods}
            selected={filters.neighborhoods}
            onChange={(v) => onChange({ neighborhoods: v })}
          />
        </Section>

        <Section title="Cuisine (up to 5)">
          <CuisineSelector
            cuisines={meta.cuisines}
            selected={filters.cuisines}
            onChange={(v) => onChange({ cuisines: v })}
          />
        </Section>

        <Section title="Vibe">
          <VibeSelector
            vibes={meta.vibes}
            selected={filters.vibe_tags}
            onChange={(v) => onChange({ vibe_tags: v })}
          />
        </Section>

        <Section title="Price">
          <div className="flex gap-1.5">
            {meta.price_options.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange({ price_range: filters.price_range === p ? null : p })}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-xs font-medium font-sans transition-all",
                  filters.price_range === p
                    ? "bg-[#0e1c3d] text-white border-[#0e1c3d]"
                    : "bg-white text-[#6b7280] border-[#e8e4df] hover:border-[#0e1c3d] hover:text-[#0e1c3d]"
                )}
              >
                {priceLabel(p)}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Min rating">
          <div className="flex gap-1.5">
            {[3.5, 4.0, 4.5, 4.8].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ min_rating: filters.min_rating === r ? null : r })}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-xs font-medium font-sans transition-all",
                  filters.min_rating === r
                    ? "bg-[#0e1c3d] text-white border-[#0e1c3d]"
                    : "bg-white text-[#6b7280] border-[#e8e4df] hover:border-[#0e1c3d] hover:text-[#0e1c3d]"
                )}
              >
                {r}+
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Search CTA */}
      <div className="px-6 py-5 border-t border-[#e8e4df]">
        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className={cn(
            "w-full py-3.5 rounded-xl text-sm font-semibold font-sans tracking-wide transition-all",
            loading
              ? "bg-[#e8e4df] text-[#9ca3af] cursor-not-allowed"
              : "bg-[#0e1c3d] text-white hover:bg-[#1a3160] active:scale-[0.98] shadow-sm"
          )}
        >
          {loading ? "Searching…" : "Find tables"}
        </button>
      </div>
    </aside>
  )
}
