import { renderHook } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

// Мокаем backend-sync ДО импорта компонентов
vi.mock("@/domains/project-management/services/backend-sync", () => ({
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

describe("useProjectSettings - интеграционные тесты", () => {
  describe("интеграция с ProjectSettingsProvider", () => {
    it("должен корректно инициализироваться с настройками по умолчанию", () => {
      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      expect(result.current.settings).toEqual(DEFAULT_PROJECT_SETTINGS)
      expect(result.current.settings.aspectRatio.label).toBe("16:9")
      expect(result.current.settings.resolution).toBe("1920x1080")
      expect(result.current.settings.frameRate).toBe("30")
      expect(result.current.settings.colorSpace).toBe("sdr")
    })

    it("должен предоставлять функции для изменения настроек", () => {
      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      expect(typeof result.current.updateSettings).toBe("function")
      expect(typeof result.current.resetSettings).toBe("function")
    })

    it("должен работать с несколькими экземплярами хука", () => {
      const TestComponent = () => {
        const settings1 = useProjectSettings()
        const settings2 = useProjectSettings()

        // Оба хука должны возвращать одинаковые данные
        expect(settings1.settings).toEqual(settings2.settings)
        expect(settings1.updateSettings).toBe(settings2.updateSettings)
        expect(settings1.resetSettings).toBe(settings2.resetSettings)

        return null
      }

      expect(() => {
        renderHook(() => React.createElement(TestComponent), {
          wrapper: ProjectSettingsProvider,
        })
      }).not.toThrow()
    })
  })

  describe("совместимость с различными провайдерами", () => {
    it("должен работать в вложенных провайдерах", () => {
      const MultipleProvidersWrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectSettingsProvider>
          <div data-testid="outer-provider">
            <ProjectSettingsProvider>
              <div data-testid="inner-provider">{children}</div>
            </ProjectSettingsProvider>
          </div>
        </ProjectSettingsProvider>
      )

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: MultipleProvidersWrapper,
      })

      // Внутренний провайдер должен переопределить настройки
      expect(result.current.settings).toEqual(DEFAULT_PROJECT_SETTINGS)
    })

    it("должен предоставлять стабильный API", () => {
      const { result, rerender } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      const firstUpdateSettings = result.current.updateSettings
      const firstResetSettings = result.current.resetSettings

      // Ререндерим компонент
      rerender()

      // Ссылки на функции должны остаться прежними
      expect(result.current.updateSettings).toBe(firstUpdateSettings)
      expect(result.current.resetSettings).toBe(firstResetSettings)
    })
  })
})
