const MAX_DIMENSION = 1600
const QUALITY = 0.85

export async function downscaleImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const longest = Math.max(bitmap.width, bitmap.height)
  const ratio = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1
  const width = Math.round(bitmap.width * ratio)
  const height = Math.round(bitmap.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (context === null) {
    bitmap.close()
    return file
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY)
  )
  return blob ?? file
}
