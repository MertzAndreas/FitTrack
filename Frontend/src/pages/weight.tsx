import { useState } from 'react'
import { cn } from 'cn'
import { WeightEntryAddSheet } from '@/components/weight-entry-add-sheet'
import { WeightEntryEditSheet } from '@/components/weight-entry-edit-sheet'
import { WeightEntryList } from '@/components/weight-entry-list'
import { WeightPhaseSheet } from '@/components/weight-phase-sheet'
import { WeightSummaryCard } from '@/components/weight-summary-card'
import type { Granularity, WeightRange } from '@/lib/weight-chart'
import type { Phase } from '@/lib/weight-phase'
import { daysSinceLastEntry, upsertEntry, type WeightEntry } from '@/lib/weight'
import { today } from '@/lib/weight-dates'
import { seedEntries, seedPhases } from '@/lib/weight-seed'
import { initialGranularity, summariseWeightPage } from '@/lib/weight-view'

export function WeightPage() {
  // In-memory for now, like the rest of the app. Resets on reload.
  const [entries, setEntries] = useState<WeightEntry[]>(() => seedEntries())
  const [phases, setPhases] = useState<Phase[]>(() => seedPhases())
  const [range, setRange] = useState<WeightRange>('all')
  const [granularity, setGranularity] = useState<Granularity>(() =>
    initialGranularity(seedEntries(), 'all')
  )

  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<WeightEntry | null>(null)
  // Phase sheet: closed → null, create → 'new', edit → the phase.
  const [phaseSheet, setPhaseSheet] = useState<Phase | 'new' | null>(null)

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

  const saveEntry = (entry: WeightEntry) => {
    setEntries((prev) => upsertEntry(prev, entry))
  }

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
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

      {entries.length > 0 ? (
        <WeightSummaryCard
          view={view}
          entries={entries}
          range={range}
          onRangeChange={changeRange}
          onGranularityChange={setGranularity}
          onEditPhase={setPhaseSheet}
          onNewPhase={() => setPhaseSheet('new')}
          onLog={() => setAddOpen(true)}
        />
      ) : null}

      <section className="space-y-3">
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
      </section>

      <WeightEntryAddSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={saveEntry}
      />

      {editing ? (
        <WeightEntryEditSheet
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          entry={editing}
          onSubmit={saveEntry}
          onDelete={() => deleteEntry(editing.id)}
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
