import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { newId, isoToday, type WeightEntry } from '@/lib/weight'
import { WeightFields, type WeightFormValues } from '@/components/weight-fields'

type WeightEntryAddSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (entry: WeightEntry) => void
}

const emptyValues = (): WeightFormValues => ({
  date: isoToday(),
  weight: 0,
  measurements: {},
  photos: [],
})

export function WeightEntryAddSheet({
  open,
  onOpenChange,
  onSubmit,
}: WeightEntryAddSheetProps) {
  const [values, setValues] = useState<WeightFormValues>(emptyValues)

  // Reset to a fresh draft each time the sheet opens.
  useEffect(() => {
    if (open) setValues(emptyValues())
  }, [open])

  const addPhotos = (files: FileList) => {
    const next = Array.from(files).map((file) => ({
      id: newId('photo'),
      url: URL.createObjectURL(file),
      name: file.name,
    }))
    setValues((v) => ({ ...v, photos: [...v.photos, ...next] }))
  }

  const removePhoto = (id: string) => {
    setValues((v) => {
      const photo = v.photos.find((p) => p.id === id)
      if (photo) URL.revokeObjectURL(photo.url)
      return { ...v, photos: v.photos.filter((p) => p.id !== id) }
    })
  }

  const confirm = () => {
    if (!values.weight || values.weight <= 0) return
    onSubmit({
      id: newId('weight'),
      date: values.date,
      weight: values.weight,
      measurements: values.measurements,
      photos: values.photos.map((p) => p.url),
    })
    onOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    // Dropping the draft also drops its preview URLs.
    if (!next) values.photos.forEach((p) => URL.revokeObjectURL(p.url))
    onOpenChange(next)
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-xl">
        <DrawerHeader className="flex-row items-center gap-2">
          <div className="min-w-0 flex-1">
            <DrawerTitle>Log weight</DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <WeightFields
            values={values}
            onChange={setValues}
            onSubmit={confirm}
            onAddPhotos={addPhotos}
            onRemovePhoto={(photo) => removePhoto(photo.id)}
            focusWeight={open}
          />

          <div className="mt-6 flex gap-3">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              size="lg"
              onClick={confirm}
              disabled={!values.weight || values.weight <= 0}
            >
              Add entry
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
