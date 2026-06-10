/**
 * @vitest-environment jsdom
 */
/**
 * Video Editing Provider Tests
 *
 * Tests for the main video editing domain provider
 */

import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { clearVideoEditingBindings, setVideoEditingBindings } from "@/core/services/video-editing-registry"
import { useVideoEditingContext, VideoEditingProvider } from "../video-editing-provider"

// Mock orchestrator
const mockOrchestrator = {
  getTimelineState: vi.fn(),
  getPlayerState: vi.fn(),
  getActors: vi.fn(() => ({
    timeline: {},
    player: {},
  })),
  subscribeToTimeline: vi.fn(() => ({ unsubscribe: vi.fn() })),
  subscribeToPlayer: vi.fn(() => ({ unsubscribe: vi.fn() })),
  createProject: vi.fn(),
  loadProject: vi.fn(),
  saveProject: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  stopPlayback: vi.fn(),
  seek: vi.fn(),
  addTrack: vi.fn(),
  addClip: vi.fn(),
}

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    infoSync: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
  }),
}))

// Mock orchestrator service
vi.mock("@/domains/video-editing/services/video-editing-orchestrator", () => ({
  getVideoEditingOrchestrator: () => mockOrchestrator,
}))

describe("VideoEditingProvider", () => {
  beforeEach(() => {
    clearVideoEditingBindings()
    setVideoEditingBindings({
      getVideoEditingOrchestrator: () => mockOrchestrator,
      UndoRedoHelpers: {
        createAddClipAction: vi.fn(),
        createBatchOperationAction: vi.fn(),
        createMoveClipAction: vi.fn(),
        createRemoveClipAction: vi.fn(),
      },
      useUndoRedo: vi.fn(),
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <VideoEditingProvider data-oid="ohmaokr">{children}</VideoEditingProvider>
  )

  describe("Provider Initialization", () => {
    it("should render without errors", () => {
      const { result } = renderHook(() => useVideoEditingContext(), {
        wrapper,
      })

      expect(result.current).toBeDefined()
    })

    it("should provide orchestrator instance", () => {
      const { result } = renderHook(() => useVideoEditingContext(), {
        wrapper,
      })

      expect(result.current.orchestrator).toBe(mockOrchestrator)
    })

    it("should provide same orchestrator instance on re-render", () => {
      const { result, rerender } = renderHook(() => useVideoEditingContext(), {
        wrapper,
      })

      const firstOrchestrator = result.current.orchestrator
      rerender()
      const secondOrchestrator = result.current.orchestrator

      expect(firstOrchestrator).toBe(secondOrchestrator)
    })
  })

  describe("Context Hook", () => {
    it("should throw error when used outside provider", () => {
      expect(() => {
        renderHook(() => useVideoEditingContext())
      }).toThrow("useVideoEditingContext must be used within VideoEditingProvider")
    })

    it("should provide context value within provider", () => {
      const { result } = renderHook(() => useVideoEditingContext(), {
        wrapper,
      })

      expect(result.current.orchestrator).toBeDefined()
      expect(typeof result.current.orchestrator).toBe("object")
    })
  })

  describe("Orchestrator Access", () => {
    it("should expose timeline methods", () => {
      const { result } = renderHook(() => useVideoEditingContext(), {
        wrapper,
      })

      expect(result.current.orchestrator.getTimelineState).toBeDefined()
      expect(result.current.orchestrator.subscribeToTimeline).toBeDefined()
      expect(result.current.orchestrator.addTrack).toBeDefined()
      expect(result.current.orchestrator.addClip).toBeDefined()
    })

    it("should expose player methods", () => {
      const { result } = renderHook(() => useVideoEditingContext(), {
        wrapper,
      })

      expect(result.current.orchestrator.getPlayerState).toBeDefined()
      expect(result.current.orchestrator.subscribeToPlayer).toBeDefined()
      expect(result.current.orchestrator.play).toBeDefined()
      expect(result.current.orchestrator.pause).toBeDefined()
      expect(result.current.orchestrator.seek).toBeDefined()
    })

    it("should expose project methods", () => {
      const { result } = renderHook(() => useVideoEditingContext(), {
        wrapper,
      })

      expect(result.current.orchestrator.createProject).toBeDefined()
      expect(result.current.orchestrator.loadProject).toBeDefined()
      expect(result.current.orchestrator.saveProject).toBeDefined()
    })

    it("should expose actor access", () => {
      const { result } = renderHook(() => useVideoEditingContext(), {
        wrapper,
      })

      const actors = result.current.orchestrator.getActors()
      expect(actors.timeline).toBeDefined()
      expect(actors.player).toBeDefined()
    })
  })

  describe("Multiple Children", () => {
    it("should provide context to multiple children", () => {
      const { result: result1 } = renderHook(() => useVideoEditingContext(), {
        wrapper,
      })
      const { result: result2 } = renderHook(() => useVideoEditingContext(), {
        wrapper,
      })

      expect(result1.current.orchestrator).toBe(mockOrchestrator)
      expect(result2.current.orchestrator).toBe(mockOrchestrator)
      expect(result1.current.orchestrator).toBe(result2.current.orchestrator)
    })
  })
})
