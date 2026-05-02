"use client"

import * as Slider from "@radix-ui/react-slider"
import { formatHour } from "@/lib/utils"

interface Props {
  value: [number, number]
  onChange: (v: [number, number]) => void
}

export function TimeSlider({ value, onChange }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-sm font-sans font-medium text-[#1a1a2e]">
        <span>{formatHour(value[0])}</span>
        <span>{formatHour(value[1])}</span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        min={0}
        max={23}
        step={1}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
      >
        <Slider.Track className="bg-[#e8e4df] relative grow rounded-full h-1">
          <Slider.Range className="absolute bg-[#0e1c3d] rounded-full h-full" />
        </Slider.Track>
        {value.map((_, i) => (
          <Slider.Thumb
            key={i}
            className="block w-4 h-4 bg-white border-2 border-[#0e1c3d] rounded-full shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#0e1c3d]/20 cursor-pointer transition-shadow"
          />
        ))}
      </Slider.Root>
    </div>
  )
}
