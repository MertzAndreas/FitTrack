import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'

type PhotoViewerProps = {
  photos: { url: string }[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

/** Full-screen photo, dismissed by tapping anywhere. */
export function PhotoViewer({
  photos,
  index,
  onClose,
  onIndexChange,
}: PhotoViewerProps) {
  const count = photos.length
  const photo = photos[index]

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Capture phase, so the drawer underneath does not also close.
        event.stopPropagation()
        onClose()
      }
      if (event.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count)
      if (event.key === 'ArrowRight') onIndexChange((index + 1) % count)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [index, count, onClose, onIndexChange])

  if (!photo) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2"
    >
      <img
        src={photo.url}
        alt=""
        className="max-h-full max-w-full object-contain"
      />

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation()
              onIndexChange((index - 1 + count) % count)
            }}
            className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center bg-background/70"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation()
              onIndexChange((index + 1) % count)
            }}
            className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center bg-background/70"
          >
            <ChevronRight />
          </button>
        </>
      ) : null}
    </div>
  )
}
