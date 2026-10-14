/**
 * Charting for weight over time: the visible range, how points are bucketed,
 * and the trend statistics drawn alongside them.
 */
import { mean, toIso, type WeightEntry } from '@/lib/weight'

/** Custom start/end window for the chart, in ISO dates (inclusive). */
export type DateRange = { from: string; to: string }

/** Preset windows for the chart, plus a custom range. */
export type WeightRange =
  | 'week'
  | 'month'
  | '3month'
  | 'all'
  | DateRange

export const rangePresets: { value: 'week' | 'month' | '3month' | 'all'; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '3month', label: '3M' },
  { value: 'all', label: 'All' },
]

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

  let from: string
  let to: string

  if (typeof range === 'object') {
    from = range.from
    to = range.to
  } else if (range === 'all') {
    return entries
  } else {
    const last = entries.at(-1)!.date
    const end = new Date(`${last}T00:00:00`)
    end.setDate(end.getDate() - PRESET_DAYS[range])
    from = toIso(end)
    to = last
  }

  return entries.filter((e) => e.date >= from && e.date <= to)
}

/** A short label for the active range, for the chart caption. */
export function rangeLabel(range: WeightRange): string {
  if (typeof range === 'object') {
    const fmt = (iso: string) =>
      new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      })
    return `${fmt(range.from)} – ${fmt(range.to)}`
  }
  if (range === 'all') return 'All time'
  return rangePresets.find((p) => p.value === range)?.label ?? ''
}

/** How points are grouped on the chart. */
export type Granularity = 'day' | 'week' | 'month' | 'year'

export const granularityLabels: Record<Granularity, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
}

/** Rough span, in days, of the data a granularity should cover on screen. */
const GRANULARITY_DAYS: Record<Granularity, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
}

/**
 * The granularities worth offering for the currently visible entries. A range
 * only exposes buckets that would actually merge points: no "Month" for a week
 * of data. Ordered finest first.
 */
export function availableGranularities(
  entries: WeightEntry[],
  range: WeightRange
): Granularity[] {
  const all: Granularity[] = ['day', 'week', 'month', 'year']

  // Fixed short ranges keep a tight, opinionated set.
  if (range === 'week') return ['day']
  if (range === 'month') return ['day', 'week']

  // 3M / All / Custom scale with the span of the window: monthly buckets once
  // the window is long enough to make them useful, yearly beyond two years.
  const span = spanDays(entries)
  const max: Granularity = span <= 730 ? 'month' : 'year'
  return all.slice(0, all.indexOf(max) + 1)
}

/** Day count covered by the given entries, inclusive of both ends. */
export function spanDays(entries: WeightEntry[]): number {
  if (entries.length < 2) return 1
  const first = new Date(`${entries[0].date}T00:00:00`).getTime()
  const last = new Date(`${entries.at(-1)!.date}T00:00:00`).getTime()
  return Math.round((last - first) / 86_400_000) + 1
}

/**
 * The most buckets each granularity should produce before it stops being
 * readable on a phone-width chart. Coarser buckets tolerate more of them.
 */
const MAX_BUCKETS: Record<Granularity, number> = {
  day: 45,
  week: 40,
  month: 60,
  year: 12,
}

/**
 * Picks the granularity to show by default: fine enough to stay honest, coarse
 * enough that points don't pile up. Takes the finest option that fits its own
 * bucket budget, so a multi-year span lands on months rather than a handful of
 * yearly points.
 */
export function defaultGranularity(
  entries: WeightEntry[],
  range: WeightRange
): Granularity {
  const available = availableGranularities(entries, range)
  if (available.length === 1) return available[0]

  const span = spanDays(entries)
  const pick = available.find(
    (g) => span / GRANULARITY_DAYS[g] <= MAX_BUCKETS[g]
  )

  return pick ?? available.at(-1)!
}

/** One rendered point: the mean of the entries in its bucket. */
export type ChartPoint = {
  /** Bucket start date, ISO. Used as the chart's category key. */
  date: string
  weight: number
  /** Number of entries averaged into this point. */
  count: number
}

/**
 * The ISO date the bucket containing the given date starts on. `day` is the
 * date itself; the others align to Monday for weeks and the 1st for months and
 * years. `anchor` shifts non-day buckets to count from a given start instead
 * of a calendar boundary, which custom ranges use.
 */
function bucketKey(iso: string, granularity: Granularity, anchor?: string): string {
  if (granularity === 'day') return iso

  const date = new Date(`${iso}T00:00:00`)

  if (anchor) {
    // Offset from the anchor, rounded down to whole buckets.
    const start = new Date(`${anchor}T00:00:00`)
    const days = Math.floor(
      (date.getTime() - start.getTime()) / 86_400_000
    )
    const size =
      granularity === 'week'
        ? 7
        : granularity === 'month'
          ? 30
          : 365
    const offset = Math.floor(days / size) * size
    const bucket = new Date(start)
    bucket.setDate(bucket.getDate() + offset)
    return toIso(bucket)
  }

  if (granularity === 'week') {
    // Monday-based.
    const monday = new Date(date)
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    return toIso(monday)
  }

  if (granularity === 'month') {
    return toIso(new Date(date.getFullYear(), date.getMonth(), 1))
  }

  return toIso(new Date(date.getFullYear(), 0, 1))
}

/**
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
    const group = buckets.get(key)
    if (group) group.push(entry.weight)
    else buckets.set(key, [entry.weight])
  }

  return [...buckets.entries()]
    .map(([date, weights]) => ({
      date,
      weight: mean(weights),
      count: weights.length,
    }))
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
    const end = new Date(`${entry.date}T00:00:00`).getTime()
    const start = end - (windowDays - 1) * 86_400_000
    const inWindow = entries.filter((e) => {
      const t = new Date(`${e.date}T00:00:00`).getTime()
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

  const end = new Date(`${entries.at(-1)!.date}T00:00:00`)
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))

  const logged = new Set(
    entries
      .filter((e) => {
        const t = new Date(`${e.date}T00:00:00`)
        return t >= start && t <= end
      })
      .map((e) => e.date)
  ).size

  return { days, logged, perWeek: (logged / days) * 7 }
}
