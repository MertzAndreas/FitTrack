import { useEffect, useState, type RefObject } from 'react'
import { MicroLabel } from '@/components/micro-label'

type NumberFieldProps = {
  id: string
  label: string
  unit: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  /** Allow a leading minus, for signed values like a weekly rate. */
  signed?: boolean
  inputRef?: RefObject<HTMLInputElement | null>
  /** Called when Enter is pressed in the field. */
  onSubmit?: () => void
}

const parse = (raw: string): number | undefined => {
  if (raw === '' || raw === '-' || raw === '.') return undefined
  const n = Number(raw)
  return Number.isNaN(n) ? undefined : n
}

/**
 * A bordered, label-above numeric field. Backed by a string while typing so
 * intermediate states like "78." survive; the parent only ever sees numbers
 * (or undefined when blank or incomplete).
 */
export function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
  signed,
  inputRef,
  onSubmit,
}: NumberFieldProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value))

  // Follow external resets (e.g. a sheet reopening with different values).
  useEffect(() => {
    setText(value === undefined ? '' : String(value))
  }, [value])

  const pattern = signed ? /[^0-9.-]/g : /[^0-9.]/g

  return (
    <label htmlFor={id} className="block space-y-1.5">
      <MicroLabel>{label}</MicroLabel>
      <span className="flex items-baseline gap-2 border border-border bg-muted/30 px-3 py-2">
        <input
          id={id}
          ref={inputRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(e) => {
            const raw = e.target.value.replace(pattern, '')
            setText(raw)
            onChange(parse(raw))
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSubmit?.()
            }
          }}
          placeholder="—"
          className="min-w-0 flex-1 bg-transparent text-base font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground"
        />
        <span className="text-xs text-muted-foreground">{unit}</span>
      </span>
    </label>
  )
}
