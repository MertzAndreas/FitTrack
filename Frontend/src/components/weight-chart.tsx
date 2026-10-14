import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { ChartPoint, Granularity } from '@/lib/weight-chart'
import type { PhaseDirection, VisiblePhase } from '@/lib/weight-phase'

const chartConfig = {
  weight: { label: 'Weight', color: 'var(--chart-1, var(--primary))' },
  average: { label: '7-day avg', color: 'var(--chart-2, var(--muted-foreground))' },
} satisfies ChartConfig

/** Very light washes, one per phase direction. Kept faint so the line stays clear. */
const bandFill: Record<PhaseDirection, string> = {
  cut: 'var(--color-chart-2)',
  maintain: 'var(--color-muted)',
  bulk: 'var(--color-chart-4)',
}

/** Axis and tooltip labels, which differ by how the points were bucketed. */
const formatters: Record<Granularity, (iso: string) => string> = {
  day: (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    }),
  week: (iso) => {
    const start = new Date(`${iso}T00:00:00`)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const day = (d: Date) => d.getDate()
    const month = (d: Date) =>
      d.toLocaleDateString(undefined, { month: 'short' })
    return `${day(start)}–${day(end)} ${month(end)}`
  },
  month: (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    }),
}

/**
 * Dot size shrinks as points crowd together, and disappears past a threshold
 * where dots would merge into a blob. The line always carries the trend.
 */
function dotFor(count: number, granularity: Granularity) {
  if (granularity !== 'day') return { r: 3 }
  if (count <= 20) return { r: 3 }
  if (count <= 45) return { r: 2 }
  return false
}

type WeightChartProps = {
  points: ChartPoint[]
  granularity: Granularity
  /** Rolling-average series aligned to `points`, drawn on daily views. */
  average?: ChartPoint[]
  /** Whether to draw the average line (shown only on daily views). */
  showAverage?: boolean
  /** Phases clipped to the visible window, drawn as bands with target lines. */
  phases?: VisiblePhase[]
}

/** Weight trend for the given points, oldest first. */
export function WeightChart({
  points,
  granularity,
  average,
  showAverage,
  phases,
}: WeightChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center border border-dashed border-border text-sm text-muted-foreground">
        No entries in this range.
      </div>
    )
  }

  // The average rides on the same rows so both lines share an X axis.
  const averageByDate = new Map(
    (average ?? []).map((p) => [p.date, p.weight])
  )
  const data = points.map((p) => ({
    ...p,
    average: showAverage ? averageByDate.get(p.date) : undefined,
  }))

  const weights = points.map((p) => p.weight)
  const min = Math.floor(Math.min(...weights) - 1)
  const max = Math.ceil(Math.max(...weights) + 1)
  // A single point has no spread to scale to, so pad it into a visible band.
  const domain: [number, number] =
    min === max ? [min - 1, max + 1] : [min, max]

  const format = formatters[granularity]

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        {/* Phase bands sit behind everything. */}
        {(phases ?? []).map((phase) => (
          <ReferenceArea
            key={`band-${phase.startDate}`}
            x1={phase.startDate}
            x2={phase.endDate}
            fill={bandFill[phase.direction]}
            fillOpacity={0.1}
            stroke="none"
            ifOverflow="hidden"
          />
        ))}
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={format}
        />
        <YAxis
          domain={domain}
          tickLine={false}
          axisLine={false}
          width={32}
          tickFormatter={(v) => `${v}`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label, payload) => {
                const point = payload?.[0]?.payload as
                  | ChartPoint
                  | undefined
                const period = format(String(label))
                return point && point.count > 1
                  ? `${period} · avg of ${point.count}`
                  : period
              }}
              formatter={(value) => `${Number(value).toFixed(1)} kg`}
            />
          }
        />
        <Line
          dataKey="weight"
          type="monotone"
          stroke="var(--color-weight)"
          strokeWidth={2}
          dot={dotFor(points.length, granularity)}
          connectNulls
        />
        {showAverage ? (
          <Line
            dataKey="average"
            type="monotone"
            stroke="var(--color-average)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            connectNulls
          />
        ) : null}
      </LineChart>
    </ChartContainer>
  )
}
