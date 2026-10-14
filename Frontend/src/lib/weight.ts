/**
 * Weight entries and the small primitives every weight feature shares. Charts
 * live in `weight-chart.ts`, goals and phases in `weight-goals.ts`.
 */

/** Body measurements, all optional and independent. Values in centimetres. */
export type Measurements = {
  waist?: number
  chest?: number
  hips?: number
  arm?: number
  thigh?: number
}

/** One weight entry per day. Photos are in-memory previews (object URLs). */
export type WeightEntry = {
  id: string
  /** ISO date (YYYY-MM-DD). Unique across entries. */
  date: string
  weight: number
  measurements: Measurements
  /** Object URLs for locally picked photos. Not persisted. */
  photos: string[]
}

/** A single photo preview carried through the add/edit sheets. */
export type PhotoDraft = {
  id: string
  /** Object URL created from the picked file. */
  url: string
  name: string
}

let counter = 0
export function newId(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}

/** The measurement fields shown in the form, in display order. */
export const measurementFields: {
  key: keyof Measurements
  label: string
  unit: string
}[] = [
  { key: 'waist', label: 'Waist', unit: 'cm' },
  { key: 'chest', label: 'Chest', unit: 'cm' },
  { key: 'hips', label: 'Hips', unit: 'cm' },
  { key: 'arm', label: 'Arm', unit: 'cm' },
  { key: 'thigh', label: 'Thigh', unit: 'cm' },
]

export const isoToday = () => toIso(new Date())

export function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

/** Sorts oldest-first, which is the order the chart and list expect. */
export function sortEntries(entries: WeightEntry[]): WeightEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date))
}

/** Inserts or replaces the entry for its date, keeping the list sorted. */
export function upsertEntry(
  entries: WeightEntry[],
  entry: WeightEntry
): WeightEntry[] {
  const without = entries.filter((e) => e.date !== entry.date)
  return sortEntries([...without, entry])
}

/** The arithmetic mean of a list of numbers. */
export const mean = (values: number[]) =>
  values.reduce((sum, v) => sum + v, 0) / values.length

/** Whole days between two ISO dates, later minus earlier. */
export function daysBetween(fromIso: string, toIsoDate: string): number {
  const from = new Date(`${fromIso}T00:00:00`).getTime()
  const to = new Date(`${toIsoDate}T00:00:00`).getTime()
  return Math.round((to - from) / 86_400_000)
}

/**
 * Days since the most recent entry, counted from a reference date. Anchored to
 * a caller-supplied "today" rather than `new Date()`, so mock data dated in the
 * past does not read as months of silence.
 */
export function daysSinceLastEntry(
  entries: WeightEntry[],
  today: string
): number | undefined {
  const last = entries.at(-1)
  if (!last) return undefined
  return Math.max(0, daysBetween(last.date, today))
}
