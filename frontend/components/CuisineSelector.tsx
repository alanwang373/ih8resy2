"use client"

import { cn } from "@/lib/utils"

interface Props {
  cuisines: string[]
  selected: string[]
  onChange: (v: string[]) => void
}

const MAX = 5

export function CuisineSelector({ cuisines, selected, onChange }: Props) {
  function toggle(c: string) {
    if (selected.includes(c)) {
      onChange(selected.filter((x) => x !== c))
    } else if (selected.length < MAX) {
      onChange([...selected, c])
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {cuisines.map((c) => {
        const active = selected.includes(c)
        const disabled = !active && selected.length >= MAX
        return (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => toggle(c)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-sans font-medium border transition-all",
              active
                ? "bg-[#1a3a6c] text-white border-[#1a3a6c]"
                : disabled
                ? "bg-[#faf9f6] text-[#d1cdc8] border-[#e8e4df] cursor-not-allowed"
                : "bg-white text-[#6b7280] border-[#e8e4df] hover:border-[#1a3a6c] hover:text-[#1a3a6c]"
            )}
          >
            {c}
          </button>
        )
      })}
    </div>
  )
}
