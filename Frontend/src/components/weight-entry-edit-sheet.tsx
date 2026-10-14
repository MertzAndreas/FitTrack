import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { newId, type WeightEntry } from '@/lib/weight'
import { WeightFields, type WeightFormValues } from '@/components/weight-fields'

type WeightEntryEditSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: WeightEntry
  onSubmit: (entry: WeightEntry) => void
  onDelete: () => void
}

/** Seeds the form from the entry, naming existing photos so they can be kept. */
const valuesFromEntry = (entry: WeightEntry): WeightFormValues => ({
  date: entry.date,
  weight: entry.weight,
  measurements: { ...entry.measurements },
  photos: entry.photos.map((url, i) => ({
    id: newId('photo'),
    url,
    name: `Photo ${i + 1}`,
  })),
})

export function WeightEntryEditSheet({
  open,
  onOpenChange,
  entry,
  onSubmit,
  onDelete,
}: WeightEntryEditSheetProps) {
  const [values, setValues] = useState<WeightFormValues>(() =>
    valuesFromEntry(entry)
  )

  // Re-seed whenever a different entry is opened.
  useEffect(() => {
    if (open) setValues(valuesFromEntry(entry))
  }, [open, entry])

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
      // Only revoke URLs created in this session, not the entry's own previews.
      if (photo && !entry.photos.includes(photo.url)) {
        URL.revokeObjectURL(photo.url)
      }
      return { ...v, photos: v.photos.filter((p) => p.id !== id) }
    })
  }

  const confirm = () => {
    if (!values.weight || values.weight <= 0) return
    onSubmit({
      id: entry.id,
      date: values.date,
      weight: values.weight,
      measurements: values.measurements,
      photos: values.photos.map((p) => p.url),
    })
    onOpenChange(false)
  }

  const handleDelete = () => {
    onDelete()
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-xl">
        <DrawerHeader className="flex-row items-center gap-2">
          <div className="min-w-0 flex-1">
            <DrawerTitle>Edit entry</DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <WeightFields
            values={values}
            onChange={setValues}
            onSubmit={confirm}
            onAddPhotos={addPhotos}
            onRemovePhoto={(photo) => removePhoto(photo.id)}
          />

          <div className="mt-6 flex gap-3">
            <Button variant="destructive" size="lg" onClick={handleDelete}>
              <Trash2 />
              Delete
            </Button>
            <Button
              className="flex-1"
              size="lg"
              onClick={confirm}
              disabled={!values.weight || values.weight <= 0}
            >
              Save
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
