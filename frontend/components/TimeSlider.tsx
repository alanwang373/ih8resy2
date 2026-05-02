"use client"

import * as Slider from "@radix-ui/react-slider"
import { formatHour } from "@/lib/utils"

// Range: 9:00 AM (9.0) → 11:30 PM (23.5), 30-min steps
const MIN = 9
const MAX = 23.5
const STEP = 0.5

interface Props {
  value: [number, number]
  onChange: (v: [number, number]) => void
}

export function TimeSlider({ value, onChange }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-sm font-sans font-medium text-[#1a1a2e]">
        <span>{formatHour(value[0])}</span>
        <span className="text-[#9ca3af] text-xs self-center">→</span>
        <span>{formatHour(value[1])}</span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        min={MIN}
        max={MAX}
        step={STEP}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
      >
        <Slider.Track className="bg-[#e8e4df] relative grow rounded-full h-1">
          <Slider.Range className="absolute bg-[#1a3a6c] rounded-full h-full" />
        </Slider.Track>
        {value.map((_, i) => (
          <Slider.Thumb
            key={i}
            className="block w-4 h-4 bg-white border-2 border-[#1a3a6c] rounded-full shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#1a3a6c]/20 cursor-pointer transition-shadow"
          />
        ))}
      </Slider.Root>
      <p className="text-[10px] font-sans text-[#b0aca8]">
        Showing slots from {formatHour(value[0])} onwards
      </p>
    </div>
  )
}
