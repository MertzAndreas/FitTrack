/**
 * Goals as sequential phases: what each phase targets, how it is doing, and
 * how the entries group under it. A phase is deliberately minimal — see the
 * note on `Phase` about there being no stored "kind".
 */
import { mean, toIso, type WeightEntry } from '@/lib/weight'

/**
 * A stretch of time with one target and one target rate. Goals are sequential:
 * a phase runs from its `startDate` until the next phase begins (or, for the
 * last one, until the latest entry). Weight may be logged outside a phase.
 *
 * There is deliberately no "kind": whether a phase is a cut, a bulk, or a maintain
 * is a *consequence* of its target versus its start weight, derived by
 * `phaseDirection`. Storing it would let it drift out of sync with the numbers.
 */
export type Phase = {
  id: string
  /** ISO date the phase begins, inclusive. */
  startDate: string
  targetWeight: number
  /**
   * Plan, as a percentage of bodyweight per week. Signed: negative to lose,
   * positive to gain, 0 to maintain. A percentage rather than kg/week because
   * a flat kg rate implies a constant loss, which does not hold as you get
   * lighter — see `projectWeight`.
   */
  ratePercentPerWeek: number
  /** Optional deadline, ISO date. Enables the on-track verdict. */
  targetDate?: string
}

/** What a phase is doing, fixed by its target against the weight it began at. */
export type PhaseDirection = 'cut' | 'maintain' | 'bulk'

/** How close the target must sit to the start weight to count as maintaining. */
export const MAINTAIN_TOLERANCE = 1

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
 * you set out to do, not a live re-reading of where you are now. What keeps it
 * honest is the target validation, which stops the target being moved past the
 * point where the direction would no longer make sense.
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

export const phaseDirectionLabels: Record<PhaseDirection, string> = {
  cut: 'Cut',
  maintain: 'Maintain',
  bulk: 'Bulk',
}

/**
 * Why a phase's target is not allowed, or undefined when it is fine.
 *
 * Direction comes from the phase's start weight. The target must then also sit
 * on the correct side of the *current* weight, so a cut cannot be edited to
 * point above where you are. Maintaining is always allowed within tolerance of
 * the current weight, since holding near where you are is the point of it.
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
  // The phase started as a maintain: the target may sit anywhere within the
  // tolerance band around the current weight.
  return Math.abs(vsCurrent) > MAINTAIN_TOLERANCE
    ? `A maintain must stay within ${MAINTAIN_TOLERANCE} kg of your current ${current} kg.`
    : undefined
}

/**
 * A colour-coded sentiment for a weight change, given the phase it happened in.
 *
 * Deliberately not "down is good". A change is 'toward' only when it moves the
 * way the active phase is trying to go — losing during a cut, gaining during a
 * bulk — and is 'neutral' otherwise. Maintaining has no preferred direction, and a
 * change with no phase has no goal to judge against, so both stay neutral.
 * Never 'away' in a way that reads as an error: moving off-goal is not danger.
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

  if (next) {
    const day = new Date(`${next.startDate}T00:00:00`)
    day.setDate(day.getDate() - 1)
    return toIso(day)
  }

  return entries.at(-1)?.date
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

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const groups: EntryGroup[] = []

  for (const entry of sorted) {
    const phase = activePhase(phases, entry.date)
    const last = groups.at(-1)
    // Extend the current group when it's the same phase, else start a new one.
    if (last && last.phase?.id === phase?.id) {
      last.entries.push(entry)
    } else {
      groups.push({ phase, entries: [entry] })
    }
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

  return phases
    .map((phase) => {
      const end = phaseEnd(phases, phase, entries)
      if (end === undefined) return undefined

      // Snap to buckets whose date lies inside the phase and the window.
      const inWindow = categories.filter(
        (c) => c >= phase.startDate && c <= end && c >= from && c <= to
      )
      if (inWindow.length === 0) return undefined

      return {
        direction: phaseDirection(entries, phase),
        startDate: inWindow[0],
        endDate: inWindow.at(-1)!,
        targetWeight: phase.targetWeight,
      }
    })
    .filter((p): p is VisiblePhase => p !== undefined)
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
   * 0–100, how far along the phase is from its start toward its target. A maintain
   * (target ≈ start) has no distance to cover, so it reads from closeness
   * instead; see `onTarget`.
   */
  percent: number
  /** True once the current weight has met the target. */
  reached: boolean
  /** Signed kg the current weight sits off the target: negative below, positive above. */
  offTarget: number
  /** True when the current weight is within tolerance of the target. */
  onTarget: boolean
}

/**
 * Progress within one phase, from the weight at its start toward its target.
 * A single path for every phase: a cut, a bulk and a maintain differ only in the
 * sign and size of `target - start`. When there is no real distance to cover
 * (a maintain), progress reads from closeness to the target rather than a ratio
 * that would divide by nearly zero.
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
  // one (a maintain), it is how close you are to the target, fading out over a few
  // times the tolerance.
  const percent =
    Math.abs(total) <= MAINTAIN_TOLERANCE
      ? Math.max(
          0,
          Math.min(
            100,
            100 - (Math.abs(offTarget) / (MAINTAIN_TOLERANCE * 3)) * 100
          )
        )
      : Math.max(0, Math.min(100, (covered / total) * 100))

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

/**
 * The recent trend, as this week's average against last week's, in kg/week.
 * A week-versus-week comparison rather than a slope: a slope over a window
 * answers "the average direction across it", so a fresh change is diluted by
 * everything before it. Comparing two adjacent means answers "is this week
 * different from last?", which is what the headline number should say.
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
 * that. Anchored to the latest entry, not today, so stale mock data still
 * reads sensibly. Undefined unless both windows have at least one entry.
 */
export function recentRate(
  entries: WeightEntry[],
  windowDays = RATE_WINDOW_DAYS
): RecentRate | undefined {
  const latest = entries.at(-1)
  if (!latest) return undefined

  const end = new Date(`${latest.date}T00:00:00`)
  const recentFrom = new Date(end)
  recentFrom.setDate(recentFrom.getDate() - (windowDays - 1))
  const previousFrom = new Date(end)
  previousFrom.setDate(previousFrom.getDate() - (windowDays * 2 - 1))

  const recentStart = toIso(recentFrom)
  const previousStart = toIso(previousFrom)

  const recent = entries.filter((e) => e.date >= recentStart)
  const previous = entries.filter(
    (e) => e.date >= previousStart && e.date < recentStart
  )
  if (recent.length === 0 || previous.length === 0) return undefined

  return {
    delta: mean(recent.map((e) => e.weight)) - mean(previous.map((e) => e.weight)),
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
 * Weeks until the weight reaches `targetKg` at the given percent-per-week
 * rate, or undefined when it never does. Simulated week by week because a
 * compound rate has no closed-form week count. Direction-aware: a cut needs a
 * negative rate, a bulk a positive one; a rate heading the wrong way returns
 * undefined rather than a nonsense number.
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
    (new Date(`${phase.targetDate}T00:00:00`).getTime() -
      new Date(`${latest.date}T00:00:00`).getTime()) /
      (7 * 86_400_000)
  )

  return {
    status: weeksNeeded <= weeksLeft ? 'on-track' : 'behind',
    weeksNeeded,
    weeksLeft,
    weeksOff: Math.max(0, weeksNeeded - weeksLeft),
  }
}
