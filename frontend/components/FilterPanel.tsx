"use client"

import { cn, priceLabel } from "@/lib/utils"
import { TimeSlider } from "./TimeSlider"
import { NeighborhoodSelector } from "./NeighborhoodSelector"
import { CuisineSelector } from "./CuisineSelector"
import { VibeSelector } from "./VibeSelector"
import { CalendarPicker } from "./CalendarPicker"
import { PartySizePicker } from "./PartySizePicker"
import type { FiltersMeta, SearchRequest } from "@/lib/types"

interface Props {
  filters: SearchRequest
  onChange: (f: Partial<SearchRequest>) => void
  meta: FiltersMeta
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

export function FilterPanel({ filters, onChange, meta, onSearch, loading }: Props) {
  return (
    <aside className="w-72 shrink-0 bg-white border-r border-[#e8e4df] h-screen sticky top-0 flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-6 pt-7 pb-5 border-b border-[#e8e4df]">
        <h1 className="font-serif text-2xl font-semibold text-[#1a3a6c] tracking-tight leading-none">
          iH8Resy
        </h1>
        <p className="text-xs text-[#9ca3af] mt-1.5 font-sans">
          Manhattan · available reservations
        </p>
      </div>

      {/* Filters */}
      <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">

        <Section title="Date">
          <CalendarPicker
            value={filters.date}
            onChange={(v) => onChange({ date: v })}
          />
        </Section>

        <Section title="Time window">
          <TimeSlider
            value={[filters.time_start, filters.time_end]}
            onChange={([s, e]) => onChange({ time_start: s, time_end: e })}
          />
        </Section>

        <Section title="Party size">
          <PartySizePicker
            value={filters.party_size}
            onChange={(v) => onChange({ party_size: v })}
            max={8}
          />
        </Section>

        <Section title="Neighborhood">
          <NeighborhoodSelector
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
                    ? "bg-[#1a3a6c] text-white border-[#1a3a6c]"
                    : "bg-white text-[#6b7280] border-[#e8e4df] hover:border-[#1a3a6c] hover:text-[#1a3a6c]"
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
                    ? "bg-[#1a3a6c] text-white border-[#1a3a6c]"
                    : "bg-white text-[#6b7280] border-[#e8e4df] hover:border-[#1a3a6c] hover:text-[#1a3a6c]"
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
              : "bg-[#1a3a6c] text-white hover:bg-[#2450a0] active:scale-[0.98] shadow-sm"
          )}
        >
          {loading ? "Searching…" : "Find tables"}
        </button>
      </div>
    </aside>
  )
}
