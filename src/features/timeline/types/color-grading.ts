/**
 * Color Grading types for Timeline
 * TODO: Consider migrating to @/domains/video-editing/types
 */

/**
 * Применение цветокоррекции
 */
export interface AppliedColorGrading {
  id: string

  // Color Wheels
  colorWheels: {
    lift: { r: number; g: number; b: number }
    gamma: { r: number; g: number; b: number }
    gain: { r: number; g: number; b: number }
    offset: { r: number; g: number; b: number }
  }

  // Basic Parameters
  basicParameters: {
    temperature: number // -100 to 100
    tint: number // -100 to 100
    contrast: number // -100 to 100
    pivot: number // 0 to 1
    saturation: number // -100 to 100
    hue: number // -180 to 180
    luminance: number // -100 to 100
  }

  // Curves
  curves: {
    master: Array<{ x: number; y: number; id: string }>
    red: Array<{ x: number; y: number; id: string }>
    green: Array<{ x: number; y: number; id: string }>
    blue: Array<{ x: number; y: number; id: string }>
  }

  // LUT
  lut: {
    file: string | null
    intensity: number // 0 to 100
    isEnabled: boolean
  }

  // Preset reference
  presetId?: string

  isEnabled: boolean
}
