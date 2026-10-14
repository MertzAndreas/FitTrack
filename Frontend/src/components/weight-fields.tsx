import { ImagePlus, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cn } from 'cn'
import { DateField } from '@/components/date-field'
import { MicroLabel } from '@/components/micro-label'
import { NumberField } from '@/components/number-field'
import type { Measurements, PhotoDraft } from '@/lib/weight'
import { measurementFields } from '@/lib/weight'

export type WeightFormValues = {
  date: string
  weight: number
  measurements: Measurements
  photos: PhotoDraft[]
}

type WeightFieldsProps = {
  values: WeightFormValues
  onChange: (values: WeightFormValues) => void
  /** Called when Enter is pressed in a text field. */
  onSubmit?: () => void
  /** Object URLs of photos picked in this session, so they can be revoked. */
  onRemovePhoto: (photo: PhotoDraft) => void
  onAddPhotos: (files: FileList) => void
  /** Focus the weight field on mount / when this flips true. */
  focusWeight?: boolean
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export function WeightFields({
  values,
  onChange,
  onSubmit,
  onRemovePhoto,
  onAddPhotos,
  focusWeight,
}: WeightFieldsProps) {
  const weightRef = useRef<HTMLInputElement>(null)

  // Focus once the drawer has settled; autoFocus races the open animation.
  useEffect(() => {
    if (!focusWeight) return
    const id = requestAnimationFrame(() => weightRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [focusWeight])

  const patch = (next: Partial<WeightFormValues>) =>
    onChange({ ...values, ...next })

  const setMeasurement = (key: keyof Measurements, value: number | undefined) =>
    patch({ measurements: { ...values.measurements, [key]: value } })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-2 gap-3">
        <DateField
          label="Date"
          value={values.date}
          onChange={(date) => patch({ date })}
          formatDate={formatDate}
        />

        <NumberField
          id="weight-value"
          label="Weight"
          unit="kg"
          inputRef={weightRef}
          value={values.weight || undefined}
          onChange={(weight) => patch({ weight: weight ?? 0 })}
          onSubmit={onSubmit}
        />
      </div>

      <div className="space-y-2">
        <MicroLabel>Measurements</MicroLabel>
        <div className="grid grid-cols-2 gap-3">
          {measurementFields.map((field) => (
            <NumberField
              key={field.key}
              id={`measure-${field.key}`}
              label={field.label}
              unit={field.unit}
              value={values.measurements[field.key]}
              onChange={(value) => setMeasurement(field.key, value)}
              onSubmit={onSubmit}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <MicroLabel>Photos</MicroLabel>
        <div className="flex flex-wrap gap-2">
          {values.photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative size-20 overflow-hidden border border-border bg-muted"
            >
              <img
                src={photo.url}
                alt={photo.name}
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemovePhoto(photo)}
                aria-label={`Remove ${photo.name}`}
                className="absolute top-1 right-1 flex size-6 items-center justify-center bg-background/80 text-foreground transition-colors hover:bg-background"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}

          <label
            className={cn(
              'flex size-20 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/50',
              'text-[0.6rem] tracking-widest uppercase'
            )}
          >
            <ImagePlus className="size-4" />
            Add
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) onAddPhotos(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>
    </form>
  )
}
