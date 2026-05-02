"use client"

import { cn } from "@/lib/utils"

interface Props {
  vibes: Record<string, string[]>
  selected: string[]
  onChange: (v: string[]) => void
}

export function VibeSelector({ vibes, selected, onChange }: Props) {
  function toggle(tag: string) {
    onChange(selected.includes(tag) ? selected.filter((x) => x !== tag) : [...selected, tag])
  }

  return (
    <div className="space-y-3">
      {Object.entries(vibes).map(([category, tags]) => (
        <div key={category}>
          <p className="text-[10px] font-sans font-semibold text-[#b0aca8] uppercase tracking-[0.12em] mb-1.5">
            {category}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-sans font-medium border transition-all",
                  selected.includes(tag)
                    ? "bg-[#0e1c3d] text-white border-[#0e1c3d]"
                    : "bg-white text-[#6b7280] border-[#e8e4df] hover:border-[#0e1c3d] hover:text-[#0e1c3d]"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
