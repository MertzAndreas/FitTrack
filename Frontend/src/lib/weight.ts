/**
 * Weight entries and the primitives shared across the weight feature.
 *
 * Date handling lives in `weight-dates.ts`, charting in `weight-chart.ts`, and
 * goals in `weight-phase.ts` / `weight-projection.ts`.
 */
import { daysBetween } from '@/lib/weight-dates'

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

/**
 * Days since the most recent entry, counted from a reference date. Anchored to
 * a caller-supplied "today" rather than `new Date()`, so mock data dated in the
 * past does not read as months of silence.
 */
export function daysSinceLastEntry(
  entries: WeightEntry[],
  from: string
): number | undefined {
  const last = entries.at(-1)
  if (!last) return undefined
  return Math.max(0, daysBetween(last.date, from))
}
