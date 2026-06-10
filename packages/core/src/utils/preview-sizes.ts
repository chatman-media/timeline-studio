export type ContentSize = { width: number; height: number }

export function calculateDimensionsWithAspectRatio(
  baseSize: number,
  aspectRatio: { width: number; height: number },
  isTemplate = false,
): ContentSize {
  const ratio = aspectRatio.width / aspectRatio.height
  const minTemplateSize = isTemplate ? 100 : 0
  const effectiveSize = isTemplate ? Math.max(baseSize, minTemplateSize) : baseSize

  if (ratio >= 1) {
    return {
      width: effectiveSize,
      height: Math.round(effectiveSize / ratio),
    }
  }

  return {
    width: Math.round(effectiveSize * ratio),
    height: effectiveSize,
  }
}
