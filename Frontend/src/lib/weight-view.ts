/**
 * The weight page's view model: one pure function that turns raw entries and
 * phases into everything the page renders. Keeping it here (rather than as a
 * chain of `const`s in the component) means the derivation is testable and the
 * page is left with state and composition only.
 */
import {
  availableGranularities,
  bucketEntries,
  consistency,
  defaultGranularity,
  filterByRange,
  granularityLabel,
  rangeLabel,
  rollingAverage,
  visiblePhases,
  type ChartPoint,
  type Consistency,
  type Granularity,
  type VisiblePhase,
  type WeightRange,
} from '@/lib/weight-chart'
import {
  onTrack,
  weeksToTarget,
  type OnTrackVerdict,
  type RecentRate,
} from '@/lib/weight-projection'
import { phaseSummary, type GoalProgress, type Phase, type PhaseDirection } from '@/lib/weight-phase'
import type { WeightEntry } from '@/lib/weight'

/** Everything the weight page needs, derived in one pass. */
export type WeightView = {
  /** The active phase and how it is going, or undefined without a goal. */
  phase: Phase | undefined
  direction: PhaseDirection | undefined
  progress: GoalProgress | undefined
  rate: RecentRate | undefined
  /** On-track verdict for a dated goal, else undefined. */
  verdict: OnTrackVerdict | undefined
  /** Weeks to reach the goal at its planned rate, when there is no verdict. */
  etaWeeks: number | undefined
  /** Logging consistency over the trailing window. */
  streak: Consistency | undefined
  /** Days since the last entry, against today. */
  daysSinceLog: number | undefined

  /** Chart points for the current range and granularity. */
  points: ChartPoint[]
  granularity: Granularity
  /** Granularities the current range offers, for the picker. */
  granularities: Granularity[]
  /** Smoothed line, only when the points are daily. */
  average: ChartPoint[] | undefined
  /** Phases clipped to the visible buckets, for the chart bands. */
  bands: VisiblePhase[]
  /** Caption under the chart, e.g. "All time · weekly average · +6.6 kg". */
  chartCaption: string
}

/**
 * Derives the whole view. `granularity` is the caller's stored choice; it is
 * clamped to one the current range actually offers, and the caller is told
 * which one won so it can keep its state in step.
 */
export function summariseWeightPage(
  entries: WeightEntry[],
  phases: Phase[],
  range: WeightRange,
  granularity: Granularity,
  daysSinceLog: number | undefined
): WeightView {
  const rangedEntries = filterByRange(entries, range)
  const granularities = availableGranularities(rangedEntries, range)
  // Guard against a stored granularity the current range no longer offers.
  const activeGranularity = granularities.includes(granularity)
    ? granularity
    : granularities[0]

  const points = bucketEntries(rangedEntries, activeGranularity, range)
  const latest = entries.at(-1)
  const summary = phaseSummary(entries, phases)
  const { phase, progress, rate, direction } = summary ?? {}

  const verdict = phase ? onTrack(entries, phase) : undefined
  const etaWeeks =
    phase && !verdict && latest
      ? weeksToTarget(latest.weight, phase.targetWeight, phase.ratePercentPerWeek)
      : undefined

  const showAverage = activeGranularity === 'day'
  const rangedChange =
    points.length > 1 ? points.at(-1)!.weight - points[0].weight : undefined

  return {
    phase,
    direction,
    progress,
    rate,
    verdict,
    etaWeeks,
    streak: consistency(entries),
    daysSinceLog,

    points,
    granularity: activeGranularity,
    granularities,
    average: showAverage ? rollingAverage(rangedEntries) : undefined,
    bands: visiblePhases(
      entries,
      phases,
      points.map((p) => p.date)
    ),
    chartCaption: [
      rangeLabel(range),
      activeGranularity === 'day'
        ? null
        : `${granularityLabel(activeGranularity)} average`,
      rangedChange === undefined
        ? null
        : `${rangedChange > 0 ? '+' : ''}${rangedChange.toFixed(1)} kg`,
    ]
      .filter(Boolean)
      .join(' · '),
  }
}

/** The granularity a range should open at, for the initial state. */
export function initialGranularity(
  entries: WeightEntry[],
  range: WeightRange
): Granularity {
  return defaultGranularity(filterByRange(entries, range), range)
}
