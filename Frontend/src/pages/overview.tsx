import { ChevronLeft, ChevronRight, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'cn'
import { KcalRing } from '@/components/kcal-ring'
import { MacroProgress } from '@/components/macro-progress'
import { MonthGrid } from '@/components/month-grid'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Mock data — replace with real user data. One entry per day, newest last.
const days = [
  {
    date: '2026-10-09',
    kcal: { consumed: 1980, goal: 2100 },
    weight: { current: 78.9, change: -0.2, unit: 'kg' },
    macros: [
      { label: 'Protein', consumed: 152, goal: 160, unit: 'g' },
      { label: 'Carbs', consumed: 191, goal: 230, unit: 'g' },
      { label: 'Fat', consumed: 61, goal: 70, unit: 'g' },
    ],
  },
  {
    date: '2026-10-10',
    kcal: { consumed: 2240, goal: 2100 },
    weight: { current: 78.7, change: -0.2, unit: 'kg' },
    macros: [
      { label: 'Protein', consumed: 143, goal: 160, unit: 'g' },
      { label: 'Carbs', consumed: 248, goal: 230, unit: 'g' },
      { label: 'Fat', consumed: 74, goal: 70, unit: 'g' },
    ],
  },
  {
    date: '2026-10-11',
    kcal: { consumed: 2050, goal: 2100 },
    weight: { current: 78.6, change: -0.1, unit: 'kg' },
    macros: [
      { label: 'Protein', consumed: 158, goal: 160, unit: 'g' },
      { label: 'Carbs', consumed: 205, goal: 230, unit: 'g' },
      { label: 'Fat', consumed: 65, goal: 70, unit: 'g' },
    ],
  },
  {
    date: '2026-10-12',
    kcal: { consumed: 2680, goal: 2100 },
    weight: { current: 78.5, change: -0.1, unit: 'kg' },
    macros: [
      { label: 'Protein', consumed: 136, goal: 160, unit: 'g' },
      { label: 'Carbs', consumed: 294, goal: 230, unit: 'g' },
      { label: 'Fat', consumed: 88, goal: 70, unit: 'g' },
    ],
  },
  {
    date: '2026-10-13',
    kcal: { consumed: 2300, goal: 2100 },
    weight: { current: 78.4, change: -0.1, unit: 'kg' },
    macros: [
      { label: 'Protein', consumed: 148, goal: 160, unit: 'g' },
      { label: 'Carbs', consumed: 262, goal: 230, unit: 'g' },
      { label: 'Fat', consumed: 71, goal: 70, unit: 'g' },
    ],
  },
]

// All-time days on target (mock). Cumulative rather than a streak, so a missed
// day never resets it.
const overall = { daysOnTarget: 138 }

// Per-day statuses for the calendar month (mock). 'untracked' days are simply
// absent from this map.
const monthStatuses: Record<string, 'untracked' | 'onTarget' | 'over'> = {
  '2026-09-28': 'onTarget',
  '2026-09-29': 'onTarget',
  '2026-09-30': 'over',
  '2026-10-01': 'onTarget',
  '2026-10-02': 'onTarget',
  '2026-10-03': 'over',
  '2026-10-04': 'onTarget',
  '2026-10-06': 'onTarget',
  '2026-10-07': 'onTarget',
  '2026-10-08': 'over',
  '2026-10-09': 'onTarget',
  '2026-10-10': 'over',
  '2026-10-11': 'onTarget',
  '2026-10-12': 'over',
  '2026-10-13': 'over',
  '2026-10-15': 'onTarget',
  '2026-10-16': 'onTarget',
  '2026-10-17': 'over',
  '2026-10-18': 'onTarget',
  '2026-10-19': 'onTarget',
  '2026-10-21': 'onTarget',
  '2026-10-22': 'over',
  '2026-10-23': 'onTarget',
  '2026-10-25': 'onTarget',
  '2026-10-26': 'onTarget',
  '2026-10-27': 'over',
  '2026-10-28': 'onTarget',
  '2026-10-30': 'onTarget',
  '2026-10-31': 'over',
  '2026-11-01': 'onTarget',
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
      <span className={cn('size-2.5 rounded-[2px]', className)} />
      {label}
    </span>
  )
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

export function OverviewPage() {
  const [index, setIndex] = useState(days.length - 1)

  const day = days[index]
  const { kcal, weight, macros } = day
  const isOver = kcal.consumed > kcal.goal
  const isToday = index === days.length - 1

  const monthCounts = Object.values(monthStatuses)
  const monthStats = {
    onTarget: monthCounts.filter((s) => s === 'onTarget').length,
    tracked: monthCounts.length,
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-heading">Overview</h1>
        <p className="text-muted-foreground">Your daily fitness summary.</p>
      </div>

      <Card>
        <CardHeader className="items-center pb-0 text-center">
          <div className="flex w-full items-center justify-between">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              disabled={index === 0}
              aria-label="Previous day"
            >
              <ChevronLeft />
            </Button>
            <div className="space-y-1">
              <CardTitle>
                {isToday ? 'Today' : formatDate(day.date)}
              </CardTitle>
              <CardDescription>
                {isToday
                  ? isOver
                    ? 'You are over your calorie goal'
                    : 'On track for today'
                  : formatDate(day.date)}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIndex((i) => Math.min(i + 1, days.length - 1))}
              disabled={isToday}
              aria-label="Next day"
            >
              <ChevronRight />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <KcalRing consumed={kcal.consumed} goal={kcal.goal} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Card size="sm" className="bg-muted/40 shadow-none ring-0">
              <CardHeader>
                <CardDescription className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
                  <Scale className="size-3.5" />
                  Weight
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tabular-nums">
                    {weight.current}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {weight.unit}
                  </span>
                </div>
                <div
                  className={
                    weight.change < 0
                      ? 'flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-500'
                      : 'flex items-center gap-1 text-xs font-medium text-destructive'
                  }
                >
                  {weight.change < 0 ? (
                    <TrendingDown className="size-3.5" />
                  ) : (
                    <TrendingUp className="size-3.5" />
                  )}
                  {weight.change > 0 ? '+' : ''}
                  {weight.change} {weight.unit} this week
                </div>
              </CardContent>
            </Card>

            <Card size="sm" className="bg-muted/40 shadow-none ring-0">
              <CardHeader>
                <CardDescription className="text-xs font-semibold tracking-widest uppercase">
                  Macros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MacroProgress macros={macros} />
              </CardContent>
            </Card>
          </div>
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-4 border-t pt-6">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold tracking-widest uppercase">
              Days on target
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums">
                {overall.daysOnTarget}
              </span>
              <span className="text-xs text-muted-foreground">all time</span>
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-widest uppercase">
                This month
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {monthStats.onTarget} of {monthStats.tracked} on target
              </span>
            </div>
            <MonthGrid month={10} year={2026} statuses={monthStatuses} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
              <LegendItem className="bg-primary" label="On target" />
              <LegendItem className="bg-destructive" label="Over" />
              <LegendItem className="bg-muted" label="Not tracked" />
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
