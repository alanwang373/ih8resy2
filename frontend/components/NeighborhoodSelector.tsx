"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { NEIGHBORHOOD_GROUPS, ALL_NEIGHBORHOODS } from "@/lib/neighborhoods"

interface Props {
  selected: string[]
  onChange: (v: string[]) => void
}

export function NeighborhoodSelector({ selected, onChange }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  function toggleNeighborhood(n: string) {
    onChange(selected.includes(n) ? selected.filter((x) => x !== n) : [...selected, n])
  }

  function toggleGroup(neighborhoods: string[]) {
    const allSelected = neighborhoods.every((n) => selected.includes(n))
    if (allSelected) {
      onChange(selected.filter((n) => !neighborhoods.includes(n)))
    } else {
      const toAdd = neighborhoods.filter((n) => !selected.includes(n))
      onChange([...selected, ...toAdd])
    }
  }

  function toggleAll() {
    if (selected.length === ALL_NEIGHBORHOODS.length) {
      onChange([])
    } else {
      onChange([...ALL_NEIGHBORHOODS])
    }
  }

  function toggleExpanded(label: string) {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={toggleAll}
          className="text-[10px] font-sans text-[#9ca3af] hover:text-[#1a3a6c] underline transition-colors"
        >
          {selected.length === ALL_NEIGHBORHOODS.length ? "Clear all" : "Select all"}
        </button>
        {selected.length > 0 && (
          <span className="text-[10px] font-sans text-[#9ca3af]">{selected.length} selected</span>
        )}
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
        {NEIGHBORHOOD_GROUPS.map(({ label, neighborhoods }) => {
          const isOpen = expanded[label] ?? false
          const groupSelected = neighborhoods.filter((n) => selected.includes(n)).length
          const allGroupSelected = groupSelected === neighborhoods.length

          return (
            <div key={label} className="rounded-lg border border-[#e8e4df] overflow-hidden">
              <div className="flex items-center justify-between px-2.5 py-2 bg-[#faf9f6]">
                <button
                  type="button"
                  onClick={() => toggleGroup(neighborhoods)}
                  className={cn(
                    "text-[10px] font-sans font-semibold tracking-[0.08em] uppercase transition-colors flex items-center gap-1.5",
                    allGroupSelected ? "text-[#1a3a6c]" : "text-[#9ca3af] hover:text-[#4b5563]"
                  )}
                >
                  {label}
                  {groupSelected > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[9px] font-semibold",
                      allGroupSelected ? "bg-[#1a3a6c] text-white" : "bg-[#e8eef7] text-[#1a3a6c]"
                    )}>
                      {groupSelected}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleExpanded(label)}
                  className="text-[#b0aca8] hover:text-[#6b7280] transition-colors p-0.5"
                >
                  <svg className={cn("w-3 h-3 transition-transform duration-150", isOpen && "rotate-180")} viewBox="0 0 12 12" fill="none">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {isOpen && (
                <div className="px-2.5 pb-2.5 pt-1.5 bg-white flex flex-wrap gap-1">
                  {neighborhoods.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleNeighborhood(n)}
                      className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-sans transition-all border",
                        selected.includes(n)
                          ? "bg-[#1a3a6c] text-white border-[#1a3a6c]"
                          : "bg-[#faf9f6] text-[#6b7280] border-[#e8e4df] hover:border-[#1a3a6c] hover:text-[#1a3a6c]"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
