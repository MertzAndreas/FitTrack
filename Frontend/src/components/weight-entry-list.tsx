import { CalendarRange, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  phaseDirection,
  phaseDirectionLabels,
  phaseEnd,
  weightMoveSentiment,
  type Phase,
} from '@/lib/weight-phase'
import { groupEntriesByPhase } from '@/lib/weight-chart'
import { measurementFields, type WeightEntry } from '@/lib/weight'

type WeightEntryListProps = {
  entries: WeightEntry[]
  phases: Phase[]
  onSelect: (entry: WeightEntry) => void
  /** Jump the chart to a phase's window. */
  onViewPhase: (from: string, to: string) => void
}

/** Newest first, which is the reverse of the chart's order. */
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

const formatMonth = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })

export function WeightEntryList({
  entries,
  phases,
  onSelect,
  onViewPhase,
}: WeightEntryListProps) {
  // Groups run oldest-first; show them newest-first to match the entries.
  const groups = [...groupEntriesByPhase(entries, phases)].reverse()

  // Derive each phase's direction once, not per group header: phaseDirection
  // walks the entries, so calling it in the render loop is O(n²).
  const directions = new Map(
    phases.map((phase) => [phase.id, phaseDirection(entries, phase)])
  )

  // Change against the previous entry, keyed by id. weightChange also walks
  // the entries, so compute the lot in one pass rather than per row.
  const changes = new Map<string, number | undefined>()
  for (let i = 0; i < entries.length; i++) {
    changes.set(
      entries[i].id,
      i === 0 ? undefined : entries[i].weight - entries[i - 1].weight
    )
  }

  return (
    <div className="space-y-5">
      {groups.map((group, groupIndex) => (
        <section
          key={group.phase?.id ?? `unphased-${groupIndex}`}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {group.phase
                ? `${phaseDirectionLabels[directions.get(group.phase.id) ?? 'maintain']} · to ${group.phase.targetWeight} kg`
                : 'Before phases'}
            </h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatMonth(group.entries[0].date)}
              {group.entries.length > 1
                ? ` – ${formatMonth(group.entries.at(-1)!.date)}`
                : ''}
            </span>
            {group.phase ? (
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                aria-label="Show this phase on the chart"
                title="Show on chart"
                onClick={() => {
                  const end = phaseEnd(phases, group.phase!, entries)
                  onViewPhase(
                    group.phase!.startDate,
                    end ?? group.entries.at(-1)!.date
                  )
                }}
              >
                <CalendarRange />
              </Button>
            ) : null}
          </div>

          <ul className="space-y-2">
            {[...group.entries].reverse().map((entry) => {
              const change = changes.get(entry.id)
              const measurements = measurementFields.filter(
                (f) => entry.measurements[f.key] != null
              )

              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(entry)}
                    className="flex w-full items-center gap-3 border border-border bg-muted/30 p-3 text-left transition-colors hover:bg-muted/60 focus-visible:border-ring focus-visible:outline-none"
                  >
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block text-sm font-medium">
                        {formatDate(entry.date)}
                      </span>

                      {change !== undefined ? (
                        <span
                          className={cn(
                            'flex items-center gap-1 text-xs font-medium',
                            weightMoveSentiment(
                              change,
                              group.phase
                                ? directions.get(group.phase.id)
                                : undefined
                            ) === 'toward'
                              ? 'text-emerald-600 dark:text-emerald-500'
                              : 'text-muted-foreground'
                          )}
                        >
                          {change < 0 ? (
                            <TrendingDown className="size-3.5" />
                          ) : change > 0 ? (
                            <TrendingUp className="size-3.5" />
                          ) : null}
                          {change > 0 ? '+' : ''}
                          {change.toFixed(1)} kg
                        </span>
                      ) : (
                        <span className="block text-xs text-muted-foreground">
                          First entry
                        </span>
                      )}

                      {measurements.length > 0 ? (
                        <span className="block truncate text-xs text-muted-foreground tabular-nums">
                          {measurements
                            .map(
                              (f) =>
                                `${f.label} ${entry.measurements[f.key]}${f.unit}`
                            )
                            .join(' · ')}
                        </span>
                      ) : null}
                    </span>

                    {entry.photos.length > 0 ? (
                      <span className="flex shrink-0 gap-1">
                        {entry.photos.slice(0, 3).map((url, i) => (
                          <img
                            key={`${entry.id}-photo-${i}`}
                            src={url}
                            alt=""
                            className="size-10 border border-border object-cover"
                          />
                        ))}
                      </span>
                    ) : null}

                    <span className="shrink-0 text-right">
                      <span className="font-heading text-xl leading-none tabular-nums">
                        {entry.weight}
                      </span>
                      <span className="ml-1 text-[0.65rem] tracking-widest text-muted-foreground">
                        kg
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
