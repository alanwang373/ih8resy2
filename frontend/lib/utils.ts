import { clsx } from "clsx"

export function cn(...classes: Array<string | false | null | undefined>) {
  return clsx(classes)
}

export function todayISO(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatHour(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24
  const suffix = normalized >= 12 ? "PM" : "AM"
  const hr12 = normalized % 12 === 0 ? 12 : normalized % 12
  return `${hr12}:00 ${suffix}`
}

export function priceLabel(level: number): string {
  const clamped = Math.min(4, Math.max(1, level))
  return "$".repeat(clamped)
}
