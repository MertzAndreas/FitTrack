/**
 * Charting for weight over time: the visible range, how points are bucketed,
 * the trend line, and how entries group under goals.
 */
import {
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from 'date-fns'
import { formatDay, parseDay } from '@/lib/weight-dates'
import { mean, type WeightEntry } from '@/lib/weight'
import {
  activePhase,
  phaseDirection,
  phaseEnd,
  type Phase,
  type PhaseDirection,
} from '@/lib/weight-phase'

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
export type Granularity = 'day' | 'week' | 'month' | 'year'

export const granularityLabels: Record<Granularity, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
}

/** Rough span, in days, each granularity should cover on screen. */
const GRANULARITY_DAYS: Record<Granularity, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
}

/** Day count covered by the given entries, inclusive of both ends. */
export function spanDays(entries: WeightEntry[]): number {
  if (entries.length < 2) return 1
  const first = parseDay(entries[0].date).getTime()
  const last = parseDay(entries.at(-1)!.date).getTime()
  return Math.round((last - first) / 86_400_000) + 1
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
  // Fixed short ranges keep a tight, opinionated set.
  if (range === 'week') return ['day']
  if (range === 'month') return ['day', 'week']

  // 3M / All / Custom scale with the span of the window: monthly buckets once
  // the window is long enough to make them useful, yearly beyond two years.
  const all: Granularity[] = ['day', 'week', 'month', 'year']
  const max: Granularity = spanDays(entries) <= 730 ? 'month' : 'year'
  return all.slice(0, all.indexOf(max) + 1)
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
  return (
    available.find((g) => span / GRANULARITY_DAYS[g] <= MAX_BUCKETS[g]) ??
    available.at(-1)!
  )
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
  if (granularity === 'month') return formatDay(startOfMonth(date))
  return formatDay(startOfYear(date))
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

/** The entries falling inside a phase's window, inclusive. */
export function entriesInPhase(
  entries: WeightEntry[],
  phases: Phase[],
  phase: Phase
): WeightEntry[] {
  const end = phaseEnd(phases, phase, entries)
  if (end === undefined) return []
  return entries.filter((e) => e.date >= phase.startDate && e.date <= end)
}

/** A run of entries belonging to one phase, or to none. */
export type EntryGroup = {
  /** The phase these entries fall under, or undefined before the first one. */
  phase?: Phase
  entries: WeightEntry[]
}

/**
 * Splits entries into groups by phase, oldest group first. Each entry belongs
 * to the phase active on its date, so overlapping or back-filled phases are
 * resolved the same way the header resolves them — the latest phase that has
 * started wins. Entries before any phase fall into a leading phase-less group.
 */
export function groupEntriesByPhase(
  entries: WeightEntry[],
  phases: Phase[]
): EntryGroup[] {
  if (entries.length === 0) return []

  const groups: EntryGroup[] = []
  for (const entry of entries) {
    const phase = activePhase(phases, entry.date)
    const last = groups.at(-1)
    // Extend the current group when it's the same phase, else start a new one.
    if (last && last.phase?.id === phase?.id) last.entries.push(entry)
    else groups.push({ phase, entries: [entry] })
  }

  return groups
}

/** A phase clipped to a visible window, ready for the chart to draw. */
export type VisiblePhase = {
  direction: PhaseDirection
  startDate: string
  endDate: string
  targetWeight: number
}

/**
 * The phases overlapping a visible window, clipped to the *categories actually
 * on the chart* — the bucket dates — rather than raw phase dates. A categorical
 * axis can only reference points it renders, so a phase boundary that falls on
 * a day with no bucket (e.g. mid-week on a weekly view) snaps to the nearest
 * bucket inside it. Phases with no bucket in the window are dropped.
 */
export function visiblePhases(
  entries: WeightEntry[],
  phases: Phase[],
  categories: string[]
): VisiblePhase[] {
  if (categories.length === 0) return []
  const from = categories[0]
  const to = categories.at(-1)!

  return phases.flatMap((phase) => {
    const end = phaseEnd(phases, phase, entries)
    if (end === undefined) return []

    // Snap to buckets whose date lies inside the phase and the window.
    const inWindow = categories.filter(
      (c) => c >= phase.startDate && c <= end && c >= from && c <= to
    )
    if (inWindow.length === 0) return []

    return [
      {
        direction: phaseDirection(entries, phase),
        startDate: inWindow[0],
        endDate: inWindow.at(-1)!,
        targetWeight: phase.targetWeight,
      },
    ]
  })
}
