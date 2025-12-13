/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для хука use-video-lazy-loading
 */

import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useVideoLazyLoading } from "../use-video-lazy-loading"

// Mock для IntersectionObserver
class MockIntersectionObserver {
  private callback: IntersectionObserverCallback
  private elements: Set<Element> = new Set()

  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback
  }

  observe(element: Element) {
    this.elements.add(element)
  }

  unobserve(element: Element) {
    this.elements.delete(element)
  }

  disconnect() {
    this.elements.clear()
  }

  // Helper для тестов
  trigger(isIntersecting: boolean, element?: Element) {
    const targetElement = element || Array.from(this.elements)[0]
    if (!targetElement) return

    const entries: IntersectionObserverEntry[] = [
      {
        isIntersecting,
        target: targetElement,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: isIntersecting ? 1 : 0,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: Date.now(),
      },
    ]

    this.callback(entries, this as any)
  }
}

describe("useVideoLazyLoading", () => {
  let mockObserver: MockIntersectionObserver
  let originalIntersectionObserver: typeof IntersectionObserver
  let constructorSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Save original
    originalIntersectionObserver = global.IntersectionObserver

    // Create spy for constructor calls
    constructorSpy = vi.fn()
    mockObserver = new MockIntersectionObserver(() => {})

    // Mock IntersectionObserver as class that can be tracked
    global.IntersectionObserver = class MockIO {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        ;(constructorSpy as any)(callback, options)
        mockObserver = new MockIntersectionObserver(callback, options)
        // biome-ignore lint/correctness/noConstructorReturn: необходимо для корректной работы mock - возвращаем mockObserver вместо this
        return mockObserver as any
      }
    } as any
  })

  afterEach(() => {
    // Restore original
    global.IntersectionObserver = originalIntersectionObserver
  })

  describe("Initialization", () => {
    it("should initialize with isVisible false by default", () => {
      const { result } = renderHook(() => useVideoLazyLoading())

      expect(result.current.isVisible).toBe(false)
      expect(result.current.hasBeenVisible).toBe(false)
    })

    it("should initialize with isVisible true when disabled", () => {
      const { result } = renderHook(() => useVideoLazyLoading({ disabled: true }))

      expect(result.current.isVisible).toBe(true)
      expect(result.current.hasBeenVisible).toBe(true)
    })

    it("should create IntersectionObserver with correct options", () => {
      renderHook(() =>
        useVideoLazyLoading({
          threshold: 0.5,
          rootMargin: "100px",
        }),
      )

      expect(constructorSpy).toHaveBeenCalledWith(expect.any(Function), {
        threshold: 0.5,
        rootMargin: "100px",
      })
    })

    it("should not create IntersectionObserver when disabled", () => {
      renderHook(() => useVideoLazyLoading({ disabled: true }))

      expect(constructorSpy).not.toHaveBeenCalled()
    })
  })

  describe("Element Observation", () => {
    it("should observe element when ref is set", () => {
      const { result } = renderHook(() => useVideoLazyLoading())
      const element = document.createElement("video")

      const observeSpy = vi.spyOn(mockObserver, "observe")

      result.current.ref(element)

      expect(observeSpy).toHaveBeenCalledWith(element)
    })

    it("should unobserve old element when ref changes", () => {
      const { result } = renderHook(() => useVideoLazyLoading())
      const element1 = document.createElement("video")
      const element2 = document.createElement("video")

      const unobserveSpy = vi.spyOn(mockObserver, "unobserve")

      result.current.ref(element1)
      result.current.ref(element2)

      expect(unobserveSpy).toHaveBeenCalledWith(element1)
    })

    it("should handle setting ref to null", () => {
      const { result } = renderHook(() => useVideoLazyLoading())
      const element = document.createElement("video")

      result.current.ref(element)
      expect(() => result.current.ref(null)).not.toThrow()
    })
  })

  describe("Visibility Changes", () => {
    it("should update isVisible when element becomes visible", async () => {
      const { result } = renderHook(() => useVideoLazyLoading())
      const element = document.createElement("video")

      result.current.ref(element)

      // Trigger intersection
      mockObserver.trigger(true, element)

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })
    })

    it("should update isVisible when element becomes invisible", async () => {
      const { result } = renderHook(() => useVideoLazyLoading())
      const element = document.createElement("video")

      result.current.ref(element)

      // Make visible first
      mockObserver.trigger(true, element)
      await waitFor(() => expect(result.current.isVisible).toBe(true))

      // Then invisible
      mockObserver.trigger(false, element)
      await waitFor(() => {
        expect(result.current.isVisible).toBe(false)
      })
    })

    it("should set hasBeenVisible to true when element becomes visible", async () => {
      const { result } = renderHook(() => useVideoLazyLoading())
      const element = document.createElement("video")

      result.current.ref(element)

      mockObserver.trigger(true, element)

      await waitFor(() => {
        expect(result.current.hasBeenVisible).toBe(true)
      })
    })

    it("should keep hasBeenVisible true even when element becomes invisible", async () => {
      const { result } = renderHook(() => useVideoLazyLoading())
      const element = document.createElement("video")

      result.current.ref(element)

      // Make visible
      mockObserver.trigger(true, element)
      await waitFor(() => expect(result.current.hasBeenVisible).toBe(true))

      // Make invisible
      mockObserver.trigger(false, element)
      await waitFor(() => expect(result.current.isVisible).toBe(false))

      // hasBeenVisible should still be true
      expect(result.current.hasBeenVisible).toBe(true)
    })
  })

  describe("Cleanup", () => {
    it("should disconnect observer on unmount", () => {
      const { unmount } = renderHook(() => useVideoLazyLoading())

      const disconnectSpy = vi.spyOn(mockObserver, "disconnect")

      unmount()

      expect(disconnectSpy).toHaveBeenCalled()
    })

    it("should reconnect observer when options change", () => {
      const { rerender } = renderHook(({ threshold }) => useVideoLazyLoading({ threshold }), {
        initialProps: { threshold: 0.1 },
      })

      const firstObserver = mockObserver
      const disconnectSpy = vi.spyOn(firstObserver, "disconnect")

      // Change options
      rerender({ threshold: 0.5 })

      expect(disconnectSpy).toHaveBeenCalled()
      expect(constructorSpy).toHaveBeenCalledTimes(2)
    })

    it("should not create observer after disabled is set to true", () => {
      const { rerender } = renderHook(({ disabled }) => useVideoLazyLoading({ disabled }), {
        initialProps: { disabled: false },
      })

      // Should have created observer
      expect(constructorSpy).toHaveBeenCalledTimes(1)

      // Disable
      rerender({ disabled: true })

      // Should disconnect but not create new one
      expect(constructorSpy).toHaveBeenCalledTimes(1) // Still 1, not 2
    })
  })

  describe("Edge Cases", () => {
    it("should handle multiple intersection changes rapidly", async () => {
      const { result } = renderHook(() => useVideoLazyLoading())
      const element = document.createElement("video")

      result.current.ref(element)

      // Rapidly toggle visibility
      mockObserver.trigger(true, element)
      mockObserver.trigger(false, element)
      mockObserver.trigger(true, element)
      mockObserver.trigger(false, element)

      await waitFor(() => {
        expect(result.current.isVisible).toBe(false)
        expect(result.current.hasBeenVisible).toBe(true)
      })
    })

    it("should handle observing before setting ref", () => {
      const { result } = renderHook(() => useVideoLazyLoading())

      // Observer is created even without ref
      expect(constructorSpy).toHaveBeenCalled()

      // Setting ref later should work
      const element = document.createElement("video")
      expect(() => result.current.ref(element)).not.toThrow()
    })

    it("should handle default options", () => {
      renderHook(() => useVideoLazyLoading())

      expect(constructorSpy).toHaveBeenCalledWith(expect.any(Function), {
        threshold: 0.1,
        rootMargin: "50px",
      })
    })

    it("should use custom threshold and rootMargin", () => {
      renderHook(() =>
        useVideoLazyLoading({
          threshold: 0.75,
          rootMargin: "200px",
        }),
      )

      expect(constructorSpy).toHaveBeenCalledWith(expect.any(Function), {
        threshold: 0.75,
        rootMargin: "200px",
      })
    })
  })

  describe("Disabled Mode", () => {
    it("should not observe element when disabled", () => {
      const { result } = renderHook(() => useVideoLazyLoading({ disabled: true }))
      const element = document.createElement("video")

      const observeSpy = vi.spyOn(mockObserver, "observe")

      result.current.ref(element)

      expect(observeSpy).not.toHaveBeenCalled()
    })

    it("should maintain isVisible=true throughout when disabled", async () => {
      const { result } = renderHook(() => useVideoLazyLoading({ disabled: true }))

      expect(result.current.isVisible).toBe(true)
      expect(result.current.hasBeenVisible).toBe(true)

      // Even with ref set, should stay true
      const element = document.createElement("video")
      result.current.ref(element)

      expect(result.current.isVisible).toBe(true)
      expect(result.current.hasBeenVisible).toBe(true)
    })

    it("should work correctly when toggling disabled state", () => {
      const { rerender, result } = renderHook(({ disabled }) => useVideoLazyLoading({ disabled }), {
        initialProps: { disabled: false },
      })

      const element = document.createElement("video")
      result.current.ref(element)

      // Initially not visible
      expect(result.current.isVisible).toBe(false)

      // Enable disabled mode
      rerender({ disabled: true })

      // Should become visible
      expect(result.current.isVisible).toBe(true)
      expect(result.current.hasBeenVisible).toBe(true)
    })
  })
})
