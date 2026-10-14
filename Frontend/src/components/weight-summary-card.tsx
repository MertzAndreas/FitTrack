import { Flag, Pencil, Plus } from 'lucide-react'
import { cn } from 'cn'
import { MicroLabel } from '@/components/micro-label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { WeightChart as Chart } from '@/components/weight-chart'
import { WeightRangePicker } from '@/components/weight-range-picker'
import { parseDay } from '@/lib/weight-dates'
import type { Granularity, WeightRange } from '@/lib/weight-chart'
import type { OnTrackVerdict, RecentRate } from '@/lib/weight-projection'
import {
  phaseDirectionLabels,
  type GoalProgress,
  type Phase,
  type PhaseDirection,
} from '@/lib/weight-phase'
import type { WeightEntry } from '@/lib/weight'
import type { WeightView } from '@/lib/weight-view'

type WeightSummaryCardProps = {
  view: WeightView
  entries: WeightEntry[]
  range: WeightRange
  onRangeChange: (range: WeightRange) => void
  onGranularityChange: (granularity: Granularity) => void
  onEditPhase: (phase: Phase) => void
  onNewPhase: () => void
  onLog: () => void
}

/** Formats the recent rate, e.g. "−0.29 kg/wk". */
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

/**
 * The one-line pace read for a goal: an on-track verdict when it has a
 * deadline, otherwise when the plan would get there.
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

/** A short date, for the pace sentence and the header. */
function shortDate(iso: string, withYear = false): string {
  return parseDay(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  })
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
      <MicroLabel size="xs">{label}</MicroLabel>
      <div className="font-heading text-lg leading-tight tabular-nums">
        {value}
      </div>
    </div>
  )
}

export function WeightSummaryCard({
  view,
  entries,
  range,
  onRangeChange,
  onGranularityChange,
  onEditPhase,
  onNewPhase,
  onLog,
}: WeightSummaryCardProps) {
  const { phase, direction, progress, rate, verdict, etaWeeks, streak, points } =
    view
  const latest = entries.at(-1)
  const first = entries[0]
  if (!latest) return null

  const totalChange = first && latest.id !== first.id
    ? latest.weight - first.weight
    : undefined
  const sentence = paceSentence(phase, verdict, etaWeeks)

  return (
    <Card size="sm">
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <CardDescription className="font-semibold tracking-widest uppercase">
            Current weight:{' '}
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {latest.weight} kg
            </span>
          </CardDescription>
          {totalChange !== undefined ? (
            <CardDescription className="text-right tabular-nums">
              {totalChange > 0 ? '+' : ''}
              {totalChange.toFixed(1)} kg since {shortDate(first.date, true)}
            </CardDescription>
          ) : null}
        </div>
      </CardHeader>

      {/* Generous gap keeps the summary and the chart visually separate
          even though they share one card. */}
      <CardContent className="space-y-8">
        <div className="space-y-3">
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
                      {rate.recentCount} logged in the last {rate.windowDays}{' '}
                      days vs {rate.previousCount} in the {rate.windowDays}{' '}
                      before.
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
                    {direction ? phaseDirectionLabels[direction] : 'Goal'} to{' '}
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
                {sentence ? (
                  <p
                    className={cn(
                      'text-xs',
                      verdict?.status === 'on-track'
                        ? 'text-emerald-600 dark:text-emerald-500'
                        : 'text-muted-foreground'
                    )}
                  >
                    {sentence}
                  </p>
                ) : null}
              </div>
              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => onEditPhase(phase)}
                aria-label="Edit goal"
                title="Edit goal"
              >
                <Pencil />
              </Button>
            </div>
          ) : null}

          {/* Log an entry, or start a new goal: the two "add" actions. */}
          <div className="flex gap-2 pt-1">
            <Button className="flex-1" size="lg" onClick={onLog}>
              <Plus />
              Log
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onNewPhase}
              title="Start a new goal phase"
            >
              <Flag />
              New phase
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground tabular-nums">
            {view.chartCaption}
          </p>
          <Chart
            points={points}
            granularity={view.granularity}
            average={view.average}
            showAverage={view.granularity === 'day'}
            phases={view.bands}
          />

          <WeightRangePicker
            value={range}
            onChange={onRangeChange}
            granularities={view.granularities}
            granularity={view.granularity}
            onGranularityChange={onGranularityChange}
          />
        </div>
      </CardContent>
    </Card>
  )
}
