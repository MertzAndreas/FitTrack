/**
 * Charting for weight over time: the visible range, how points are bucketed,
 * and the trend line. How entries group under phases lives in `weight-phase.ts`.
 */
import {
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'
import { formatDay, parseDay } from '@/lib/weight-dates'
import { mean, type WeightEntry } from '@/lib/weight'

/** A start/end window for the chart, in ISO dates (inclusive). */
export type DateRange = { from: string; to: string }

/** Preset windows for the chart, plus a custom range. */
export type WeightRange = 'week' | 'month' | '3month' | 'all' | DateRange

export const rangePresets: {
  value: 'week' | 'month' | '3month' | 'all'
  label: string
}[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '3month', label: '3M' },
  { value: 'all', label: 'All' },
]

/** Days covered by each preset window. */
const PRESET_DAYS: Record<'week' | 'month' | '3month', number> = {
  week: 7,
  month: 30,
  '3month': 90,
}

/**
 * Filters entries to the selected window. Presets are relative to the most
 * recent entry rather than today, so the mock data stays in view regardless of
 * the current date.
 */
export function filterByRange(
  entries: WeightEntry[],
  range: WeightRange
): WeightEntry[] {
  if (entries.length === 0) return []

  if (range === 'all') return entries

  const { from, to } =
    typeof range === 'object'
      ? range
      : {
          from: formatDay(subDays(parseDay(entries.at(-1)!.date), PRESET_DAYS[range])),
          to: entries.at(-1)!.date,
        }

  return entries.filter((e) => e.date >= from && e.date <= to)
}

/** A short label for the active range, for the chart caption. */
export function rangeLabel(range: WeightRange): string {
  if (range === 'all') return 'All time'
  if (typeof range === 'object') {
    const fmt = (iso: string) =>
      parseDay(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    return `${fmt(range.from)} – ${fmt(range.to)}`
  }
  return rangePresets.find((p) => p.value === range)?.label ?? ''
}

/** How points are grouped on the chart. */
export type Granularity = 'day' | 'week' | 'month'

export const granularityLabels: Record<Granularity, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
}

/** Days each granularity's bucket covers. Used to size custom-range buckets. */
const GRANULARITY_DAYS: Record<Granularity, number> = {
  day: 1,
  week: 7,
  month: 30,
}

/** Day count covered by the given entries, inclusive of both ends. */
function spanDays(entries: WeightEntry[]): number {
  if (entries.length < 2) return 1
  const first = parseDay(entries[0].date).getTime()
  const last = parseDay(entries.at(-1)!.date).getTime()
  return Math.round((last - first) / 86_400_000) + 1
}

/** Spans longer than this (~9 months) open at monthly buckets by default. */
const MONTHLY_SPAN_DAYS = 280

/**
 * Which granularities to offer for the visible entries, and which to open on.
 * Short ranges are fixed; longer ones start weekly and step up to monthly once
 * the window is long enough that weekly buckets would pile up. Ordered finest
 * first.
 */
export function granularitiesFor(
  entries: WeightEntry[],
  range: WeightRange
): { offered: Granularity[]; initial: Granularity } {
  if (range === 'week') return { offered: ['day'], initial: 'day' }
  if (range === 'month') return { offered: ['day', 'week'], initial: 'day' }
  const initial = spanDays(entries) > MONTHLY_SPAN_DAYS ? 'month' : 'week'
  return { offered: ['day', 'week', 'month'], initial }
}

/** One rendered point: the mean of the entries in its bucket. */
export type ChartPoint = {
  /** Bucket start date, ISO. Used as the chart's category key. */
  date: string
  weight: number
  /** Number of entries averaged into this point. */
  count: number
}

/** The start of the calendar bucket a date falls in. */
function calendarBucket(iso: string, granularity: Granularity): string {
  if (granularity === 'day') return iso
  const date = parseDay(iso)
  if (granularity === 'week') return formatDay(startOfWeek(date, { weekStartsOn: 1 }))
  return formatDay(startOfMonth(date))
}

/**
 * The start of the bucket a date falls in, counted from `anchor` rather than a
 * calendar boundary. Custom ranges use this so their first bucket begins on the
 * range's own start date instead of the surrounding Monday or 1st.
 */
function anchoredBucket(
  iso: string,
  granularity: Granularity,
  anchor: string
): string {
  if (granularity === 'day') return iso
  const start = parseDay(anchor)
  const days = Math.floor(
    (parseDay(iso).getTime() - start.getTime()) / 86_400_000
  )
  const size = GRANULARITY_DAYS[granularity]
  const offset = Math.floor(days / size) * size
  const bucket = new Date(start)
  bucket.setDate(bucket.getDate() + offset)
  return formatDay(bucket)
}

/** Resolves an entry's date to the date its bucket starts on. */
function bucketKey(
  iso: string,
  granularity: Granularity,
  anchor?: string
): string {
  return anchor
    ? anchoredBucket(iso, granularity, anchor)
    : calendarBucket(iso, granularity)
}/**
 * Averages entries into buckets of the given granularity, oldest first. On
 * `day` this is a straight pass-through (each point has count 1). Custom
 * ranges bucket from their own start; presets use calendar boundaries.
 */
export function bucketEntries(
  entries: WeightEntry[],
  granularity: Granularity,
  range: WeightRange
): ChartPoint[] {
  if (entries.length === 0) return []

  const anchor =
    granularity !== 'day' && typeof range === 'object' ? range.from : undefined

  const buckets = new Map<string, number[]>()
  for (const entry of entries) {
    const key = bucketKey(entry.date, granularity, anchor)
    const weights = buckets.get(key)
    if (weights) weights.push(entry.weight)
    else buckets.set(key, [entry.weight])
  }

  return [...buckets.entries()]
    .map(([date, weights]) => ({ date, weight: mean(weights), count: weights.length }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** A short label for the active granularity, for the chart caption. */
export function granularityLabel(granularity: Granularity): string {
  return granularity === 'day' ? 'daily' : `${granularity}ly`
}

/**
 * A 7-day rolling mean over the entries, for a smoothed line drawn alongside
 * the raw points. Each output point keeps the real date; `count` is how many
 * entries fell within its trailing week.
 */
export function rollingAverage(
  entries: WeightEntry[],
  windowDays = 7
): ChartPoint[] {
  return entries.map((entry) => {
    const end = parseDay(entry.date).getTime()
    const start = end - (windowDays - 1) * 86_400_000
    const inWindow = entries.filter((e) => {
      const t = parseDay(e.date).getTime()
      return t >= start && t <= end
    })
    return {
      date: entry.date,
      weight: mean(inWindow.map((e) => e.weight)),
      count: inWindow.length,
    }
  })
}

/** How consistently entries have been logged over a recent window. */
export type Consistency = {
  /** Days in the window being considered. */
  days: number
  /** Distinct days with an entry inside the window. */
  logged: number
  /** logged / (days / 7), i.e. entries per week across the window. */
  perWeek: number
}

/**
 * Counts distinct logged days in the trailing window ending at the latest
 * entry. Anchored to the data, not today, so the mock stays meaningful.
 */
export function consistency(
  entries: WeightEntry[],
  days = 28
): Consistency | undefined {
  if (entries.length === 0) return undefined

  const end = parseDay(entries.at(-1)!.date)
  const start = end.getTime() - (days - 1) * 86_400_000

  const logged = new Set(
    entries
      .filter((e) => {
        const t = parseDay(e.date).getTime()
        return t >= start && t <= end.getTime()
      })
      .map((e) => e.date)
  ).size

  return { days, logged, perWeek: (logged / days) * 7 }
}
