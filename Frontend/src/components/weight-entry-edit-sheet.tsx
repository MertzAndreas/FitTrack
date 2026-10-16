import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { newId, type PhotoDraft, type WeightEntry } from '@/lib/weight'
import { WeightFields, type WeightFormValues } from '@/components/weight-fields'

type WeightEntryEditSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: WeightEntry
  onSubmit: (values: WeightFormValues) => void
  onDelete: () => void
  isSaving: boolean
  error: string | null
}

/** Seeds the form from the entry, marking its photos as already saved. */
const valuesFromEntry = (entry: WeightEntry): WeightFormValues => ({
  date: entry.date,
  weight: entry.weight,
  measurements: { ...entry.measurements },
  photos: entry.photos.map((photo, i) => ({
    id: newId('photo'),
    url: photo.url,
    name: `Photo ${i + 1}`,
    file: null,
    photoId: photo.id,
  })),
})

export function WeightEntryEditSheet({
  open,
  onOpenChange,
  entry,
  onSubmit,
  onDelete,
  isSaving,
  error,
}: WeightEntryEditSheetProps) {
  const [values, setValues] = useState<WeightFormValues>(() =>
    valuesFromEntry(entry)
  )

  const seeded = useRef(entry.id)

  useEffect(() => {
    if (seeded.current === entry.id) return
    seeded.current = entry.id
    setValues(valuesFromEntry(entry))
  }, [entry])

  const addPhotos = (files: FileList) => {
    const next: PhotoDraft[] = Array.from(files).map((file) => ({
      id: newId('photo'),
      url: URL.createObjectURL(file),
      name: file.name,
      file,
      photoId: null,
    }))
    setValues((v) => ({ ...v, photos: [...v.photos, ...next] }))
  }

  const removePhoto = (id: string) => {
    setValues((v) => {
      const photo = v.photos.find((p) => p.id === id)
      // Only revoke URLs created in this session, not the entry's own previews.
      if (photo?.file) URL.revokeObjectURL(photo.url)
      return { ...v, photos: v.photos.filter((p) => p.id !== id) }
    })
  }

  const confirm = () => {
    if (!values.weight || values.weight <= 0) return
    onSubmit(values)
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
            idPrefix="edit"
            onSubmit={confirm}
            onAddPhotos={addPhotos}
            onRemovePhoto={(photo) => removePhoto(photo.id)}
          />

          {error ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex gap-3">
            <Button
              variant="destructive"
              size="lg"
              onClick={onDelete}
              disabled={isSaving}
            >
              <Trash2 />
              Delete
            </Button>
            <Button
              className="flex-1"
              size="lg"
              onClick={confirm}
              disabled={isSaving || !values.weight || values.weight <= 0}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
