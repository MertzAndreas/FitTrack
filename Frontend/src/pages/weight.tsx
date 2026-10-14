import { Flag, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { WeightChart } from '@/components/weight-chart'
import { WeightEntryAddSheet } from '@/components/weight-entry-add-sheet'
import { WeightEntryEditSheet } from '@/components/weight-entry-edit-sheet'
import { WeightEntryList } from '@/components/weight-entry-list'
import { WeightPhaseSheet } from '@/components/weight-phase-sheet'
import { WeightRangePicker } from '@/components/weight-range-picker'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import {
  availableGranularities,
  bucketEntries,
  consistency,
  defaultGranularity,
  filterByRange,
  granularityLabel,
  rangeLabel,
  rollingAverage,
  type Granularity,
  type WeightRange,
} from '@/lib/weight-chart'
import {
  onTrack,
  phaseDirectionLabels,
  phaseSummary,
  visiblePhases,
  weeksToTarget,
  type GoalProgress,
  type OnTrackVerdict,
  type Phase,
  type PhaseDirection,
  type RecentRate,
} from '@/lib/weight-goals'
import { daysSinceLastEntry, isoToday, upsertEntry, type WeightEntry } from '@/lib/weight'
import { seedEntries, seedPhases } from '@/lib/weight-seed'

export function WeightPage() {
  // In-memory for now, like the rest of the app. Resets on reload.
  const [entries, setEntries] = useState<WeightEntry[]>(() => seedEntries())
  const [phases, setPhases] = useState<Phase[]>(() => seedPhases())
  const [range, setRange] = useState<WeightRange>('all')
  // Computed from the *range-filtered* entries, matching changeRange below, so
  // the default is the same whether you land on a range or navigate to it.
  const [granularity, setGranularity] = useState<Granularity>(() =>
    defaultGranularity(filterByRange(seedEntries(), 'all'), 'all')
  )
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<WeightEntry | null>(null)

  const latest = entries.at(-1)
  const first = entries[0]

  const rangedEntries = filterByRange(entries, range)
  const granularities = availableGranularities(rangedEntries, range)
  // Guard against a stored granularity that the current range no longer offers
  // (e.g. after data edits shrink the span).
  const activeGranularity = granularities.includes(granularity)
    ? granularity
    : granularities[0]
  const points = bucketEntries(rangedEntries, activeGranularity, range)

  // The change the chart is actually showing, from its first to its last point.
  const rangedChange =
    points.length > 1 ? points.at(-1)!.weight - points[0].weight : undefined

  // The phase in effect today, summarised.
  const summary = phaseSummary(entries, phases)
  const { phase, progress, rate, direction } = summary ?? {}
  // Pace sentence: an on-track verdict when the goal has a date, else an ETA.
  const verdict = phase ? onTrack(entries, phase) : undefined
  const etaWeeks =
    phase && !verdict && entries.at(-1)
      ? weeksToTarget(
          entries.at(-1)!.weight,
          phase.targetWeight,
          phase.ratePercentPerWeek
        )
      : undefined
  const streak = consistency(entries)
  // Days since the last log, against the real date. Used to nudge when logging
  // has lapsed; the mock's latest entry is recent enough not to fire by default.
  const daysSinceLog = daysSinceLastEntry(entries, isoToday())
  // The smoothed line only makes sense over daily points; coarser buckets are
  // already averages.
  const showAverage = activeGranularity === 'day'
  const average = showAverage ? rollingAverage(rangedEntries) : undefined
  // Phases clipped to the buckets on screen, for the chart bands and targets.
  const bands = visiblePhases(
    entries,
    phases,
    points.map((p) => p.date)
  )

  // Switching range resets the granularity to that range's default, so a long
  // range opens at a readable zoom rather than inheriting "Day" from a week.
  const changeRange = (next: WeightRange) => {
    setRange(next)
    setGranularity(defaultGranularity(filterByRange(entries, next), next))
  }

  const save = (entry: WeightEntry) => {
    setEntries((prev) => upsertEntry(prev, entry))
  }

  const remove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  // Phase sheet: closed → null, create → 'new', edit → the phase.
  const [phaseSheet, setPhaseSheet] = useState<Phase | 'new' | null>(null)

  const savePhase = (next: Phase) => {
    setPhases((prev) => {
      // Replacing any phase on the same start date keeps one per day, and
      // replacing by id handles edits.
      const kept = prev.filter(
        (p) => p.id !== next.id && p.startDate !== next.startDate
      )
      return [...kept, next].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      )
    })
  }

  const deletePhase = (id: string) => {
    setPhases((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 sm:space-y-6">
      {/* Heading, with the logging status as part of the header block. */}
      <div className="space-y-1">
        <h1 className="text-2xl font-heading">Weight</h1>
        {daysSinceLog !== undefined ? (
          <p
            className={cn(
              'text-sm',
              daysSinceLog === 0
                ? 'font-medium text-emerald-600 dark:text-emerald-500'
                : 'text-muted-foreground'
            )}
          >
            {daysSinceLog === 0
              ? 'Good job on logging today'
              : daysSinceLog === 1
                ? '1 day since last log'
                : `${daysSinceLog} days since last log`}
          </p>
        ) : null}
      </div>

      {latest ? (
        <Card size="sm">
          <CardHeader className="pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <CardDescription className="font-semibold tracking-widest uppercase">
                Current weight:{' '}
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {latest.weight} kg
                </span>
              </CardDescription>
              {first && latest.id !== first.id ? (
                <CardDescription className="text-right tabular-nums">
                  {latest.weight - first.weight > 0 ? '+' : ''}
                  {(latest.weight - first.weight).toFixed(1)} kg since{' '}
                  {new Date(`${first.date}T00:00:00`).toLocaleDateString(
                    undefined,
                    { day: 'numeric', month: 'short', year: 'numeric' }
                  )}
                </CardDescription>
              ) : null}
            </div>
          </CardHeader>

          {/* Generous gap keeps the summary and the chart visually separate
              even though they share one card. */}
          <CardContent className="space-y-8">
            <div className="space-y-3">
              {/* Motivation strip: pace, goal, and consistency. */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat
                  label="Weekly rate"
                  value={
                    rate ? (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="cursor-help underline decoration-dotted underline-offset-2">
                              {rateValue(rate)}
                            </span>
                          }
                        />
                        <TooltipContent>
                          This week vs last week, by average weight ·{' '}
                          {rate.recentCount} logged in the last{' '}
                          {rate.windowDays} days vs {rate.previousCount} in the{' '}
                          {rate.windowDays} before.
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      rateValue(rate)
                    )
                  }
                />
                <Stat {...goalStat(progress, direction)} />
                <Stat
                  label="Logged (28d)"
                  value={streak ? `${streak.logged} of ${streak.days}` : '—'}
                />
              </div>

              {phase && progress ? (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {direction ? phaseDirectionLabels[direction] : 'Goal'}{' '}
                        to{' '}
                        <span className="font-semibold text-foreground tabular-nums">
                          {phase.targetWeight} kg
                        </span>
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {progress.onTarget
                          ? driftLabel(progress.offTarget)
                          : progress.reached
                            ? `${Math.abs(progress.offTarget).toFixed(1)} kg past`
                            : `${Math.round(progress.percent)}%`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted">
                      <div
                        className="h-full bg-primary transition-[width]"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    {paceSentence(phase, verdict, etaWeeks) ? (
                      <p
                        className={cn(
                          'text-xs',
                          verdict?.status === 'on-track'
                            ? 'text-emerald-600 dark:text-emerald-500'
                            : 'text-muted-foreground'
                        )}
                      >
                        {paceSentence(phase, verdict, etaWeeks)}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="icon-lg"
                    onClick={() => setPhaseSheet(phase)}
                    aria-label="Edit goal"
                    title="Edit goal"
                  >
                    <Pencil />
                  </Button>
                </div>
              ) : null}

              {/* Log an entry, or start a new goal: the two "add" actions. */}
              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus />
                  Log
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setPhaseSheet('new')}
                  title="Start a new goal phase"
                >
                  <Flag />
                  New phase
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground tabular-nums">
                {rangeLabel(range)}
                {activeGranularity === 'day'
                  ? ''
                  : ` · ${granularityLabel(activeGranularity)} average`}
                {rangedChange !== undefined
                  ? ` · ${rangedChange > 0 ? '+' : ''}${rangedChange.toFixed(1)} kg`
                  : ''}
              </p>
              <WeightChart
                points={points}
                granularity={activeGranularity}
                average={average}
                showAverage={showAverage}
                phases={bands}
              />

              <WeightRangePicker
                value={range}
                onChange={changeRange}
                granularities={granularities}
                granularity={activeGranularity}
                onGranularityChange={setGranularity}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold tracking-wider uppercase">
          Entries
        </h2>

        {entries.length > 0 ? (
          <WeightEntryList
            entries={entries}
            phases={phases}
            onSelect={setEditing}
            onViewPhase={(from, to) => setRange({ from, to })}
          />
        ) : (
          <p className="border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No entries yet. Log your first weight to get started.
          </p>
        )}
      </div>

      <WeightEntryAddSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={save}
      />

      {editing ? (
        <WeightEntryEditSheet
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          entry={editing}
          onSubmit={save}
          onDelete={() => remove(editing.id)}
        />
      ) : null}

      <WeightPhaseSheet
        open={phaseSheet !== null}
        onOpenChange={(open) => {
          if (!open) setPhaseSheet(null)
        }}
        {...(phaseSheet && phaseSheet !== 'new' ? { phase: phaseSheet } : {})}
        entries={entries}
        onSubmit={savePhase}
        onDelete={deletePhase}
      />
    </div>
  )
}

/** Formats the weekly rate, e.g. "−0.29 kg/wk". */
function rateValue(rate: RecentRate | undefined): string {
  if (rate === undefined) return '—'
  const v = rate.delta
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${sign}${Math.abs(v).toFixed(2)} kg/wk`
}

/** How far a maintain phase sits from its target, e.g. "0.6 kg below". */
function driftLabel(offTarget: number): string {
  const amount = Math.abs(offTarget).toFixed(1)
  if (Math.abs(offTarget) < 0.05) return 'on target'
  return `${amount} kg ${offTarget < 0 ? 'below' : 'above'}`
}

/** A short date, for the pace sentence. */
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })

/**
 * The one-line pace read for a goal: an on-track verdict when it has a
 * deadline, otherwise when the plan would get there. Empty for maintain phases
 * (no meaningful ETA) and for goals with no progress possible.
 */
function paceSentence(
  phase: Phase | undefined,
  verdict: OnTrackVerdict | undefined,
  etaWeeks: number | undefined
): string | undefined {
  if (!phase) return undefined
  if (verdict) {
    if (verdict.status === 'on-track') {
      return `On track to hit ${phase.targetWeight} kg by ${shortDate(phase.targetDate!)}.`
    }
    const late = Math.ceil(verdict.weeksOff)
    return `Behind: about ${late} week${late === 1 ? '' : 's'} late at this pace.`
  }
  if (etaWeeks === undefined) return undefined
  const weeks = Math.ceil(etaWeeks)
  return `At this pace you'd reach ${phase.targetWeight} kg in about ${weeks} week${weeks === 1 ? '' : 's'}.`
}

/** The label and value for the distance-to-goal figure. The direction lives in
 * the label, so the value stays absolute — a distance has no sign. */
function goalStat(
  progress: GoalProgress | undefined,
  direction: PhaseDirection | undefined
): { label: string; value: string } {
  if (!progress) return { label: 'To goal', value: '—' }
  // A maintain phase has no finish line, so show the drift rather than "remaining".
  if (direction === 'maintain') {
    return {
      label: 'From target',
      value: `${Math.abs(progress.offTarget).toFixed(1)} kg`,
    }
  }
  if (progress.reached) return { label: 'Goal', value: 'Reached' }
  return {
    label: progress.remaining > 0 ? 'To gain' : 'To lose',
    value: `${Math.abs(progress.remaining).toFixed(1)} kg`,
  }
}

/** A compact labelled figure used in the motivation strip. */
function Stat({
  label,
  value,
}: {
  label: React.ReactNode
  value: React.ReactNode
}) {
  return (
    <div className="border border-border bg-muted/30 px-3 py-2">
      <div className="text-[0.6rem] font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
      </div>
      <div className="font-heading text-lg leading-tight tabular-nums">
        {value}
      </div>
    </div>
  )
}
