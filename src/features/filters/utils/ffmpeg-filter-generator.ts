/**
 * FFmpeg Filter Generator
 *
 * Generates FFmpeg filter commands from VideoFilter parameters
 */

import type { VideoFilter } from "../types/filters"

/**
 * Generate FFmpeg filter string from VideoFilter
 *
 * This converts VideoFilter parameters to FFmpeg filter syntax for rendering.
 * The filters are applied in a chain using FFmpeg's filter_complex.
 *
 * @param filter - The filter to convert
 * @returns FFmpeg filter string
 *
 * @example
 * ```typescript
 * const filter = {
 *   id: "filter-1",
 *   name: "Cinematic",
 *   params: { brightness: 0.1, contrast: 1.2, saturation: 0.9 }
 * }
 * const ffmpegFilter = generateFFmpegFilter(filter)
 * // Returns: "eq=brightness=0.1:contrast=1.2:saturation=0.9"
 * ```
 */
export function generateFFmpegFilter(filter: VideoFilter): string {
  const { params } = filter
  const filterParts: string[] = []

  // Brightness, Contrast, Saturation - use 'eq' filter
  const eqParams: string[] = []
  if (params.brightness !== undefined && params.brightness !== 0) {
    eqParams.push(`brightness=${params.brightness}`)
  }
  if (params.contrast !== undefined && params.contrast !== 1) {
    eqParams.push(`contrast=${params.contrast}`)
  }
  if (params.saturation !== undefined && params.saturation !== 1) {
    eqParams.push(`saturation=${params.saturation}`)
  }
  if (params.gamma !== undefined && params.gamma !== 1) {
    eqParams.push(`gamma=${params.gamma}`)
  }

  if (eqParams.length > 0) {
    filterParts.push(`eq=${eqParams.join(":")}`)
  }

  // Hue - use 'hue' filter
  if (params.hue !== undefined && params.hue !== 0) {
    filterParts.push(`hue=h=${params.hue}`)
  }

  // Temperature - use 'colortemperature' or 'colorchannelmixer'
  if (params.temperature !== undefined && params.temperature !== 0) {
    // Temperature adjustment using colorchannelmixer
    // Positive values = warmer (more red), negative = cooler (more blue)
    const temp = params.temperature / 100 // Normalize to -1 to 1 range
    if (temp > 0) {
      // Warmer - increase red, decrease blue
      filterParts.push(`colorchannelmixer=rr=${1 + temp * 0.2}:bb=${1 - temp * 0.2}`)
    } else {
      // Cooler - decrease red, increase blue
      filterParts.push(`colorchannelmixer=rr=${1 + temp * 0.2}:bb=${1 - temp * 0.2}`)
    }
  }

  // Vibrance - use saturation with a curve
  if (params.vibrance !== undefined && params.vibrance !== 0) {
    const vibranceSat = 1 + params.vibrance * 0.5
    filterParts.push(`eq=saturation=${vibranceSat}`)
  }

  // Clarity - use unsharp mask
  if (params.clarity !== undefined && params.clarity !== 0) {
    const clarityAmount = Math.abs(params.clarity) * 5
    if (params.clarity > 0) {
      filterParts.push(`unsharp=5:5:${clarityAmount}:5:5:0`)
    } else {
      filterParts.push(`boxblur=${Math.abs(params.clarity) * 2}`)
    }
  }

  // Vignette - use vignette filter
  if (params.vignette !== undefined && params.vignette !== 0) {
    // angle and mode can be adjusted based on needs
    filterParts.push(`vignette=PI/4:${params.vignette}`)
  }

  // Grain - use noise filter
  if (params.grain !== undefined && params.grain !== 0) {
    const grainAmount = params.grain * 50 // Scale to FFmpeg noise range
    filterParts.push(`noise=alls=${grainAmount}:allf=t`)
  }

  // Dehaze - simulate using curves or levels
  if (params.dehaze !== undefined && params.dehaze !== 0) {
    const dehazeAmount = 1 + params.dehaze * 0.3
    filterParts.push(`eq=contrast=${dehazeAmount}:brightness=${params.dehaze * 0.1}`)
  }

  // Shadows and Highlights - use curves or colorlevels
  if (params.shadows !== undefined && params.shadows !== 0) {
    // Lift shadows
    const shadowsLift = params.shadows * 0.1
    filterParts.push(`curves=all='0/0 0.5/${0.5 + shadowsLift} 1/1'`)
  }

  if (params.highlights !== undefined && params.highlights !== 0) {
    // Adjust highlights
    const highlightsGain = params.highlights * 0.1
    filterParts.push(`curves=all='0/0 0.5/0.5 1/${1 - highlightsGain}'`)
  }

  // Blacks and Whites - use colorlevels
  if (params.blacks !== undefined && params.blacks !== 0) {
    const blacksLevel = params.blacks * 0.1
    filterParts.push(`colorlevels=rimin=${blacksLevel}:gimin=${blacksLevel}:bimin=${blacksLevel}`)
  }

  if (params.whites !== undefined && params.whites !== 0) {
    const whitesLevel = 1 - params.whites * 0.1
    filterParts.push(`colorlevels=rimax=${whitesLevel}:gimax=${whitesLevel}:bimax=${whitesLevel}`)
  }

  // If no filters were generated, return empty string
  if (filterParts.length === 0) {
    return ""
  }

  // Join all filters with comma (FFmpeg filter chain syntax)
  return filterParts.join(",")
}

/**
 * Generate FFmpeg filter chain for multiple filters
 *
 * @param filters - Array of filters to apply
 * @returns FFmpeg filter chain string
 */
export function generateFFmpegFilterChain(filters: VideoFilter[]): string {
  const filterStrings = filters.map(generateFFmpegFilter).filter((f) => f.length > 0)

  if (filterStrings.length === 0) {
    return ""
  }

  return filterStrings.join(",")
}

/**
 * Generate FFmpeg filter_complex input for clips with filters
 *
 * This generates the full filter_complex string for use in FFmpeg commands.
 *
 * @param clipFilters - Map of clip IDs to their filters
 * @returns FFmpeg filter_complex string
 */
export function generateFilterComplex(clipFilters: Record<string, VideoFilter[]>): string {
  const filterComplexParts: string[] = []

  Object.entries(clipFilters).forEach(([clipId, filters], index) => {
    const filterChain = generateFFmpegFilterChain(filters)
    if (filterChain) {
      // Input label: [0:v] for first video stream, [1:v] for second, etc.
      // Output label: [v0], [v1], etc.
      filterComplexParts.push(`[${index}:v]${filterChain}[v${index}]`)
    }
  })

  return filterComplexParts.join(";")
}

/**
 * Test if a filter has any non-default parameters
 *
 * @param filter - Filter to test
 * @returns true if filter has active parameters
 */
export function hasActiveParameters(filter: VideoFilter): boolean {
  const { params } = filter

  const defaultValues: Record<string, number> = {
    brightness: 0,
    contrast: 1,
    saturation: 1,
    gamma: 1,
    temperature: 0,
    tint: 0,
    hue: 0,
    vibrance: 0,
    shadows: 0,
    highlights: 0,
    blacks: 0,
    whites: 0,
    clarity: 0,
    dehaze: 0,
    vignette: 0,
    grain: 0,
  }

  return Object.entries(params).some(([key, value]) => {
    const defaultValue = defaultValues[key]
    return defaultValue !== undefined && value !== defaultValue
  })
}
