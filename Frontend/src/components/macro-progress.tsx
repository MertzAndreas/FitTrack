import { cn } from 'cn'

type Macro = {
  label: string
  consumed: number
  goal: number
  unit: string
}

type MacroProgressProps = {
  macros: Macro[]
}

export function MacroProgress({ macros }: MacroProgressProps) {
  return (
    <div className="grid gap-4">
      {macros.map((macro) => {
        const ratio = macro.goal > 0 ? macro.consumed / macro.goal : 0
        const percent = Math.min(Math.round(ratio * 100), 100)
        const isOver = ratio > 1

        return (
          <div key={macro.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold tracking-widest uppercase">
                {macro.label}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                <span
                  className={cn('font-medium', isOver && 'text-destructive')}
                >
                  {macro.consumed}
                </span>
                {' / '}
                {macro.goal}
                {macro.unit}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden bg-muted">
              <div
                className={cn(
                  'h-full transition-all',
                  isOver ? 'bg-destructive' : 'bg-primary'
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
