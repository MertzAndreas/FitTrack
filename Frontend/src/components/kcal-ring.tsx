import {
  Label,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

type KcalRingProps = {
  /** Calories consumed today. */
  consumed: number
  /** Daily calorie goal. */
  goal: number
}

const chartConfig = {
  base: { label: 'Consumed' },
  over: { label: 'Over goal' },
} satisfies ChartConfig

export function KcalRing({ consumed, goal }: KcalRingProps) {
  const ratio = goal > 0 ? consumed / goal : 0
  const isOver = ratio > 1
  const percent = Math.round(ratio * 100)

  // Three layers on one ring:
  //   track -> the muted background sector
  //   base  -> --primary, the part eating into the goal
  //   over  -> --destructive, the part past the goal
  //
  // The bars share a stackId so Recharts stacks them: base runs from the axis
  // start, then over continues from where base ended.
  const capped = Math.min(ratio, 1)
  const overflow = isOver ? ratio - 1 : 0

  // Normalise into the fixed 0..100 span, otherwise the stacked total exceeds
  // the domain and Recharts clamps the over arc to zero width.
  const scale = isOver ? 1 / ratio : 1
  const base = capped * scale * 100
  const over = overflow * scale * 100

  const chartData = [{ base, over }]

  const remaining = Math.max(goal - consumed, 0)

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square w-full max-w-[260px]"
    >
      <RadialBarChart
        data={chartData}
        startAngle={-270}
        endAngle={90}
        outerRadius={110}
        innerRadius={90}
        barSize={20}
      >
        {/* Full-ring track. `background` on a bar only paints behind the filled
            portion, so the grid is what draws the whole circle. polarRadius
            matches the bar's [outer, inner] radii. */}
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="fill-muted"
          polarRadius={[110, 90]}
        />

        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />

        <RadialBar
          dataKey="base"
          stackId="ring"
          angleAxisId={0}
          fill="var(--primary)"
        />
        {over > 0 ? (
          <RadialBar
            dataKey="over"
            stackId="ring"
            angleAxisId={0}
            fill="var(--destructive)"
          />
        ) : null}

        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className={
                        'fill-foreground text-4xl font-bold'
                      }
                    >
                      {consumed.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 26}
                      className="fill-muted-foreground text-sm"
                    >
                      of {goal.toLocaleString()} kcal
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 46}
                      className={
                        isOver
                          ? 'fill-destructive text-xs font-medium'
                          : 'fill-muted-foreground text-xs'
                      }
                    >
                      {isOver
                        ? `${percent}% · ${(consumed - goal).toLocaleString()} over`
                        : `${percent}% · ${remaining.toLocaleString()} left`}
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  )
}
