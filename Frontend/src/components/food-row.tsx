import { macrosFor, type Food } from '@/lib/meals'

type FoodRowProps = {
  food: Food
  /** Amount in the food's unit. Defaults to the food's base amount. */
  amount?: number
  onClick: () => void
}

const round = (n: number) => Math.round(n)

/** A food entry row: thumbnail, name, amount and macros, and kcal. */
export function FoodRow({ food, amount = food.base, onClick }: FoodRowProps) {
  const macros = macrosFor(food.id, amount)

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border border-border bg-muted/30 p-0 pr-3 text-left transition-colors hover:bg-muted/60 focus-visible:border-ring focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center bg-muted font-heading text-base text-muted-foreground uppercase"
      >
        {food.name.slice(0, 2)}
      </span>
      <span className="min-w-0 flex-1 py-2">
        <span className="block truncate text-sm font-medium">{food.name}</span>
        <span className="block truncate text-xs text-muted-foreground tabular-nums">
          {amount}
          {food.unit} · {round(macros.protein)}P · {round(macros.carbs)}C ·{' '}
          {round(macros.fat)}F
        </span>
      </span>
      <span className="shrink-0 text-right font-heading text-lg leading-none tabular-nums">
        {round(macros.kcal)}
        <span className="ml-1 text-[0.65rem] font-normal tracking-widest text-muted-foreground">
          kcal
        </span>
      </span>
    </button>
  )
}
