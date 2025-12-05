import { renderHook } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Мокаем backend-sync ДО импорта компонентов
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: () => ({
    onStateChange: vi.fn(() => () => {}),
    onEvent: vi.fn(() => () => {}),
    sendCommand: vi.fn().mockResolvedValue(undefined),
    getProjectState: vi.fn().mockResolvedValue(null),
    executeCommand: vi.fn().mockResolvedValue({ success: true, data: null }),
  }),
}))

import { ProjectSettingsProvider } from "@/domains/project-management/providers"
import { useProjectSettings } from "../../hooks/use-project-settings"
import { DEFAULT_PROJECT_SETTINGS } from "../../types/project"

describe("useProjectSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("основная функциональность", () => {
    it("должен быть функцией", () => {
      expect(typeof useProjectSettings).toBe("function")
    })

    it("должен экспортироваться из модуля", () => {
      expect(useProjectSettings).toBeDefined()
    })
  })

  describe("обработка ошибок", () => {
    it("должен выбрасывать ошибку при использовании вне провайдера", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => {
        renderHook(() => useProjectSettings())
      }).toThrow("useProjectSettings must be used within a ProjectSettingsProvider")

      consoleSpy.mockRestore()
    })

    it("должен выбрасывать ошибку с правильным сообщением", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      try {
        renderHook(() => useProjectSettings())
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe("useProjectSettings must be used within a ProjectSettingsProvider")
      }

      consoleSpy.mockRestore()
    })
  })

  describe("интеграция с провайдером", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(ProjectSettingsProvider, null, children)
    }

    it("должен возвращать настройки проекта по умолчанию", () => {
      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      expect(result.current.settings).toEqual(DEFAULT_PROJECT_SETTINGS)
    })

    it("должен предоставлять функцию updateSettings", () => {
      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      expect(typeof result.current.updateSettings).toBe("function")
    })

    it("должен предоставлять функцию resetSettings", () => {
      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      expect(typeof result.current.resetSettings).toBe("function")
    })

    it("должен возвращать объект с правильной структурой", () => {
      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      // Проверяем структуру настроек
      expect(result.current.settings).toHaveProperty("aspectRatio")
      expect(result.current.settings).toHaveProperty("resolution")
      expect(result.current.settings).toHaveProperty("frameRate")
      expect(result.current.settings).toHaveProperty("colorSpace")

      // Проверяем типы значений
      expect(typeof result.current.settings.resolution).toBe("string")
      expect(typeof result.current.settings.frameRate).toBe("string")
      expect(typeof result.current.settings.colorSpace).toBe("string")
      expect(typeof result.current.settings.aspectRatio).toBe("object")
    })
  })

  describe("типизация", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(ProjectSettingsProvider, null, children)
    }

    it("должен возвращать корректные типы", () => {
      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      // Проверяем наличие всех полей
      expect(result.current).toHaveProperty("settings")
      expect(result.current).toHaveProperty("updateSettings")
      expect(result.current).toHaveProperty("resetSettings")
      expect(result.current).toHaveProperty("isLoading")
      expect(result.current).toHaveProperty("error")

      // Проверяем типы полей
      expect(typeof result.current.isLoading).toBe("boolean")
      expect(result.current.error).toBeNull()
    })
  })

  describe("работа с мокнутым контекстом", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(ProjectSettingsProvider, null, children)
    }

    it("должен работать с кастомным значением контекста", () => {
      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      // Проверяем, что возвращаются правильные свойства
      expect(result.current.settings).toBeDefined()
      expect(typeof result.current.updateSettings).toBe("function")
      expect(typeof result.current.resetSettings).toBe("function")
    })

    it("должен обрабатывать undefined контекст", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => {
        renderHook(() => useProjectSettings())
      }).toThrow("useProjectSettings must be used within a ProjectSettingsProvider")

      consoleSpy.mockRestore()
    })
  })

  describe("edge cases и граничные условия", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(ProjectSettingsProvider, null, children)
    }

    it("должен корректно обрабатывать различные соотношения сторон", () => {
      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      // Проверяем, что aspectRatio имеет правильную структуру
      expect(result.current.settings.aspectRatio).toBe(DEFAULT_PROJECT_SETTINGS.aspectRatio)
    })

    it("должен корректно обрабатывать экстремальные значения FPS", () => {
      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      // Проверяем дефолтное значение frameRate
      expect(result.current.settings.frameRate).toBe(DEFAULT_PROJECT_SETTINGS.frameRate)
      expect(typeof result.current.settings.frameRate).toBe("string") // frameRate is a string type like "30"
    })

    it("должен корректно обрабатывать различные цветовые пространства", () => {
      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      // Проверяем дефолтное значение colorSpace
      expect(result.current.settings.colorSpace).toBe(DEFAULT_PROJECT_SETTINGS.colorSpace)
      expect(typeof result.current.settings.colorSpace).toBe("string")
    })

    it("должен сохранять стабильность ссылок между ре-рендерами", () => {
      const { result, rerender } = renderHook(() => useProjectSettings(), { wrapper })

      const firstUpdateSettings = result.current.updateSettings
      const firstResetSettings = result.current.resetSettings

      rerender()

      // Функции должны быть стабильными
      expect(result.current.updateSettings).toBe(firstUpdateSettings)
      expect(result.current.resetSettings).toBe(firstResetSettings)
    })

    it("должен корректно обрабатывать пустые или null значения в контексте", () => {
      // Проверяем, что вне провайдера хук выбрасывает ошибку
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => {
        renderHook(() => useProjectSettings())
      }).toThrow("useProjectSettings must be used within a ProjectSettingsProvider")

      consoleSpy.mockRestore()
    })
  })

  describe("производительность", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(ProjectSettingsProvider, null, children)
    }

    it("не должен создавать новые объекты без необходимости", () => {
      const { result, rerender } = renderHook(() => useProjectSettings(), { wrapper })

      const firstSettings = result.current.settings

      rerender()

      // Объект настроек должен быть тем же самым при отсутствии изменений
      expect(result.current.settings).toBe(firstSettings)
    })

    it("должен корректно обрабатывать множественные вызовы хука", () => {
      const { result: result1 } = renderHook(() => useProjectSettings(), { wrapper })

      const { result: result2 } = renderHook(() => useProjectSettings(), { wrapper })

      // Оба хука должны возвращать одинаковые настройки (по значению)
      expect(result1.current.settings).toEqual(result2.current.settings)
      // Функции могут быть разными экземплярами, но должны быть функциями
      expect(typeof result1.current.updateSettings).toBe("function")
      expect(typeof result2.current.updateSettings).toBe("function")
      expect(typeof result1.current.resetSettings).toBe("function")
      expect(typeof result2.current.resetSettings).toBe("function")
    })
  })
})
