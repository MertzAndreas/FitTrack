import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { newId, type PhotoDraft } from '@/lib/weight'
import { today } from '@/lib/weight-dates'
import { WeightFields, type WeightFormValues } from '@/components/weight-fields'

type WeightEntryAddSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: WeightFormValues) => void
  isSaving: boolean
  error: string | null
}

const emptyValues = (): WeightFormValues => ({
  date: today(),
  weight: 0,
  measurements: {},
  photos: [],
})

export function WeightEntryAddSheet({
  open,
  onOpenChange,
  onSubmit,
  isSaving,
  error,
}: WeightEntryAddSheetProps) {
  const [values, setValues] = useState<WeightFormValues>(emptyValues)

  // Reset to a fresh draft each time the sheet opens.
  useEffect(() => {
    if (open) setValues(emptyValues())
  }, [open])

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
      if (photo) URL.revokeObjectURL(photo.url)
      return { ...v, photos: v.photos.filter((p) => p.id !== id) }
    })
  }

  const confirm = () => {
    if (!values.weight || values.weight <= 0) return
    onSubmit(values)
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
            idPrefix="add"
            onSubmit={confirm}
            onAddPhotos={addPhotos}
            onRemovePhoto={(photo) => removePhoto(photo.id)}
            focusWeight={open}
          />

          {error ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex gap-3">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              size="lg"
              onClick={confirm}
              disabled={isSaving || !values.weight || values.weight <= 0}
            >
              {isSaving ? 'Saving…' : 'Add entry'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
