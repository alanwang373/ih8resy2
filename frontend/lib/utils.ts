import { clsx } from "clsx"
import type { ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function priceLabel(price: number): string {
  return "$".repeat(price)
}

export function formatHour(h: number): string {
  const hh = Math.floor(h)
  const mm = h % 1 === 0.5 ? "30" : "00"
  const period = hh >= 12 ? "pm" : "am"
  const display = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh
  return `${display}:${mm}${period}`
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}
