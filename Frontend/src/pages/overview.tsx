import { ChevronLeft, ChevronRight, Hamburger, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'cn'
import { KcalRing } from '@/components/kcal-ring'
import { MacroProgress } from '@/components/macro-progress'
import { MealList } from '@/components/meal-list'
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
import { createBlock, createItem, sumBlocks, foods, type MealBlock } from '@/lib/meals'

// Builds a block from (foodId, amount) pairs, so the mock stays readable.
const block = (name: string, items: [string, number][]) =>
  createBlock(
    name,
    items.map(([foodId, amount]) => createItem(foodId, amount))
  )

// Mock data — replace with real user data. One entry per day, newest last.
// Kcal totals are derived from the meal blocks rather than stored.
const days: {
  date: string
  weight: { current: number; change: number; unit: string }
  meals: MealBlock[]
}[] = [
    {
      date: '2026-10-09',
      weight: { current: 78.9, change: -0.2, unit: 'kg' },
      meals: [
        block('Breakfast', [
          ['oats', 80],
          ['milk', 200],
        ]),
        block('Lunch', [
          ['chicken', 150],
          ['rice', 180],
          ['broccoli', 100],
        ]),
        block('Dinner', [
          ['salmon', 150],
          ['potato', 200],
        ]),
        block('Snacks', [
          ['protein-shake', 250],
          ['apple', 120],
        ]),
      ],
    },
    {
      date: '2026-10-10',
      weight: { current: 78.7, change: -0.2, unit: 'kg' },
      meals: [
        block('Breakfast', [
          ['egg', 120],
          ['bread', 70],
          ['coffee', 200],
        ]),
        block('Lunch', [
          ['chicken', 120],
          ['pasta', 200],
          ['olive-oil', 10],
        ]),
        block('Dinner', [
          ['beef', 180],
          ['rice', 200],
        ]),
        block('Snacks', [
          ['nuts', 40],
          ['banana', 120],
        ]),
      ],
    },
    {
      date: '2026-10-11',
      weight: { current: 78.6, change: -0.1, unit: 'kg' },
      meals: [
        block('Breakfast', [
          ['yoghurt', 200],
          ['oats', 50],
        ]),
        block('Lunch', [
          ['chicken', 150],
          ['rice', 200],
          ['banana', 100],
        ]),
        block('Dinner', [
          ['pasta', 250],
          ['beef', 100],
        ]),
        block('Snacks', [['chocolate', 25]]),
      ],
    },
    {
      date: '2026-10-12',
      weight: { current: 78.5, change: -0.1, unit: 'kg' },
      meals: [
        block('Breakfast', [
          ['bread', 120],
          ['egg', 100],
          ['peanut-butter', 30],
        ]),
        block('Lunch', [
          ['beef', 220],
          ['potato', 250],
          ['olive-oil', 15],
        ]),
        block('Dinner', [
          ['pasta', 300],
          ['chicken', 120],
        ]),
        block('Snacks', [['chocolate', 60]]),
      ],
    },
    {
      date: '2026-10-13',
      weight: { current: 78.4, change: -0.1, unit: 'kg' },
      meals: [
        block('Breakfast', [
          ['egg', 150],
          ['bread', 60],
        ]),
        block('Lunch', [
          ['pasta', 200],
          ['chicken', 130],
        ]),
        block('Dinner', [
          ['chicken', 150],
          ['potato', 220],
          ['broccoli', 120],
        ]),
        block('Snacks', [
          ['protein-shake', 300],
          ['apple', 150],
        ]),
      ],
    },
  ]

// Macro goals per day (mock). Consumption is derived from the meal blocks.
const kcalGoal = 2100

const macroGoals: { key: 'protein' | 'carbs' | 'fat'; label: string; goal: number; unit: string }[] = [
  { key: 'protein', label: 'Protein', goal: 160, unit: 'g' },
  { key: 'carbs', label: 'Carbs', goal: 230, unit: 'g' },
  { key: 'fat', label: 'Fat', goal: 70, unit: 'g' },
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
  // Editable meal blocks for the visible day, seeded from the mock.
  const [mealsByDay, setMealsByDay] = useState<Record<string, MealBlock[]>>(() =>
    Object.fromEntries(days.map((d) => [d.date, d.meals]))
  )

  const day = days[index]
  const weight = day.weight
  const meals = mealsByDay[day.date] ?? []
  const dayTotals = sumBlocks(meals)
  const consumed = dayTotals.kcal
  const isOver = consumed > kcalGoal
  const isToday = index === days.length - 1

  // Real macros, derived from the foods and amounts in the meal blocks.
  const macros = macroGoals.map(({ key, label, goal, unit }) => ({
    label,
    goal,
    unit,
    consumed: Math.round(dayTotals[key]),
  }))

  const monthCounts = Object.values(monthStatuses)
  const monthStats = {
    onTarget: monthCounts.filter((s) => s === 'onTarget').length,
    tracked: monthCounts.length,
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-heading">Overview</h1>
        <p className="text-sm text-muted-foreground">Your daily fitness summary.</p>
      </div>

      <Card size="sm">
        <CardHeader className="items-center pb-0 text-center">
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              disabled={index === 0}
              aria-label="Previous day"
            >
              <ChevronLeft />
            </Button>
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate">
                {isToday ? 'Today' : formatDate(day.date)}
              </CardTitle>
              <CardDescription className="truncate">
                {isToday
                  ? isOver
                    ? 'Over your calorie goal'
                    : 'On track'
                  : isOver
                    ? 'Over goal'
                    : 'On track'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => setIndex((i) => Math.min(i + 1, days.length - 1))}
              disabled={isToday}
              aria-label="Next day"
            >
              <ChevronRight />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <KcalRing consumed={consumed} goal={kcalGoal} />

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Card
              size="sm"
              className="bg-muted/40 shadow-none ring-0 [--card-spacing:0px]"
            >
              <CardHeader className="p-3 pb-2">
                <CardDescription className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
                  <Scale className="size-3.5" />
                  Weight
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 p-3 pt-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-2xl tabular-nums">
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

            <Card
              size="sm"
              className="bg-muted/40 shadow-none ring-0 [--card-spacing:0px]"
            >
              <CardHeader className="p-3 pb-2">
                <CardDescription className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
                  <Hamburger className="size-3.5" />
                  Macros
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0">
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

      <MealList
        blocks={meals}
        foods={foods}
        onChange={(blocks) =>
          setMealsByDay((prev) => ({ ...prev, [day.date]: blocks }))
        }
      />
    </div>
  )
}
