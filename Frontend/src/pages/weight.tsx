import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { WeightEntryAddSheet } from '@/components/weight-entry-add-sheet'
import { WeightEntryEditSheet } from '@/components/weight-entry-edit-sheet'
import { WeightEntryList } from '@/components/weight-entry-list'
import { WeightPhaseSheet } from '@/components/weight-phase-sheet'
import { WeightSummaryCard } from '@/components/weight-summary-card'
import type { Granularity, WeightRange } from '@/lib/weight-chart'
import type { Phase } from '@/lib/weight-phase'
import { daysSinceLastEntry, type WeightEntry } from '@/lib/weight'
import type { EntryValues } from '@/lib/weight-api'
import { weightApi } from '@/lib/weight-api'
import { today } from '@/lib/weight-dates'
import { initialGranularity, summariseWeightPage } from '@/lib/weight-view'

const weightKey = ['weight']

/** Error messages, for handing to a component as a plain string. */
const messageOf = (error: unknown): string | null =>
  error === null || error === undefined
    ? null
    : error instanceof Error
      ? error.message
      : String(error)

export function WeightPage() {
  const queryClient = useQueryClient()
  const entriesQuery = useQuery({ queryKey: weightKey, queryFn: weightApi.list })
  const entries = entriesQuery.data ?? []
  const refresh = () => queryClient.invalidateQueries({ queryKey: weightKey })

  const [phases, setPhases] = useState<Phase[]>([])
  const [range, setRange] = useState<WeightRange>('all')
  const [granularity, setGranularity] = useState<Granularity>('week')

  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<WeightEntry | null>(null)
  // Phase sheet: closed → null, create → 'new', edit → the phase.
  const [phaseSheet, setPhaseSheet] = useState<Phase | 'new' | null>(null)

  const saveEntry = useMutation({
    mutationFn: ({
      values,
      original,
    }: {
      values: EntryValues
      original: WeightEntry | null
    }) => weightApi.save(values, original),
    onSuccess: () => {
      setAddOpen(false)
      setEditing(null)
      void refresh()
    },
  })

  const deleteEntry = useMutation({
    mutationFn: (entry: WeightEntry) => weightApi.remove(entry.date),
    onSuccess: () => {
      setEditing(null)
      void refresh()
    },
  })

  const view = summariseWeightPage(
    entries,
    phases,
    range,
    granularity,
    daysSinceLastEntry(entries, today())
  )

  // Switching range resets the granularity to that range's default, so a long
  // range opens at a readable zoom rather than inheriting "Day" from a week.
  const changeRange = (next: WeightRange) => {
    setRange(next)
    setGranularity(initialGranularity(entries, next))
  }

  const openAdd = () => {
    saveEntry.reset()
    setAddOpen(true)
  }

  const openEdit = (entry: WeightEntry) => {
    saveEntry.reset()
    deleteEntry.reset()
    setEditing(entry)
  }

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
      <header className="space-y-1">
        <h1 className="text-2xl font-heading">Weight</h1>
        {view.daysSinceLog !== undefined ? (
          <p
            className={cn(
              'text-sm',
              view.daysSinceLog === 0
                ? 'font-medium text-emerald-600 dark:text-emerald-500'
                : 'text-muted-foreground'
            )}
          >
            {loggedRecently(view.daysSinceLog)}
          </p>
        ) : null}
      </header>

      {entriesQuery.error ? (
        <p className="border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {messageOf(entriesQuery.error)}
        </p>
      ) : null}

      {entries.length > 0 ? (
        <WeightSummaryCard
          view={view}
          entries={entries}
          range={range}
          onRangeChange={changeRange}
          onGranularityChange={setGranularity}
          onEditPhase={setPhaseSheet}
          onNewPhase={() => setPhaseSheet('new')}
          onLog={openAdd}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold tracking-wider uppercase">
          Entries
        </h2>

        {entriesQuery.isPending ? (
          <p className="border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : entries.length > 0 ? (
          <WeightEntryList
            entries={entries}
            phases={phases}
            onSelect={openEdit}
            onViewPhase={(from, to) => setRange({ from, to })}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No entries yet. Log your first weight to get started.
            </p>
            <Button size="lg" onClick={openAdd}>
              <Plus />
              Log weight
            </Button>
          </div>
        )}
      </section>

      <WeightEntryAddSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(values) => saveEntry.mutate({ values, original: null })}
        isSaving={saveEntry.isPending}
        error={messageOf(saveEntry.error)}
      />

      {editing ? (
        <WeightEntryEditSheet
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          entry={editing}
          onSubmit={(values) => saveEntry.mutate({ values, original: editing })}
          onDelete={() => deleteEntry.mutate(editing)}
          isSaving={saveEntry.isPending || deleteEntry.isPending}
          error={messageOf(saveEntry.error ?? deleteEntry.error)}
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

/** The logging status line, by how long it has been since the last entry. */
function loggedRecently(days: number): string {
  if (days === 0) return 'Good job on logging today'
  if (days === 1) return '1 day since last log'
  return `${days} days since last log`
}
