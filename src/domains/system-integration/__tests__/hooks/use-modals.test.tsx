/**
 * Tests for useModals hook
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useModals } from "../../hooks/use-modals"
import { resetSystemIntegrationOrchestrator } from "../../services/system-integration-orchestrator"

describe("useModals", () => {
  beforeEach(() => {
    resetSystemIntegrationOrchestrator()
  })

  describe("Basic Functionality", () => {
    it("should initialize with no modal open", () => {
      const { result } = renderHook(() => useModals())

      expect(result.current.activeModal).toBe("none")
      expect(result.current.isModalOpen).toBe(false)
      expect(result.current.modalData).toBeNull()
    })

    it("should open modal", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openModal("user-settings")
      })

      expect(result.current.activeModal).toBe("user-settings")
      expect(result.current.isModalOpen).toBe(true)
    })

    it("should open modal with data", () => {
      const { result } = renderHook(() => useModals())

      const modalData = { testKey: "testValue" }

      act(() => {
        result.current.openModal("export", modalData)
      })

      expect(result.current.activeModal).toBe("export")
      expect(result.current.modalData).toEqual(modalData)
      expect(result.current.isModalOpen).toBe(true)
    })

    it("should close modal", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openModal("user-settings")
      })

      expect(result.current.isModalOpen).toBe(true)

      act(() => {
        result.current.closeModal()
      })

      expect(result.current.activeModal).toBe("none")
      expect(result.current.isModalOpen).toBe(false)
    })

    it("should submit modal", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openModal("project-settings")
      })

      const submitData = { name: "New Project" }

      act(() => {
        result.current.submitModal(submitData)
      })

      expect(result.current.activeModal).toBe("none")
      expect(result.current.isModalOpen).toBe(false)
    })
  })

  describe("Specific Modal Methods", () => {
    it("should open camera capture modal", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openCameraCapture()
      })

      expect(result.current.activeModal).toBe("camera-capture")
    })

    it("should open voice recording modal", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openVoiceRecording()
      })

      expect(result.current.activeModal).toBe("voice-recording")
    })

    it("should open export modal", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openExport()
      })

      expect(result.current.activeModal).toBe("export")
    })

    it("should open project settings modal", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openProjectSettings()
      })

      expect(result.current.activeModal).toBe("project-settings")
    })

    it("should open user settings modal", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openUserSettings()
      })

      expect(result.current.activeModal).toBe("user-settings")
    })

    it("should open keyboard shortcuts modal", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openKeyboardShortcuts()
      })

      expect(result.current.activeModal).toBe("keyboard-shortcuts")
    })

    it("should open color grading modal", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openColorGrading()
      })

      expect(result.current.activeModal).toBe("color-grading")
    })

    it("should open effect detail modal with effect id", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openEffectDetail("blur-effect")
      })

      expect(result.current.activeModal).toBe("effect-detail")
      expect(result.current.modalData).toEqual({ effectId: "blur-effect" })
    })

    it("should open effect detail modal with effect id and additional data", () => {
      const { result } = renderHook(() => useModals())

      const additionalData = { intensity: 50 }

      act(() => {
        result.current.openEffectDetail("blur-effect", additionalData)
      })

      expect(result.current.activeModal).toBe("effect-detail")
      expect(result.current.modalData).toEqual({
        effectId: "blur-effect",
        intensity: 50,
      })
    })
  })

  describe("Modal Stack Behavior", () => {
    it("should replace current modal when opening new one", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openModal("user-settings")
      })

      expect(result.current.activeModal).toBe("user-settings")

      act(() => {
        result.current.openModal("project-settings")
      })

      expect(result.current.activeModal).toBe("project-settings")
    })

    it("should handle rapid modal changes", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openModal("user-settings")
        result.current.openModal("project-settings")
        result.current.openModal("export")
        result.current.closeModal()
      })

      expect(result.current.activeModal).toBe("none")
      expect(result.current.isModalOpen).toBe(false)
    })
  })

  describe("Data Management", () => {
    it("should preserve modal data when modal is open", () => {
      const { result } = renderHook(() => useModals())

      const data = { key1: "value1", key2: "value2" }

      act(() => {
        result.current.openModal("export", data)
      })

      expect(result.current.modalData).toEqual(data)
    })

    it("should clear modal data on close", () => {
      const { result } = renderHook(() => useModals())

      const data = { key: "value" }

      act(() => {
        result.current.openModal("export", data)
      })

      expect(result.current.modalData).toEqual(data)

      act(() => {
        result.current.closeModal()
      })

      expect(result.current.modalData).toBeNull()
    })

    it("should clear modal data on submit", () => {
      const { result } = renderHook(() => useModals())

      const data = { key: "value" }

      act(() => {
        result.current.openModal("project-settings", data)
      })

      expect(result.current.modalData).toEqual(data)

      act(() => {
        result.current.submitModal()
      })

      expect(result.current.modalData).toBeNull()
    })
  })

  describe("Edge Cases", () => {
    it("should handle closing modal when none is open", () => {
      const { result } = renderHook(() => useModals())

      expect(() => {
        act(() => {
          result.current.closeModal()
        })
      }).not.toThrow()

      expect(result.current.activeModal).toBe("none")
    })

    it("should handle submitting modal when none is open", () => {
      const { result } = renderHook(() => useModals())

      expect(() => {
        act(() => {
          result.current.submitModal()
        })
      }).not.toThrow()

      expect(result.current.activeModal).toBe("none")
    })

    it("should handle opening modal with undefined data", () => {
      const { result } = renderHook(() => useModals())

      act(() => {
        result.current.openModal("export", undefined)
      })

      expect(result.current.activeModal).toBe("export")
      expect(result.current.modalData).toBeNull()
    })

    it("should handle specific modal methods with data", () => {
      const { result } = renderHook(() => useModals())

      const data = { customField: "value" }

      act(() => {
        result.current.openCameraCapture(data)
      })

      expect(result.current.activeModal).toBe("camera-capture")
      expect(result.current.modalData).toEqual(data)
    })
  })

  describe("Subscription Updates", () => {
    it("should update state when modal changes externally", () => {
      const { result } = renderHook(() => useModals())

      // Access orchestrator directly to simulate external change
      const orchestrator = (result.current as any).orchestrator

      act(() => {
        orchestrator.openModal("user-settings")
      })

      // Hook should reflect the change
      expect(result.current.activeModal).toBe("user-settings")
      expect(result.current.isModalOpen).toBe(true)
    })
  })

  describe("Hook Cleanup", () => {
    it("should cleanup subscription on unmount", () => {
      const { unmount, result } = renderHook(() => useModals())

      act(() => {
        result.current.openModal("user-settings")
      })

      expect(() => {
        unmount()
      }).not.toThrow()
    })
  })
})
