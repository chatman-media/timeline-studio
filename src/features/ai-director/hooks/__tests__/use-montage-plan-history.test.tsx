/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MontagePlan } from "../../types/montage-plan"
import { useMontagePlanHistory } from "../use-montage-plan-history"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    infoSync: vi.fn(),
    errorSync: vi.fn(),
  }),
}))

describe("useMontagePlanHistory", () => {
  const mockPlan: MontagePlan = {
    id: "plan-1",
    name: "Test Plan",
    description: "Test montage plan",
    style: "dynamic",
    targetDuration: 120,
    actualDuration: 115,
    totalDuration: 115,
    clips: [
      {
        id: "file-1-10",
        videoId: "file-1",
        filePath: "/path/to/video.mp4",
        startTime: 10,
        endTime: 20,
        duration: 10,
        objects: [],
        people: [],
        tags: [],
        reason: "High quality",
      },
    ],
    transitions: [],
    metadata: {
      averageQuality: 0.8,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe("Initial State", () => {
    it("should initialize with empty history", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      expect(result.current.history).toEqual([])
    })

    it("should load history from localStorage", () => {
      const savedHistory = [
        {
          id: "history-1",
          plan: mockPlan,
          savedAt: new Date().toISOString(),
          isApplied: false,
        },
      ]

      localStorage.setItem("montage-plans-history", JSON.stringify(savedHistory))

      const { result } = renderHook(() => useMontagePlanHistory())

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].plan.id).toBe("plan-1")
    })

    it("should handle corrupted localStorage data", () => {
      localStorage.setItem("montage-plans-history", "invalid json")

      const { result } = renderHook(() => useMontagePlanHistory())

      expect(result.current.history).toEqual([])
    })
  })

  describe("Adding Plans", () => {
    it("should add plan to history", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      act(() => {
        result.current.addToHistory(mockPlan)
      })

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].plan.id).toBe("plan-1")
      expect(result.current.history[0].isApplied).toBe(false)
    })

    it("should add new plans to the beginning", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      const plan1 = { ...mockPlan, id: "plan-1" }
      const plan2 = { ...mockPlan, id: "plan-2" }

      act(() => {
        result.current.addToHistory(plan1)
      })

      act(() => {
        result.current.addToHistory(plan2)
      })

      expect(result.current.history).toHaveLength(2)
      expect(result.current.history[0].plan.id).toBe("plan-2")
      expect(result.current.history[1].plan.id).toBe("plan-1")
    })

    it("should limit history size to MAX_HISTORY_SIZE", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      // Add 21 plans (MAX_HISTORY_SIZE is 20)
      act(() => {
        for (let i = 0; i < 21; i++) {
          result.current.addToHistory({ ...mockPlan, id: `plan-${i}` })
        }
      })

      expect(result.current.history).toHaveLength(20)
      expect(result.current.history[0].plan.id).toBe("plan-20")
      expect(result.current.history[19].plan.id).toBe("plan-1")
    })

    it("should save to localStorage when adding", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      act(() => {
        result.current.addToHistory(mockPlan)
      })

      const stored = localStorage.getItem("montage-plans-history")
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(1)
    })
  })

  describe("Removing Plans", () => {
    it("should remove plan from history", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      act(() => {
        result.current.addToHistory(mockPlan)
      })

      const historyId = result.current.history[0].id

      act(() => {
        result.current.removeFromHistory(historyId)
      })

      expect(result.current.history).toHaveLength(0)
    })

    it("should update localStorage when removing", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      act(() => {
        result.current.addToHistory(mockPlan)
      })

      const historyId = result.current.history[0].id

      act(() => {
        result.current.removeFromHistory(historyId)
      })

      const stored = localStorage.getItem("montage-plans-history")
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(0)
    })
  })

  describe("Clearing History", () => {
    it("should clear all history", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      act(() => {
        result.current.addToHistory(mockPlan)
        result.current.addToHistory({ ...mockPlan, id: "plan-2" })
      })

      expect(result.current.history).toHaveLength(2)

      act(() => {
        result.current.clearHistory()
      })

      expect(result.current.history).toHaveLength(0)
    })

    it("should remove from localStorage when clearing", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      act(() => {
        result.current.addToHistory(mockPlan)
      })

      act(() => {
        result.current.clearHistory()
      })

      const stored = localStorage.getItem("montage-plans-history")
      expect(stored).toBeNull()
    })
  })

  describe("Marking as Applied", () => {
    it("should mark plan as applied", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      act(() => {
        result.current.addToHistory(mockPlan)
      })

      const historyId = result.current.history[0].id

      act(() => {
        result.current.markAsApplied(historyId)
      })

      expect(result.current.history[0].isApplied).toBe(true)
      expect(result.current.history[0].appliedAt).toBeInstanceOf(Date)
    })

    it("should update localStorage when marking as applied", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      act(() => {
        result.current.addToHistory(mockPlan)
      })

      const historyId = result.current.history[0].id

      act(() => {
        result.current.markAsApplied(historyId)
      })

      const stored = localStorage.getItem("montage-plans-history")
      const parsed = JSON.parse(stored!)
      expect(parsed[0].isApplied).toBe(true)
    })
  })

  describe("Getting Plans", () => {
    it("should get plan by ID", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      act(() => {
        result.current.addToHistory(mockPlan)
      })

      const historyId = result.current.history[0].id
      const plan = result.current.getPlanById(historyId)

      expect(plan).toBeTruthy()
      expect(plan?.id).toBe("plan-1")
    })

    it("should get plan by plan.id", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      act(() => {
        result.current.addToHistory(mockPlan)
      })

      const plan = result.current.getPlanById("plan-1")

      expect(plan).toBeTruthy()
      expect(plan?.id).toBe("plan-1")
    })

    it("should return null for non-existent plan", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      const plan = result.current.getPlanById("non-existent")

      expect(plan).toBeNull()
    })

    it("should get latest plan", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      const plan1 = { ...mockPlan, id: "plan-1" }
      const plan2 = { ...mockPlan, id: "plan-2" }

      act(() => {
        result.current.addToHistory(plan1)
        result.current.addToHistory(plan2)
      })

      const latest = result.current.getLatestPlan()

      expect(latest?.id).toBe("plan-2")
    })

    it("should return null when no plans exist", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      const latest = result.current.getLatestPlan()

      expect(latest).toBeNull()
    })

    it("should get applied plans", () => {
      const { result } = renderHook(() => useMontagePlanHistory())

      const plan1 = { ...mockPlan, id: "plan-1" }
      const plan2 = { ...mockPlan, id: "plan-2" }
      const plan3 = { ...mockPlan, id: "plan-3" }

      act(() => {
        result.current.addToHistory(plan1)
        result.current.addToHistory(plan2)
        result.current.addToHistory(plan3)
      })

      const history1Id = result.current.history.find((h) => h.plan.id === "plan-1")?.id
      const history3Id = result.current.history.find((h) => h.plan.id === "plan-3")?.id

      act(() => {
        result.current.markAsApplied(history1Id!)
        result.current.markAsApplied(history3Id!)
      })

      const appliedPlans = result.current.getAppliedPlans()

      expect(appliedPlans).toHaveLength(2)
      expect(appliedPlans.every((p) => p.isApplied)).toBe(true)
    })
  })
})
