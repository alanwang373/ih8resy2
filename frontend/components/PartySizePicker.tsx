"use client"

import { cn } from "@/lib/utils"

interface Props {
  value: number
  onChange: (v: number) => void
  max?: number
}

function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.5}
      className={cn(
        "w-4 h-4 transition-all duration-100",
        active ? "text-[#1a3a6c]" : "text-[#d1cdc8]"
      )}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 9a7 7 0 1 1 14 0H3Z"
      />
    </svg>
  )
}

export function PartySizePicker({ value, onChange, max = 8 }: Props) {
  return (
    <div className="space-y-2.5">
      {/* +/- controls */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-7 h-7 rounded-full border border-[#e8e4df] text-[#6b7280] flex items-center justify-center hover:border-[#1a3a6c] hover:text-[#1a3a6c] transition-colors text-base leading-none"
        >
          −
        </button>
        <span className="text-sm font-semibold font-sans text-[#1a1a2e] w-4 text-center tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-full border border-[#e8e4df] text-[#6b7280] flex items-center justify-center hover:border-[#1a3a6c] hover:text-[#1a3a6c] transition-colors text-base leading-none"
        >
          +
        </button>
      </div>

      {/* Person icons reflecting current count */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {Array.from({ length: max }, (_, i) => (
          <PersonIcon key={i} active={i < value} />
        ))}
      </div>
    </div>
  )
}
