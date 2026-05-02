"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface Props {
  value: string        // YYYY-MM-DD
  onChange: (v: string) => void
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export function CalendarPicker({ value, onChange }: Props) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Build 3 weeks of dates starting from today
  const weeks = useMemo(() => {
    const allDays: Date[] = []
    // Start from Sunday of the week containing today
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay())

    for (let i = 0; i < 28; i++) {  // 4 rows to always show 3 full weeks ahead
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      allDays.push(d)
    }

    // chunk into rows of 7
    const rows: Date[][] = []
    for (let i = 0; i < allDays.length; i += 7) {
      rows.push(allDays.slice(i, i + 7))
    }
    return rows
  }, [today])

  const selectedDate = value ? new Date(value + "T00:00:00") : null

  function toISO(d: Date) {
    return d.toISOString().split("T")[0]
  }

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
  }

  // Find month transitions for headers
  const firstDayOfEachWeek = weeks.map(w => w[0])

  return (
    <div className="select-none">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-sans font-semibold text-[#b0aca8] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => {
        // Show month label if first day of week is 1st of month OR it's the first row
        const firstOfWeek = week[0]
        const showMonthLabel = firstOfWeek.getDate() <= 7 || wi === 0

        return (
          <div key={wi}>
            {showMonthLabel && (
              <div className="text-[10px] font-sans font-medium text-[#9ca3af] tracking-wide mt-2 mb-0.5 pl-0.5">
                {MONTH_NAMES[firstOfWeek.getMonth()]} {firstOfWeek.getFullYear()}
              </div>
            )}
            <div className="grid grid-cols-7 gap-0.5 mb-0.5">
              {week.map((day, di) => {
                const isPast = day < today
                const isToday = isSameDay(day, today)
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                const isFri = day.getDay() === 5
                const isSat = day.getDay() === 6

                return (
                  <button
                    key={di}
                    type="button"
                    disabled={isPast}
                    onClick={() => !isPast && onChange(toISO(day))}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-lg py-1.5 text-[11px] font-sans transition-all",
                      isPast
                        ? "text-[#d1cdc8] cursor-not-allowed"
                        : isSelected
                        ? "bg-[#1a3a6c] text-white font-semibold"
                        : isToday
                        ? "bg-[#e8eef7] text-[#1a3a6c] font-semibold ring-1 ring-[#1a3a6c]/30"
                        : (isFri || isSat)
                        ? "text-[#1a3a6c] hover:bg-[#e8eef7] font-medium"
                        : "text-[#4b5563] hover:bg-[#f5f5f2]"
                    )}
                  >
                    <span className="text-[10px] font-medium leading-none mb-0.5 opacity-60">
                      {!isPast || isToday ? DAYS[day.getDay()].charAt(0) : ""}
                    </span>
                    <span className="text-sm font-semibold leading-none">
                      {day.getDate()}
                    </span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#1a3a6c]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
