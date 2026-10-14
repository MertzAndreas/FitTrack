import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'cn'
import { MicroLabel } from '@/components/micro-label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  granularityLabels,
  rangeLabel,
  rangePresets,
  type DateRange,
  type Granularity,
  type WeightRange,
} from '@/lib/weight-chart'
import { formatDay } from '@/lib/weight-dates'
import type { DateRange as DayPickerRange } from 'react-day-picker'

type WeightRangePickerProps = {
  value: WeightRange
  onChange: (range: WeightRange) => void
  /** Granularities worth offering for the current range. */
  granularities: Granularity[]
  granularity: Granularity
  onGranularityChange: (granularity: Granularity) => void
  className?: string
}

const isCustom = (range: WeightRange): range is DateRange =>
  typeof range === 'object'

/** Range presets, a custom popover, and the aggregation granularity. */
export function WeightRangePicker({
  value,
  onChange,
  granularities,
  granularity,
  onGranularityChange,
  className,
}: WeightRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DayPickerRange | undefined>(
    isCustom(value)
      ? {
          from: new Date(`${value.from}T00:00:00`),
          to: new Date(`${value.to}T00:00:00`),
        }
      : undefined
  )

  const apply = () => {
    if (!draft?.from) return
    onChange({
      from: formatDay(draft.from),
      to: formatDay(draft.to ?? draft.from),
    })
    setOpen(false)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          value={isCustom(value) ? [] : [value]}
          onValueChange={(next: string[]) => {
            if (next[0]) onChange(next[0] as WeightRange)
          }}
          variant="outline"
          size="sm"
          spacing={0}
          className="overflow-hidden"
        >
          {rangePresets.map((preset) => (
            <ToggleGroupItem
              key={preset.value}
              value={preset.value}
              className="px-3"
            >
              {preset.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (next && isCustom(value)) {
              setDraft({
                from: new Date(`${value.from}T00:00:00`),
                to: new Date(`${value.to}T00:00:00`),
              })
            }
          }}
        >
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant={isCustom(value) ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
              />
            }
          >
            <CalendarIcon />
            {isCustom(value) ? rangeLabel(value) : 'Custom'}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              numberOfMonths={1}
              selected={draft}
              defaultMonth={draft?.from}
              onSelect={setDraft}
              disabled={{ after: new Date() }}
            />
            <div className="flex items-center justify-between gap-2 border-t border-border p-3">
              <span className="truncate text-xs text-muted-foreground">
                {draft?.from && draft?.to
                  ? `${rangeLabel({
                      from: formatDay(draft.from),
                      to: formatDay(draft.to),
                    })}`
                  : 'Pick a start and end date'}
              </span>
              <Button size="sm" onClick={apply} disabled={!draft?.from}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* The aggregation override. A single option means no choice to make. */}
      {granularities.length > 1 ? (
        <div className="flex items-center gap-2">
          <MicroLabel size="hint">Show</MicroLabel>
          <ToggleGroup
            value={[granularity]}
            onValueChange={(next: string[]) => {
              if (next[0]) onGranularityChange(next[0] as Granularity)
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="overflow-hidden"
          >
            {granularities.map((option) => (
              <ToggleGroupItem
                key={option}
                value={option}
                className="px-3"
              >
                {granularityLabels[option]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}
    </div>
  )
}
