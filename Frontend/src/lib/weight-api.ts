import { downscaleImage } from '@/lib/weight-image'
import {
  measurementFields,
  type Measurements,
  type PhotoDraft,
  type WeightEntry,
} from '@/lib/weight'

/** The shapes the backend speaks: dates are ISO strings, measurements a list. */
type ApiMeasurement = { kind: string; valueCm: number }
type ApiPhoto = { id: number; url: string }
type ApiEntry = {
  date: string
  weightKg: number
  measurements: ApiMeasurement[]
  photos: ApiPhoto[]
}

export type EntryValues = {
  date: string
  weight: number
  measurements: Measurements
  photos: PhotoDraft[]
}

async function send<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(message || `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

const toEntry = (api: ApiEntry): WeightEntry => ({
  id: api.date,
  date: api.date,
  weight: api.weightKg,
  measurements: Object.fromEntries(
    api.measurements.map((m) => [m.kind, m.valueCm])
  ) as Measurements,
  photos: api.photos,
})

export const weightApi = {
  async list(): Promise<WeightEntry[]> {
    const entries = await send<ApiEntry[]>(await fetch('/api/weight'))
    return entries.map(toEntry)
  },

  async save(values: EntryValues, original: WeightEntry | null): Promise<void> {
    await saveWeight(values)
    await syncPhotos(values, original)
  },

  async remove(date: string): Promise<void> {
    const response = await fetch(`/api/weight/${date}`, { method: 'DELETE' })
    if (!response.ok && response.status !== 404) {
      throw new Error('Could not delete the entry.')
    }
  },
}

async function saveWeight(values: EntryValues): Promise<void> {
  const response = await fetch(`/api/weight/${values.date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: values.date,
      weightKg: values.weight,
      measurements: measurementFields.flatMap((field) => {
        const value = values.measurements[field.key]
        return value == null ? [] : [{ kind: field.key, valueCm: value }]
      }),
    }),
  })
  await send<ApiEntry>(response)
}

async function syncPhotos(
  values: EntryValues,
  original: WeightEntry | null
): Promise<void> {
  if (original && original.date !== values.date) {
    await weightApi.remove(original.date)
    for (const draft of values.photos) {
      const image = draft.file
        ? await downscaleImage(draft.file)
        : await fetch(draft.url).then((r) => r.blob())
      await uploadPhoto(values.date, image)
    }
    return
  }

  const kept = new Set(
    values.photos
      .map((photo) => photo.photoId)
      .filter((id): id is number => id !== null)
  )
  for (const photo of original?.photos ?? []) {
    if (!kept.has(photo.id)) await deletePhoto(photo.id)
  }
  for (const draft of values.photos) {
    if (draft.file) await uploadPhoto(values.date, await downscaleImage(draft.file))
  }
}

async function uploadPhoto(date: string, image: Blob): Promise<ApiPhoto> {
  const body = new FormData()
  body.append('file', image, 'photo.jpg')
  const response = await fetch(`/api/weight/${date}/photos`, {
    method: 'POST',
    body,
  })
  return send<ApiPhoto>(response)
}

async function deletePhoto(id: number): Promise<void> {
  await fetch(`/api/weight/photos/${id}`, { method: 'DELETE' })
}
