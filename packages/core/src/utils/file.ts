export function parseFileSize(sizeString: string): number | null {
  if (!sizeString || typeof sizeString !== "string") {
    return null
  }

  const match = sizeString.trim().match(/^([\d.]+)\s*([A-Za-z]+)$/)
  if (!match) {
    return null
  }

  const value = Number.parseFloat(match[1])
  const unit = match[2].toUpperCase()

  if (Number.isNaN(value) || value < 0) {
    return null
  }

  const units: Record<string, number> = {
    B: 1,
    BYTES: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
    PB: 1024 * 1024 * 1024 * 1024 * 1024,
  }

  const multiplier = units[unit]
  return multiplier ? Math.floor(value * multiplier) : null
}
