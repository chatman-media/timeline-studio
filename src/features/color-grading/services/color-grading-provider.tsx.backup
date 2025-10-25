import { createContext, type ReactNode, useContext } from "react"

import { useColorGrading } from "../hooks/use-color-grading"
import type {
  BasicParametersState,
  ColorGradingState,
  ColorWheelType,
  CurvePoint,
  CurveType,
  RGBValue,
} from "../types/color-grading"
import type { ColorGradingPreset } from "../types/presets"

interface ColorGradingContextValue {
  state: ColorGradingState
  dispatch: (action: any) => void
  updateColorWheel: (wheelType: ColorWheelType, value: RGBValue) => void
  updateBasicParameter: (parameter: keyof BasicParametersState, value: number) => void
  updateCurve: (curveType: CurveType, points: CurvePoint[]) => void
  loadLUT: (file: string) => void
  setLUTIntensity: (intensity: number) => void
  toggleLUT: (enabled: boolean) => void
  togglePreview: (enabled: boolean) => void
  applyToClip: () => void
  resetAll: () => void
  autoCorrect: () => void
  loadPreset: (presetId: string) => void
  savePreset: (name: string) => void
  hasChanges: boolean
  isActive: boolean
  availablePresets: ColorGradingPreset[]
}

const ColorGradingContext = createContext<ColorGradingContextValue | null>(null)

export function ColorGradingProvider({ children }: { children: ReactNode }) {
  const colorGrading = useColorGrading()

  return <ColorGradingContext.Provider value={colorGrading}>{children}</ColorGradingContext.Provider>
}

export function useColorGradingContext() {
  const context = useContext(ColorGradingContext)
  if (!context) {
    throw new Error("useColorGradingContext must be used within ColorGradingProvider")
  }
  return context
}

// Экспортируем useColorGrading как синоним для useColorGradingContext
export { useColorGradingContext as useColorGrading }
