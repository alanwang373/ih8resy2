"use client"

import { cn } from "@/lib/utils"

interface Props {
  neighborhoods: string[]
  selected: string[]
  onChange: (v: string[]) => void
}

export function NeighborhoodSelector({ neighborhoods, selected, onChange }: Props) {
  function toggle(n: string) {
    onChange(selected.includes(n) ? selected.filter((x) => x !== n) : [...selected, n])
  }

  function toggleAll() {
    onChange(selected.length === neighborhoods.length ? [] : [...neighborhoods])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={toggleAll}
          className="text-[11px] font-sans text-[#9ca3af] hover:text-[#0e1c3d] underline transition-colors"
        >
          {selected.length === neighborhoods.length ? "Clear all" : "Select all"}
        </button>
        <span className="text-[11px] font-sans text-[#9ca3af]">{selected.length} selected</span>
      </div>
      <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-0.5">
        {neighborhoods.map((n) => (
          <label
            key={n}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-sans cursor-pointer select-none transition-colors",
              selected.includes(n)
                ? "bg-[#0e1c3d] text-white"
                : "bg-[#faf9f6] text-[#6b7280] hover:bg-[#f0ede8]"
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selected.includes(n)}
              onChange={() => toggle(n)}
            />
            {n}
          </label>
        ))}
      </div>
    </div>
  )
}
