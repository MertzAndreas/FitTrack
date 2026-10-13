import { cn } from 'cn'

export type DayStatus = 'untracked' | 'onTarget' | 'over'

type MonthGridProps = {
  /** Month to render, 1-based. */
  month: number
  year: number
  /** Keyed by ISO date (YYYY-MM-DD). Missing dates are treated as untracked. */
  statuses: Record<string, DayStatus>
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`

/**
 * Builds the full Mon–Sun weeks that contain the month, so leading days from the
 * previous month and trailing days from the next are included to complete the
 * rows. Edge days are ordinary days and follow the same status rules.
 */
function buildWeeks(year: number, month: number) {
  const first = new Date(year, month - 1, 1)
  // getDay(): 0=Sun..6=Sat. Convert to a Mon-based offset.
  const offset = (first.getDay() + 6) % 7
  const start = new Date(year, month - 1, 1 - offset)

  const cells: { date: Date; iso: string; inMonth: boolean }[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    cells.push({ date, iso: toIso(date), inMonth: date.getMonth() === month - 1 })
  }

  // Trim trailing weeks that are entirely outside the month.
  while (cells.length > 7 && !cells.slice(-7).some((c) => c.inMonth)) {
    cells.splice(-7)
  }

  return cells.map(({ iso }) => iso)
}

const statusClass: Record<DayStatus, string> = {
  untracked: 'bg-muted',
  onTarget: 'bg-primary',
  over: 'bg-destructive',
}

export function MonthGrid({ month, year, statuses }: MonthGridProps) {
  const cells = buildWeeks(year, month)

  return (
    <div className="w-full space-y-1">
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[0.6rem] font-semibold tracking-wider text-muted-foreground uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-3">
        {cells.map((iso) => {
          const status = statuses[iso] ?? 'untracked'
          return (
            <div
              key={iso}
              title={`${iso} — ${status}`}
              className={cn('h-4 w-full rounded-[2px]', statusClass[status])}
            />
          )
        })}
      </div>
    </div>
  )
}
