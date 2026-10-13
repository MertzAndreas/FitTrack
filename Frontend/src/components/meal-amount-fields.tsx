import { macrosFor, type Food } from '@/lib/meals'

type MealAmountFieldsProps = {
  food: Food | undefined
  amount: number
  onAmountChange: (amount: number) => void
  /** Called when Enter is pressed in the amount field. */
  onSubmit?: () => void
}

const round = (n: number) => Math.round(n)

export function MealAmountFields({
  food,
  amount,
  onAmountChange,
  onSubmit,
}: MealAmountFieldsProps) {
  const macros = food ? macrosFor(food.id, amount) : null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center bg-muted font-heading text-lg text-muted-foreground uppercase"
        >
          {food?.name.slice(0, 2) ?? '??'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-heading text-xl">
            {food?.name ?? 'Unknown food'}
          </div>
          <div className="text-sm text-muted-foreground">
            {food?.base}
            {food?.unit} base
          </div>
        </div>
      </div>

      {macros ? (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Kcal', value: round(macros.kcal), primary: true },
            { label: 'Protein', value: round(macros.protein) },
            { label: 'Carbs', value: round(macros.carbs) },
            { label: 'Fat', value: round(macros.fat) },
          ].map((m) => (
            <div
              key={m.label}
              className="border border-border bg-muted/30 px-2 py-3 text-center"
            >
              <div
                className={
                  'font-heading text-2xl leading-none tabular-nums'
                }
              >
                {m.value}
                {m.primary ? null : (
                  <span> g</span>
                )}
              </div>
              <div className="mt-1.5 text-[0.65rem] tracking-widest text-muted-foreground uppercase">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="space-y-4">
        <label
          htmlFor="item-amount"
          className="block font-semibold tracking-widest uppercase"
        >
          Amount
        </label>
        <div className="flex items-baseline gap-3 border border-border bg-muted/30 px-4 py-3">
          <input
            id="item-amount"
            autoFocus
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const next = Number(e.target.value.replace(/[^0-9.]/g, ''))
              onAmountChange(Number.isNaN(next) ? 0 : next)
            }}
            className="min-w-0 flex-1 bg-transparent text-xl font-bold tabular-nums outline-none"
          />
          <span className="font-heading text-xl text-muted-foreground">
            {food?.unit ?? 'g'}
          </span>
        </div>
      </div>
    </form>
  )
}
