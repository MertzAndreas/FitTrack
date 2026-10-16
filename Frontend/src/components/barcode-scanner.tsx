import { CameraOff, LoaderCircle, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

// The BarcodeDetector API isn't in TypeScript's DOM lib yet, so we describe the
// small slice we use. Keep it local — no need for a global ambient declaration.
type DetectedBarcode = {
  rawValue: string
  format: string
}

type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>
}

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[]
}) => BarcodeDetectorInstance

/** Common retail barcodes. The detector falls back to all formats if any are unsupported. */
const SCAN_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf']

type BarcodeScannerProps = {
  onScan: (code: string) => void
  onCancel: () => void
}

type ScannerState = 'starting' | 'scanning' | 'error'

export function BarcodeScanner({ onScan, onCancel }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onScanRef = useRef(onScan)

  const [state, setState] = useState<ScannerState>('starting')
  const [error, setError] = useState('')

  // Keep the latest callback without restarting the camera on every render.
  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    let cancelled = false
    let raf = 0
    let busy = false

    const stop = () => {
      cancelled = true
      cancelAnimationFrame(raf)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    async function start() {
      const Detector = (
        window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
      ).BarcodeDetector

      if (!Detector) {
        setState('error')
        setError('Barcode scanning is not supported in this browser.')
        return
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'environment' },
        })
      } catch {
        if (!cancelled) {
          setState('error')
          setError('Camera access was denied or no camera was found.')
        }
        return
      }

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream

      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.muted = true
        await video.play().catch(() => {})
      }

      if (cancelled) return

      let detector: BarcodeDetectorInstance
      try {
        detector = new Detector({ formats: SCAN_FORMATS })
      } catch {
        detector = new Detector()
      }

      setState('scanning')

      const tick = () => {
        if (cancelled) return
        raf = requestAnimationFrame(tick)

        const v = videoRef.current
        if (!v || busy || v.readyState < 2) return

        busy = true
        detector
          .detect(v)
          .then((codes) => {
            const code = codes.find((c) => c.rawValue)
            if (code) {
              stop()
              onScanRef.current(code.rawValue)
            }
          })
          .catch(() => {})
          .finally(() => {
            busy = false
          })
      }

      raf = requestAnimationFrame(tick)
    }

    void start()

    return stop
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative h-[60dvh] overflow-hidden bg-black">
        {state === 'error' ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <CameraOff className="size-8 text-muted-foreground" />
            <p className="max-w-xs text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-5">
              <div className="relative size-56 border-2 border-white/60">
                <span className="absolute -top-0.5 -left-0.5 size-6 border-t-4 border-l-4 border-white" />
                <span className="absolute -top-0.5 -right-0.5 size-6 border-t-4 border-r-4 border-white" />
                <span className="absolute -right-0.5 -bottom-0.5 size-6 border-r-4 border-b-4 border-white" />
                <span className="absolute -bottom-0.5 -left-0.5 size-6 border-b-4 border-l-4 border-white" />
              </div>
              {state === 'starting' ? (
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <LoaderCircle className="size-4 animate-spin" />
                  Starting camera…
                </div>
              ) : (
                <p className="text-xs font-semibold tracking-widest text-white/80 uppercase">
                  Point at a barcode
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t p-3">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {state === 'error' ? 'Scanning unavailable' : 'Scanning for a barcode'}
        </p>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          <X />
          Cancel
        </Button>
      </div>
    </div>
  )
}
