/**
 * Trend and forecast maths for weight goals: how fast things are moving, and
 * where they are heading. Pure numbers — no entries, no phases, no dates beyond
 * the ISO strings it is handed.
 */
import { parseDay, subDaysIso } from '@/lib/weight-dates'
import { mean, type WeightEntry } from '@/lib/weight'
import type { Phase } from '@/lib/weight-phase'

/**
 * The recent trend, as this week's average against last week's, in kg/week.
 *
 * A week-versus-week comparison rather than a slope: a slope over a window
 * answers "the average direction across it", so a fresh change is diluted by
 * everything before it. Comparing two adjacent means answers "is this week
 * different from last?", which is what a headline number should say.
 */
export type RecentRate = {
  /** This week's mean minus last week's, in kg (equal to kg/week). */
  delta: number
  /** Entries contributing to this week's mean. */
  recentCount: number
  /** Entries contributing to last week's mean. */
  previousCount: number
  /** Days per window. */
  windowDays: number
}

/** Days in each side of the comparison. */
export const RATE_WINDOW_DAYS = 7

/**
 * Compares the last `windowDays` of entries against the `windowDays` before
 * that. Anchored to the latest entry, not today, so stale data still reads
 * sensibly. Undefined unless both windows have at least one entry.
 */
export function recentRate(
  entries: WeightEntry[],
  windowDays = RATE_WINDOW_DAYS
): RecentRate | undefined {
  const latest = entries.at(-1)
  if (!latest) return undefined

  const recentStart = subDaysIso(latest.date, windowDays - 1)
  const previousStart = subDaysIso(latest.date, windowDays * 2 - 1)

  const recent = entries.filter((e) => e.date >= recentStart)
  const previous = entries.filter(
    (e) => e.date >= previousStart && e.date < recentStart
  )
  if (recent.length === 0 || previous.length === 0) return undefined

  return {
    delta:
      mean(recent.map((e) => e.weight)) - mean(previous.map((e) => e.weight)),
    recentCount: recent.length,
    previousCount: previous.length,
    windowDays,
  }
}

/**
 * Where the weight lands after `weeks` at a compound percent-per-week rate.
 * Compounding is the point: losing 1% of a lighter body is fewer kg, which is
 * how weight actually comes off.
 */
export function projectWeight(
  currentKg: number,
  ratePercentPerWeek: number,
  weeks: number
): number {
  return currentKg * (1 + ratePercentPerWeek / 100) ** weeks
}

/** The longest projection we will simulate, in weeks (~10 years). */
const MAX_PROJECTION_WEEKS = 520

/**
 * Weeks until the weight reaches `targetKg` at the given percent-per-week rate,
 * or undefined when it never does. Simulated week by week because a compound
 * rate has no closed-form week count. Direction-aware: a cut needs a negative
 * rate, a bulk a positive one; a rate heading the wrong way returns undefined
 * rather than a nonsense number.
 */
export function weeksToTarget(
  currentKg: number,
  targetKg: number,
  ratePercentPerWeek: number
): number | undefined {
  const gap = targetKg - currentKg
  if (gap === 0) return 0
  if (Math.abs(ratePercentPerWeek) < 0.01) return undefined
  if (Math.sign(gap) !== Math.sign(ratePercentPerWeek)) return undefined

  let weight = currentKg
  for (let week = 1; week <= MAX_PROJECTION_WEEKS; week++) {
    weight = projectWeight(weight, ratePercentPerWeek, 1)
    if (ratePercentPerWeek < 0 ? weight <= targetKg : weight >= targetKg) {
      return week
    }
  }
  return undefined
}

/** How a dated goal is going. */
export type OnTrackVerdict = {
  status: 'on-track' | 'behind'
  /** Weeks the plan needs to reach the target. */
  weeksNeeded: number
  /** Weeks left until the deadline. */
  weeksLeft: number
  /** Positive when the plan is late by this many weeks. */
  weeksOff: number
}

/**
 * Judges a phase that has a target date: does the plan reach the target in
 * time? Undefined when there is no date, no progress possible, or the rate
 * heads the wrong way.
 */
export function onTrack(
  entries: WeightEntry[],
  phase: Phase
): OnTrackVerdict | undefined {
  if (!phase.targetDate) return undefined
  const latest = entries.at(-1)
  if (!latest) return undefined

  const weeksNeeded = weeksToTarget(
    latest.weight,
    phase.targetWeight,
    phase.ratePercentPerWeek
  )
  if (weeksNeeded === undefined) return undefined

  const weeksLeft = Math.max(
    0,
    (parseDay(phase.targetDate).getTime() - parseDay(latest.date).getTime()) /
      (7 * 86_400_000)
  )

  return {
    status: weeksNeeded <= weeksLeft ? 'on-track' : 'behind',
    weeksNeeded,
    weeksLeft,
    weeksOff: Math.max(0, weeksNeeded - weeksLeft),
  }
}
