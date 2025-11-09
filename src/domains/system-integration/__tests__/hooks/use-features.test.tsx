/**
 * Tests for useFeatures hook
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useFeatures } from "../../hooks/use-features"
import { resetSystemIntegrationOrchestrator } from "../../services/system-integration-orchestrator"

// Mock service config
vi.mock("@/shared/config/service-config", () => ({
  isServiceEnabled: vi.fn(() => true),
}))

describe("useFeatures", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetSystemIntegrationOrchestrator()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("should initialize with empty features", () => {
      const { result } = renderHook(() => useFeatures())

      expect(result.current.features).toBeDefined()
      expect(typeof result.current.features).toBe("object")
    })

    it("should initialize convenience flags as false", () => {
      const { result } = renderHook(() => useFeatures())

      expect(result.current.aiAnalysisEnabled).toBe(false)
      expect(result.current.smartMontageEnabled).toBe(false)
      expect(result.current.visionServiceEnabled).toBe(false)
      expect(result.current.multiCameraEnabled).toBe(false)
      expect(result.current.cloudSyncEnabled).toBe(false)
      expect(result.current.collaborationEnabled).toBe(false)
      expect(result.current.advancedColorGradingEnabled).toBe(false)
    })
  })

  describe("Toggle Feature", () => {
    it("should enable a feature", () => {
      const { result } = renderHook(() => useFeatures())

      act(() => {
        result.current.toggleFeature("aiAnalysis", true)
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.isFeatureEnabled("aiAnalysis")).toBe(true)
      expect(result.current.aiAnalysisEnabled).toBe(true)
    })

    it("should disable a feature", () => {
      const { result } = renderHook(() => useFeatures())

      act(() => {
        result.current.toggleFeature("aiAnalysis", true)
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      act(() => {
        result.current.toggleFeature("aiAnalysis", false)
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.isFeatureEnabled("aiAnalysis")).toBe(false)
      expect(result.current.aiAnalysisEnabled).toBe(false)
    })

    it("should toggle feature without explicit state", () => {
      const { result } = renderHook(() => useFeatures())

      act(() => {
        result.current.toggleFeature("smartMontage")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.isFeatureEnabled("smartMontage")).toBe(true)

      act(() => {
        result.current.toggleFeature("smartMontage")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.isFeatureEnabled("smartMontage")).toBe(false)
    })
  })

  describe("Enable/Disable Shortcuts", () => {
    it("should enable feature using enableFeature", () => {
      const { result } = renderHook(() => useFeatures())

      act(() => {
        result.current.enableFeature("visionService")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.isFeatureEnabled("visionService")).toBe(true)
      expect(result.current.visionServiceEnabled).toBe(true)
    })

    it("should disable feature using disableFeature", () => {
      const { result } = renderHook(() => useFeatures())

      act(() => {
        result.current.enableFeature("multiCamera")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      act(() => {
        result.current.disableFeature("multiCamera")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.isFeatureEnabled("multiCamera")).toBe(false)
      expect(result.current.multiCameraEnabled).toBe(false)
    })
  })

  describe("Batch Feature Updates", () => {
    it("should set multiple features at once", () => {
      const { result } = renderHook(() => useFeatures())

      act(() => {
        result.current.setFeatures({
          aiAnalysis: true,
          smartMontage: true,
          visionService: false,
        })
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.aiAnalysisEnabled).toBe(true)
      expect(result.current.smartMontageEnabled).toBe(true)
      expect(result.current.visionServiceEnabled).toBe(false)
    })

    it("should update existing features with setFeatures", () => {
      const { result } = renderHook(() => useFeatures())

      act(() => {
        result.current.enableFeature("aiAnalysis")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.aiAnalysisEnabled).toBe(true)

      act(() => {
        result.current.setFeatures({
          aiAnalysis: false,
          cloudSync: true,
        })
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.aiAnalysisEnabled).toBe(false)
      expect(result.current.cloudSyncEnabled).toBe(true)
    })
  })

  describe("Feature Query", () => {
    it("should check if feature is enabled", () => {
      const { result } = renderHook(() => useFeatures())

      expect(result.current.isFeatureEnabled("aiAnalysis")).toBe(false)

      act(() => {
        result.current.enableFeature("aiAnalysis")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.isFeatureEnabled("aiAnalysis")).toBe(true)
    })

    it("should return false for unknown feature", () => {
      const { result } = renderHook(() => useFeatures())

      expect(result.current.isFeatureEnabled("unknownFeature")).toBe(false)
    })
  })

  describe("Known Features", () => {
    it("should track all known features", () => {
      const { result } = renderHook(() => useFeatures())

      const knownFeatures = [
        "aiAnalysis",
        "smartMontage",
        "visionService",
        "multiCamera",
        "cloudSync",
        "collaboration",
        "advancedColorGrading",
      ]

      knownFeatures.forEach((feature) => {
        expect(result.current.features[feature]).toBeDefined()
        expect(typeof result.current.features[feature]).toBe("boolean")
      })
    })

    it("should enable all known features", () => {
      const { result } = renderHook(() => useFeatures())

      act(() => {
        result.current.enableFeature("aiAnalysis")
        result.current.enableFeature("smartMontage")
        result.current.enableFeature("visionService")
        result.current.enableFeature("multiCamera")
        result.current.enableFeature("cloudSync")
        result.current.enableFeature("collaboration")
        result.current.enableFeature("advancedColorGrading")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.aiAnalysisEnabled).toBe(true)
      expect(result.current.smartMontageEnabled).toBe(true)
      expect(result.current.visionServiceEnabled).toBe(true)
      expect(result.current.multiCameraEnabled).toBe(true)
      expect(result.current.cloudSyncEnabled).toBe(true)
      expect(result.current.collaborationEnabled).toBe(true)
      expect(result.current.advancedColorGradingEnabled).toBe(true)
    })
  })

  describe("Edge Cases", () => {
    it("should handle rapid feature toggles", () => {
      const { result } = renderHook(() => useFeatures())

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.toggleFeature("aiAnalysis")
        }
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // After even number of toggles, should be back to initial state (false)
      expect(result.current.aiAnalysisEnabled).toBe(false)
    })

    it("should handle enabling already enabled feature", () => {
      const { result } = renderHook(() => useFeatures())

      act(() => {
        result.current.enableFeature("smartMontage")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.smartMontageEnabled).toBe(true)

      act(() => {
        result.current.enableFeature("smartMontage")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.smartMontageEnabled).toBe(true)
    })

    it("should handle disabling already disabled feature", () => {
      const { result } = renderHook(() => useFeatures())

      expect(result.current.visionServiceEnabled).toBe(false)

      act(() => {
        result.current.disableFeature("visionService")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.visionServiceEnabled).toBe(false)
    })
  })

  describe("Service Disabled", () => {
    it("should handle features when service is disabled", async () => {
      const { isServiceEnabled } = await import("@/shared/config/service-config")
      vi.mocked(isServiceEnabled).mockReturnValue(false)

      const { result } = renderHook(() => useFeatures())

      // When service is disabled, all features should be false
      expect(result.current.aiAnalysisEnabled).toBe(false)
      expect(result.current.smartMontageEnabled).toBe(false)

      // Features should still be defined as an object
      expect(typeof result.current.features).toBe("object")
    })
  })

  describe("Feature State Persistence", () => {
    it("should maintain feature state across re-renders", () => {
      const { result, rerender } = renderHook(() => useFeatures())

      act(() => {
        result.current.enableFeature("aiAnalysis")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.aiAnalysisEnabled).toBe(true)

      rerender()

      expect(result.current.aiAnalysisEnabled).toBe(true)
    })
  })

  describe("Hook Cleanup", () => {
    it("should cleanup interval on unmount", () => {
      const { unmount } = renderHook(() => useFeatures())

      const clearIntervalSpy = vi.spyOn(global, "clearInterval")

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })
})
