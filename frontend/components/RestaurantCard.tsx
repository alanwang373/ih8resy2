"use client"

import { cn, priceLabel } from "@/lib/utils"
import type { Restaurant } from "@/lib/types"

interface Props {
  restaurant: Restaurant
}

function RatingPip({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <span className="flex items-center gap-1 text-xs font-sans text-[#6b7280]">
      <svg className="w-3 h-3 fill-amber-400" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  )
}

export function RestaurantCard({ restaurant: r }: Props) {
  return (
    <div className="group bg-white rounded-2xl border border-[#e8e4df] overflow-hidden hover:shadow-[0_4px_24px_rgba(14,28,61,0.08)] transition-shadow duration-200">

      {/* Hero */}
      <div className="relative h-44 bg-[#f0ede8] overflow-hidden">
        {r.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.images[0]}
            alt={r.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-20">🍽</span>
          </div>
        )}
        {/* Neighborhood pill overlay */}
        {r.neighborhood && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-sans font-medium text-[#1a3a6c] rounded-full border border-white/60">
            {r.neighborhood}
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">

        {/* Name row */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold text-[#1a3a6c] leading-tight">
            {r.name}
          </h2>
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <RatingPip rating={r.rating} />
            {r.price_range && (
              <span className="text-xs font-sans text-[#9ca3af]">{priceLabel(r.price_range)}</span>
            )}
          </div>
        </div>

        {/* Cuisine + vibe tags */}
        <div className="flex flex-wrap gap-1.5">
          {r.cuisine.map((c) => (
            <span
              key={c}
              className="px-2.5 py-0.5 bg-[#f0ede8] text-[#6b7280] rounded-full text-[11px] font-sans"
            >
              {c}
            </span>
          ))}
          {r.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="px-2.5 py-0.5 bg-white text-[#9ca3af] rounded-full text-[11px] font-sans border border-[#e8e4df]"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Address */}
        <p className="text-[11px] font-sans text-[#b0aca8]">{r.address}</p>

        {/* Divider */}
        <div className="border-t border-[#f0ede8]" />

        {/* Available times */}
        <div className="space-y-2">
          <p className="text-[10px] font-sans font-semibold tracking-[0.12em] uppercase text-[#b0aca8]">
            Available times
          </p>
          <div className="flex flex-wrap gap-2">
            {r.available_slots.map((slot, i) => {
              const slotUrl = `${r.resy_url.replace(/time_slot=[^&]*/, `time_slot=${encodeURIComponent(slot.time)}`)}`
              return (
                <a
                  key={i}
                  href={slotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-sans font-semibold border transition-all",
                    i === 0
                      ? "bg-[#1a3a6c] text-white border-[#1a3a6c] hover:bg-[#2450a0]"
                      : "bg-white text-[#1a3a6c] border-[#c8d4e8] hover:bg-[#f0f4fb]"
                  )}
                >
                  {slot.time}
                  {slot.type && (
                    <span className={cn("ml-1 font-normal", i === 0 ? "text-[#8fa8d4]" : "text-[#9ca3af]")}>
                      · {slot.type}
                    </span>
                  )}
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
