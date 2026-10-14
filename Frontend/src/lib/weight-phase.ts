/**
 * Goals as sequential phases: what each phase targets and which entries belong
 * to it.
 *
 * A phase is deliberately minimal — there is no stored "kind". Whether it is a
 * cut, a bulk or a maintain is a *consequence* of its target against the weight
 * it began at, derived by `phaseDirection`. Storing it would let it drift out
 * of sync with the numbers.
 */
import { subDaysIso } from '@/lib/weight-dates'
import type { WeightEntry } from '@/lib/weight'
import { recentRate, type RecentRate } from '@/lib/weight-projection'

/**
 * A stretch of time with one target and one target rate. Goals are sequential:
 * a phase runs from its `startDate` until the next phase begins (or, for the
 * last one, until the latest entry). Weight may be logged outside a phase.
 */
export type Phase = {
  id: string
  /** ISO date the phase begins, inclusive. */
  startDate: string
  targetWeight: number
  /**
   * Plan, as a percentage of bodyweight per week. Signed: negative to lose,
   * positive to gain, 0 to maintain.
   */
  ratePercentPerWeek: number
  /** Optional deadline, ISO date. Enables the on-track verdict. */
  targetDate?: string
}

/** What a phase is doing, fixed by its target against the weight it began at. */
export type PhaseDirection = 'cut' | 'maintain' | 'bulk'

/** How close a target must sit to a reference weight to count as maintaining. */
export const MAINTAIN_TOLERANCE = 1

export const phaseDirectionLabels: Record<PhaseDirection, string> = {
  cut: 'Cut',
  maintain: 'Maintain',
  bulk: 'Bulk',
}

/** The weight a phase starts from, i.e. the weight at its start date. */
export function phaseStartWeight(
  entries: WeightEntry[],
  phase: Phase
): number | undefined {
  return weightAt(entries, phase.startDate)
}

/**
 * What a phase is doing, from its target against the weight it *started* at.
 * Fixed at creation: a phase that began as a cut stays a cut, even once you
 * have passed its target. That is deliberate — the phase is a record of what
 * you set out to do, not a live reading of where you are. `validatePhaseTarget`
 * is what keeps it honest, by refusing a target the direction cannot reach.
 */
export function phaseDirection(
  entries: WeightEntry[],
  phase: Phase
): PhaseDirection {
  const start = phaseStartWeight(entries, phase)
  if (start === undefined) return 'maintain'
  const delta = phase.targetWeight - start
  if (delta < -MAINTAIN_TOLERANCE) return 'cut'
  if (delta > MAINTAIN_TOLERANCE) return 'bulk'
  return 'maintain'
}

/**
 * Why a phase's target is not allowed, or undefined when it is fine.
 *
 * Direction comes from the phase's start weight. The target must then also sit
 * on the correct side of the *current* weight, so a cut cannot be edited to
 * point above where you are. A maintain may sit anywhere in the tolerance band
 * around the current weight, since holding near where you are is its point.
 */
export function validatePhaseTarget(
  entries: WeightEntry[],
  target: number,
  phase: Pick<Phase, 'startDate'>
): string | undefined {
  const start = weightAt(entries, phase.startDate)
  const current = entries.at(-1)?.weight
  if (start === undefined || current === undefined) return undefined

  const vsStart = target - start
  const vsCurrent = target - current

  if (vsStart < -MAINTAIN_TOLERANCE) {
    return vsCurrent >= 0
      ? `A cut must target below your current ${current} kg.`
      : undefined
  }
  if (vsStart > MAINTAIN_TOLERANCE) {
    return vsCurrent <= 0
      ? `A bulk must target above your current ${current} kg.`
      : undefined
  }
  return Math.abs(vsCurrent) > MAINTAIN_TOLERANCE
    ? `A maintain must stay within ${MAINTAIN_TOLERANCE} kg of your current ${current} kg.`
    : undefined
}

/** The phase in effect on a date: the latest one starting on or before it. */
export function activePhase(
  phases: Phase[],
  date: string
): Phase | undefined {
  return [...phases]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .filter((p) => p.startDate <= date)
    .at(-1)
}

/**
 * The last date a phase covers: the day before the next phase starts, or the
 * latest entry for the open-ended final phase. Undefined if it starts after
 * every entry.
 */
export function phaseEnd(
  phases: Phase[],
  phase: Phase,
  entries: WeightEntry[]
): string | undefined {
  const next = [...phases]
    .filter((p) => p.startDate > phase.startDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]

  return next ? subDaysIso(next.startDate, 1) : entries.at(-1)?.date
}

/**
 * The weight to anchor from on a date: the most recent entry on or before it,
 * falling back to the first entry after it. This is what lets a phase measure
 * from its own start rather than from the very first entry ever.
 */
export function weightAt(
  entries: WeightEntry[],
  date: string
): number | undefined {
  if (entries.length === 0) return undefined
  const before = entries.filter((e) => e.date <= date).at(-1)
  return (before ?? entries[0]).weight
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

/**
 * A colour-coded sentiment for a weight change, given the phase it happened in.
 *
 * Deliberately not "down is good". A change is 'toward' only when it moves the
 * way the phase is trying to go — losing during a cut, gaining during a bulk —
 * and 'neutral' otherwise. Maintaining has no preferred direction, and a change
 * with no phase has no goal to judge against, so both stay neutral. Never
 * 'away' in a way that reads as an error: moving off-goal is not danger.
 */
export type MoveSentiment = 'toward' | 'neutral'

export function weightMoveSentiment(
  change: number | undefined,
  direction: PhaseDirection | undefined
): MoveSentiment {
  if (change === undefined || change === 0) return 'neutral'
  if (direction === 'cut') return change < 0 ? 'toward' : 'neutral'
  if (direction === 'bulk') return change > 0 ? 'toward' : 'neutral'
  // A maintain phase, or no phase at all: no direction is "good".
  return 'neutral'
}

/** Direction-neutral goal + pace maths, scoped to a single phase. */
export type GoalProgress = {
  /** The weight at the phase's start, the anchor for progress. */
  startWeight: number
  /** The latest weight inside the phase. */
  currentWeight: number
  /** Signed kg from the phase start to its target. */
  totalToGo: number
  /** Signed kg still to cover (target - current). */
  remaining: number
  /**
   * 0–100, how far along the phase is from its start toward its target. A
   * maintain (target ≈ start) has no distance to cover, so it reads from
   * closeness instead; see `onTarget`.
   */
  percent: number
  /** True once the current weight has met the target. */
  reached: boolean
  /** Signed kg the current weight sits off the target: negative below. */
  offTarget: number
  /** True when the current weight is within tolerance of the target. */
  onTarget: boolean
}

/**
 * Progress within one phase, from the weight at its start toward its target.
 * A single path for every phase: a cut, a bulk and a maintain differ only in
 * the sign and size of `target - start`. When there is no real distance to
 * cover (a maintain), progress reads from closeness to the target rather than
 * a ratio that would divide by nearly zero.
 */
export function goalProgress(
  entries: WeightEntry[],
  phases: Phase[],
  phase: Phase
): GoalProgress | undefined {
  const start = weightAt(entries, phase.startDate)
  const within = entriesInPhase(entries, phases, phase)
  if (start === undefined || within.length === 0) return undefined

  const current = within.at(-1)!.weight
  const total = phase.targetWeight - start
  const covered = current - start
  const remaining = phase.targetWeight - current
  const offTarget = current - phase.targetWeight
  const onTarget = Math.abs(offTarget) <= MAINTAIN_TOLERANCE

  // With a real distance to cover, progress is the fraction closed. Without
  // one (a maintain), it is how close you are, fading out over a few times the
  // tolerance.
  const percent =
    Math.abs(total) <= MAINTAIN_TOLERANCE
      ? clamp(100 - (Math.abs(offTarget) / (MAINTAIN_TOLERANCE * 3)) * 100)
      : clamp((covered / total) * 100)

  return {
    startWeight: start,
    currentWeight: current,
    totalToGo: total,
    remaining,
    percent,
    reached: onTarget,
    offTarget,
    onTarget,
  }
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

/** A quick read of the active phase, in one place. */
export type PhaseSummary = {
  phase: Phase
  direction: PhaseDirection
  progress: GoalProgress
  /** This week vs last week, in kg/week, with the counts behind it. */
  rate: RecentRate | undefined
}

/**
 * Summarises the phase in effect on the latest entry. Bundled so the page does
 * not have to know how the pieces fit together, or the order they must be
 * computed in.
 */
export function phaseSummary(
  entries: WeightEntry[],
  phases: Phase[]
): PhaseSummary | undefined {
  const latest = entries.at(-1)
  if (!latest) return undefined

  const phase = activePhase(phases, latest.date)
  if (!phase) return undefined

  const progress = goalProgress(entries, phases, phase)
  if (!progress) return undefined

  return {
    phase,
    direction: phaseDirection(entries, phase),
    progress,
    rate: recentRate(entries),
  }
}
