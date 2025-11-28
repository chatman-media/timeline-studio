/**
 * Mock Backend Provider for Testing
 *
 * Provides a mock backend context for integration tests.
 * Simulates backend state without actual Tauri/Rust connection.
 */

import type React from "react"
import { createContext, useContext, useMemo, useState } from "react"

/**
 * Mock playback state structure
 */
export interface MockPlaybackState {
  is_playing: boolean
  current_time: number
  playback_rate: number
  loop_enabled: boolean
  loop_start: number | null
  loop_end: number | null
  volume: number
  current_media_id: string | null
  selected_clip_id: string | null
}

/**
 * Mock prerender settings
 */
export interface MockPrerenderSettings {
  prerenderEnabled: boolean
  prerenderQuality: number
  prerenderSegmentDuration: number
  prerenderApplyEffects: boolean
  prerenderAutoPrerender: boolean
}

/**
 * Mock speed ramping settings
 */
export interface MockSpeedRamping {
  speedRampingEnabled: boolean
  speedRampPoints: Array<{ time: number; speed: number }>
}

/**
 * Mock project state structure
 */
export interface MockProjectState {
  playback_state: MockPlaybackState
  video_filters: any[]
  video_effects: any[]
  audio_filters: any[]
  audio_effects: any[]
  prerender_settings: MockPrerenderSettings
  speed_ramping: MockSpeedRamping
}

/**
 * Default mock project state
 */
const defaultMockState: MockProjectState = {
  playback_state: {
    is_playing: false,
    current_time: 0,
    playback_rate: 1,
    loop_enabled: false,
    loop_start: null,
    loop_end: null,
    volume: 1,
    current_media_id: null,
    selected_clip_id: null,
  },
  video_filters: [],
  video_effects: [],
  audio_filters: [],
  audio_effects: [],
  prerender_settings: {
    prerenderEnabled: false,
    prerenderQuality: 85,
    prerenderSegmentDuration: 10,
    prerenderApplyEffects: false,
    prerenderAutoPrerender: false,
  },
  speed_ramping: {
    speedRampingEnabled: false,
    speedRampPoints: [],
  },
}

/**
 * Mock backend context type
 */
interface MockBackendContextType {
  state: MockProjectState
  updateState: (updates: Partial<MockProjectState>) => void
  triggerStateChange: (state: Partial<MockProjectState>) => void
}

const MockBackendContext = createContext<MockBackendContextType | null>(null)

/**
 * Hook to access mock backend context
 */
export function useMockBackend() {
  const context = useContext(MockBackendContext)
  if (!context) {
    throw new Error("useMockBackend must be used within MockBackendProvider")
  }
  return context
}

/**
 * Mock Backend Provider Props
 */
interface MockBackendProviderProps {
  children: React.ReactNode
  initialState?: Partial<MockProjectState>
}

/**
 * Mock Backend Provider Component
 *
 * Wraps components with a mock backend context for testing.
 * Allows setting initial state and triggering state changes.
 */
export function MockBackendProvider({ children, initialState }: MockBackendProviderProps) {
  const [state, setState] = useState<MockProjectState>(() => ({
    ...defaultMockState,
    ...initialState,
    playback_state: {
      ...defaultMockState.playback_state,
      ...initialState?.playback_state,
    },
    prerender_settings: {
      ...defaultMockState.prerender_settings,
      ...initialState?.prerender_settings,
    },
    speed_ramping: {
      ...defaultMockState.speed_ramping,
      ...initialState?.speed_ramping,
    },
  }))

  const contextValue = useMemo<MockBackendContextType>(
    () => ({
      state,
      updateState: (updates) => {
        setState((prev) => ({
          ...prev,
          ...updates,
        }))
      },
      triggerStateChange: (updates) => {
        setState((prev) => ({
          ...prev,
          ...updates,
        }))
      },
    }),
    [state],
  )

  return <MockBackendContext.Provider value={contextValue}>{children}</MockBackendContext.Provider>
}
