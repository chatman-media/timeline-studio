/**
 * @vitest-environment jsdom
 */

import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { useMontageApplicator } from "../use-montage-applicator"
import type { MontagePlan } from "../../types/montage-plan"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(true),
}))

describe("useMontageApplicator", () => {
  const mockPlan: MontagePlan = {
    id: "test-plan",
    name: "Test Plan",
    style: "dynamic",
    targetDuration: 8,
    clips: [
      {
        fileId: "file-1",
        filePath: "/path/to/video1.mp4",
        startTime: 0,
        endTime: 5,
        duration: 5,
        reason: "Test clip 1",
      },
      {
        fileId: "file-2",
        filePath: "/path/to/video2.mp4",
        startTime: 5,
        endTime: 8,
        duration: 3,
        reason: "Test clip 2",
      },
    ],
    transitions: [
      {
        type: "cross_dissolve",
        duration: 0.5,
        atTime: 5,
      },
    ],
    musicSettings: {
      trackPath: "/path/to/music.mp3",
      volume: 0.3,
      startTime: 0,
      fadeIn: 2,
      fadeOut: 2,
    },
    textSettings: {
      titleText: "My Video",
      titleDuration: 3,
    },
    createdAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useMontageApplicator())

      expect(result.current.isApplying).toBe(false)
      expect(result.current.progress).toBe(0)
      expect(result.current.currentStep).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe("Apply Plan to Timeline", () => {
    it("should apply plan successfully", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.applyToTimeline(mockPlan)
      })

      await waitFor(() => {
        expect(result.current.isApplying).toBe(false)
        expect(result.current.progress).toBe(100)
      })
    })

    it("should track progress during application", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      const progressValues: number[] = []

      act(() => {
        result.current.applyToTimeline(mockPlan)
      })

      // Monitor progress changes
      await waitFor(() => {
        progressValues.push(result.current.progress)
        return result.current.progress === 100
      })

      expect(progressValues.some((p) => p > 0 && p < 100)).toBe(true)
    })

    it("should apply clips in correct order", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.applyToTimeline(mockPlan)
      })

      await waitFor(() => {
        expect(result.current.progress).toBe(100)
        expect(result.current.isApplying).toBe(false)
      })
    })

    it("should apply transitions", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.applyToTimeline(mockPlan)
      })

      await waitFor(() => {
        expect(result.current.progress).toBe(100)
      })
    })

    it("should apply music track", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.applyToTimeline(mockPlan)
      })

      await waitFor(() => {
        expect(result.current.progress).toBe(100)
        expect(result.current.currentStep).toBeNull()
      })
    })

    it("should apply text overlays", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.applyToTimeline(mockPlan)
      })

      await waitFor(() => {
        expect(result.current.progress).toBe(100)
        expect(result.current.currentStep).toBeNull()
      })
    })

    it("should handle application errors", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      const invalidPlan = {
        ...mockPlan,
        clips: [
          {
            ...mockPlan.clips[0],
            duration: -5, // Invalid duration
          },
        ],
      }

      await act(async () => {
        try {
          await result.current.applyToTimeline(invalidPlan)
        } catch (e) {
          // Expected error
        }
      })

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
        expect(result.current.error?.message).toContain("validation")
      })
    })
  })

  describe("Preview Mode", () => {
    it("should generate preview without applying", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.generatePreview(mockPlan)
      })

      expect(result.current.preview).toBeDefined()
      expect(result.current.preview?.clips).toHaveLength(2)
    })

    it("should include timeline representation", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.generatePreview(mockPlan)
      })

      expect(result.current.preview?.timelineRepresentation).toBeDefined()
      expect(result.current.preview?.totalDuration).toBe(8)
    })
  })

  describe("Validation", () => {
    it("should validate plan before applying", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      const invalidPlan = {
        ...mockPlan,
        clips: [],
      }

      await act(async () => {
        await result.current.applyToTimeline(invalidPlan)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error?.message).toContain("validation")
    })

    it("should check file existence", async () => {
      const { result } = renderHook(() => useMontageApplicator())
      const { invoke } = await import("@tauri-apps/api/core")

      vi.mocked(invoke).mockResolvedValue(false) // File doesn't exist

      await act(async () => {
        await result.current.validateFiles(mockPlan)
      })

      expect(result.current.validationResult?.missingFiles).toHaveLength(2)
    })

    it("should report validation results", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.validatePlan(mockPlan)
      })

      expect(result.current.validationResult).toBeDefined()
      expect(result.current.validationResult?.isValid).toBe(true)
    })
  })

  describe("Undo/Redo", () => {
    it("should support undo after application", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.applyToTimeline(mockPlan)
      })

      expect(result.current.canUndo).toBe(true)

      await act(async () => {
        await result.current.undo()
      })

      expect(result.current.progress).toBe(0)
    })

    it("should support redo", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.applyToTimeline(mockPlan)
        await result.current.undo()
      })

      expect(result.current.canRedo).toBe(true)

      await act(async () => {
        await result.current.redo()
      })

      expect(result.current.progress).toBe(100)
    })
  })

  describe("Partial Application", () => {
    it("should apply only clips", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.applyPartial(mockPlan, {
          clips: true,
          transitions: false,
          music: false,
          text: false,
        })
      })

      await waitFor(() => {
        expect(result.current.progress).toBe(100)
        expect(result.current.isApplying).toBe(false)
      })
    })

    it("should apply only transitions", async () => {
      const { result } = renderHook(() => useMontageApplicator())

      await act(async () => {
        await result.current.applyPartial(mockPlan, {
          clips: false,
          transitions: true,
          music: false,
          text: false,
        })
      })

      await waitFor(() => {
        expect(result.current.progress).toBe(100)
        expect(result.current.isApplying).toBe(false)
      })
    })
  })

  describe("Progress Callbacks", () => {
    it("should call progress callback", async () => {
      const onProgress = vi.fn()
      const { result } = renderHook(() => useMontageApplicator({ onProgress }))

      await act(async () => {
        await result.current.applyToTimeline(mockPlan)
      })

      expect(onProgress).toHaveBeenCalled()
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
        percent: expect.any(Number),
        step: expect.any(String),
      }))
    })

    it("should call completion callback", async () => {
      const onComplete = vi.fn()
      const { result } = renderHook(() => useMontageApplicator({ onComplete }))

      await act(async () => {
        await result.current.applyToTimeline(mockPlan)
      })

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith({
          success: true,
          plan: mockPlan,
        })
      })
    })

    it("should call error callback", async () => {
      const onError = vi.fn()
      const { result } = renderHook(() => useMontageApplicator({ onError }))

      const { useTimeline } = await import("@/features/timeline/hooks/use-timeline")
      vi.mocked(useTimeline).mockReturnValue({
        addClip: vi.fn().mockRejectedValue(new Error("Test error")),
      } as any)

      await act(async () => {
        await result.current.applyToTimeline(mockPlan)
      })

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
      })
    })
  })
})
