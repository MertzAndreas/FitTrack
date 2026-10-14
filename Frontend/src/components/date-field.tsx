import { CalendarIcon, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MicroLabel } from '@/components/micro-label'
import { formatDay } from '@/lib/weight-dates'

type DateFieldProps = {
  label: string
  value: string | undefined
  onChange: (iso: string) => void
  /** Accessible label for the trigger button. */
  ariaLabel?: string
  /** Formats the value for display. Defaults to "14 Oct 2026". */
  formatDate?: (iso: string) => string
  /** Shown when there is no value. */
  placeholder?: string
  /** When provided, renders a clear button beside the trigger. */
  onClear?: () => void
  /** Accessible label for the clear button, when `onClear` is set. */
  clearLabel?: string
}

const defaultFormat = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

/**
 * A single-date field: label above a button that opens a calendar popover.
 * Composed on Base UI `Popover`/`Calendar`, mirroring `number-field.tsx`.
 */
export function DateField({
  label,
  value,
  onChange,
  ariaLabel = 'Pick a date',
  formatDate = defaultFormat,
  placeholder,
  onClear,
  clearLabel = 'Clear date',
}: DateFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(`${value}T00:00:00`) : undefined

  return (
    <div className="space-y-1.5">
      <MicroLabel>{label}</MicroLabel>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="h-auto flex-1 justify-start gap-2 px-3 py-2 text-sm font-normal normal-case"
                aria-label={ariaLabel}
              />
            }
          >
            <CalendarIcon className="size-3.5 shrink-0" />
            <span className="truncate">
              {value ? formatDate(value) : placeholder}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              onSelect={(day) => {
                if (!day) return
                onChange(formatDay(day))
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
        {onClear && value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={clearLabel}
            title={clearLabel}
            onClick={onClear}
          >
            <X />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
