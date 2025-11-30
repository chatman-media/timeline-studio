import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ProjectEvent, ProjectState } from "@/types/generated/tauri-bindings"
import { ProjectSettingsProvider, useProjectSettings } from "../../index"

// Создаем моки для backend
const mockOnStateChange = vi.fn()
const mockOnEvent = vi.fn()
const mockGetProjectState = vi.fn()
const mockExecuteCommand = vi.fn()
const mockSendCommand = vi.fn()

// Мокируем UpdateService ДО импорта компонентов
vi.mock("@/domains/system-integration/services/updates/update-service", () => ({
  UpdateService: {
    getInstance: vi.fn(() => ({
      checkForUpdates: vi.fn(),
      downloadUpdate: vi.fn(),
      installUpdate: vi.fn(),
      getCurrentVersion: vi.fn(() => "1.0.0"),
    })),
    logger: {
      info: vi.fn(),
      infoSync: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  },
}))

// Мокируем update-machine
vi.mock("@/domains/system-integration/machines/update-machine", () => ({
  createUpdateMachine: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    send: vi.fn(),
    getSnapshot: vi.fn(() => ({ value: "idle" })),
  })),
}))

// Мокируем container ДО импорта компонентов
vi.mock("@/core/container", () => ({
  container: {
    getBackend: () => ({
      onStateChange: mockOnStateChange,
      onEvent: mockOnEvent,
      sendCommand: mockSendCommand,
      getProjectState: mockGetProjectState,
      executeCommand: mockExecuteCommand,
    }),
  },
}))

// Мокируем tauri-logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe("ProjectSettingsProvider", () => {
  const mockBackendState: ProjectState = {
    project: {
      id: "test-project",
      name: "Test Project",
      created_at: Date.now(),
      updated_at: Date.now(),
      settings: {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        audio_sample_rate: 48000,
        audio_channels: 2,
      },
      timeline: {
        clips: [],
        tracks: [],
      },
    } as any,
  } as any

  beforeEach(() => {
    vi.clearAllMocks()

    // Настраиваем дефолтные моки
    mockOnStateChange.mockReturnValue(() => {})
    mockOnEvent.mockReturnValue(() => {})
    mockGetProjectState.mockResolvedValue(null)
    mockExecuteCommand.mockResolvedValue({ success: true, data: null })
  })

  describe("рендеринг и инициализация", () => {
    it("должен рендериться без ошибок", () => {
      const TestComponent = () => <div data-testid="test">Test</div>

      const { result } = renderHook(
        () => ({
          component: <TestComponent />,
        }),
        {
          wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
        },
      )

      expect(result.current.component).toBeDefined()
    })

    it("должен быть React компонентом", () => {
      expect(typeof ProjectSettingsProvider).toBe("function")
    })

    it("должен подписаться на backend события при монтировании", async () => {
      renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(mockOnEvent).toHaveBeenCalled()
        expect(mockOnStateChange).toHaveBeenCalled()
        expect(mockGetProjectState).toHaveBeenCalled()
      })
    })

    it("должен загрузить начальное состояние из backend", async () => {
      mockGetProjectState.mockResolvedValue(mockBackendState)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings.resolution).toBe("1920x1080")
        expect(result.current.settings.frameRate).toBe("30")
      })
    })
  })

  describe("обработка событий", () => {
    it("должен обработать событие ProjectSettingsUpdated", async () => {
      let eventHandler: ((event: ProjectEvent) => void) | undefined

      mockOnEvent.mockImplementation((handler: (event: ProjectEvent) => void) => {
        eventHandler = handler
        return () => {}
      })

      mockGetProjectState.mockResolvedValue(mockBackendState)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings.resolution).toBe("1920x1080")
      })

      // Симулируем событие обновления настроек
      const event: ProjectEvent = {
        type: "ProjectSettingsUpdated",
        payload: {
          settings: {
            resolution: { width: 3840, height: 2160 },
            frame_rate: 60,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      } as any

      await act(async () => {
        eventHandler?.(event)
      })

      await waitFor(() => {
        expect(result.current.settings.resolution).toBe("3840x2160")
        expect(result.current.settings.frameRate).toBe("60")
      })
    })

    it("должен игнорировать события не типа ProjectSettingsUpdated", async () => {
      let eventHandler: ((event: ProjectEvent) => void) | undefined

      mockOnEvent.mockImplementation((handler: (event: ProjectEvent) => void) => {
        eventHandler = handler
        return () => {}
      })

      mockGetProjectState.mockResolvedValue(mockBackendState)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings.resolution).toBe("1920x1080")
      })

      const initialResolution = result.current.settings.resolution

      // Симулируем событие другого типа
      const event: ProjectEvent = {
        type: "ProjectOpened",
      } as any

      await act(async () => {
        eventHandler?.(event)
      })

      // Настройки не должны измениться
      expect(result.current.settings.resolution).toBe(initialResolution)
    })

    it("должен обработать изменение состояния backend", async () => {
      let stateChangeHandler: ((state: ProjectState) => void) | undefined

      mockOnStateChange.mockImplementation((handler: (state: ProjectState) => void) => {
        stateChangeHandler = handler
        return () => {}
      })

      mockGetProjectState.mockResolvedValue(null)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      // Ожидаем начальную загрузку
      await waitFor(() => {
        expect(mockGetProjectState).toHaveBeenCalled()
      })

      // Симулируем изменение состояния
      await act(async () => {
        stateChangeHandler?.(mockBackendState)
      })

      await waitFor(() => {
        expect(result.current.settings.resolution).toBe("1920x1080")
        expect(result.current.settings.frameRate).toBe("30")
      })
    })
  })

  describe("updateSettings", () => {
    it("должен вызвать executeCommand с правильными параметрами", async () => {
      mockGetProjectState.mockResolvedValue(mockBackendState)
      mockExecuteCommand.mockResolvedValue({ success: true, data: null })

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings).toBeDefined()
      })

      await act(async () => {
        await result.current.updateSettings({
          resolution: "3840x2160",
          frameRate: "60",
        })
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "UpdateProjectSettings",
        params: {
          settings: {
            resolution: { width: 3840, height: 2160 },
            frame_rate: 60,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      })
    })

    it("должен обработать ошибку при выполнении команды", async () => {
      mockGetProjectState.mockResolvedValue(mockBackendState)
      mockExecuteCommand.mockResolvedValue({ success: false, error: "Test error" })

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings).toBeDefined()
      })

      let caughtError = false
      try {
        await act(async () => {
          await result.current.updateSettings({
            resolution: "3840x2160",
          })
        })
      } catch (error: any) {
        caughtError = true
        expect(error.message).toBe("Test error")
      }

      expect(caughtError).toBe(true)
    })

    it("должен установить isLoading во время выполнения команды", async () => {
      mockGetProjectState.mockResolvedValue(mockBackendState)

      let resolveCommand: ((value: any) => void) | undefined
      mockExecuteCommand.mockReturnValue(
        new Promise((resolve) => {
          resolveCommand = resolve
        }),
      )

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings).toBeDefined()
      })

      expect(result.current.isLoading).toBe(false)

      act(() => {
        void result.current.updateSettings({
          resolution: "3840x2160",
        })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await act(async () => {
        resolveCommand?.({ success: true, data: null })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("должен объединить новые настройки с текущими", async () => {
      mockGetProjectState.mockResolvedValue(mockBackendState)
      mockExecuteCommand.mockResolvedValue({ success: true, data: null })

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings).toBeDefined()
      })

      // Обновляем только resolution
      await act(async () => {
        await result.current.updateSettings({
          resolution: "3840x2160",
        })
      })

      // Проверяем что команда содержит объединенные настройки
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "UpdateProjectSettings",
        params: {
          settings: {
            resolution: { width: 3840, height: 2160 },
            frame_rate: 30, // Сохраняется из текущих настроек
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      })
    })
  })

  describe("resetSettings", () => {
    it("должен вызвать updateSettings с дефолтными настройками", async () => {
      mockGetProjectState.mockResolvedValue(mockBackendState)
      mockExecuteCommand.mockResolvedValue({ success: true, data: null })

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings).toBeDefined()
      })

      await act(async () => {
        await result.current.resetSettings()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "UpdateProjectSettings",
          params: expect.objectContaining({
            settings: expect.objectContaining({
              resolution: { width: 1920, height: 1080 },
              frame_rate: 30,
            }),
          }),
        }),
      )
    })
  })

  describe("преобразование aspect ratio", () => {
    it("должен определить aspect ratio 16:9", async () => {
      mockGetProjectState.mockResolvedValue(mockBackendState)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings.aspectRatio.label).toBe("16:9")
        expect(result.current.settings.aspectRatio.textLabel).toBe("widescreen")
      })
    })

    it("должен определить aspect ratio 9:16", async () => {
      const verticalState = {
        ...mockBackendState,
        project: {
          ...mockBackendState.project,
          settings: {
            resolution: { width: 1080, height: 1920 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      }

      mockGetProjectState.mockResolvedValue(verticalState)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings.aspectRatio.label).toBe("9:16")
        expect(result.current.settings.aspectRatio.textLabel).toBe("portrait")
      })
    })

    it("должен определить aspect ratio 1:1", async () => {
      const squareState = {
        ...mockBackendState,
        project: {
          ...mockBackendState.project,
          settings: {
            resolution: { width: 1080, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      }

      mockGetProjectState.mockResolvedValue(squareState)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings.aspectRatio.label).toBe("1:1")
        expect(result.current.settings.aspectRatio.textLabel).toBe("square")
      })
    })

    it("должен определить aspect ratio 4:3", async () => {
      const standardState = {
        ...mockBackendState,
        project: {
          ...mockBackendState.project,
          settings: {
            resolution: { width: 1440, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      }

      mockGetProjectState.mockResolvedValue(standardState)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings.aspectRatio.label).toBe("4:3")
        expect(result.current.settings.aspectRatio.textLabel).toBe("standard")
      })
    })

    it("должен определить aspect ratio 4:5", async () => {
      const verticalPostState = {
        ...mockBackendState,
        project: {
          ...mockBackendState.project,
          settings: {
            resolution: { width: 1024, height: 1280 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      }

      mockGetProjectState.mockResolvedValue(verticalPostState)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings.aspectRatio.label).toBe("4:5")
        expect(result.current.settings.aspectRatio.textLabel).toBe("vertical")
      })
    })

    it("должен определить aspect ratio 21:9", async () => {
      const cinematicState = {
        ...mockBackendState,
        project: {
          ...mockBackendState.project,
          settings: {
            resolution: { width: 2520, height: 1080 }, // Точное соотношение 21:9
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      }

      mockGetProjectState.mockResolvedValue(cinematicState)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings.aspectRatio.label).toBe("21:9")
        expect(result.current.settings.aspectRatio.textLabel).toBe("cinematic")
      })
    })

    it("должен определить кастомное aspect ratio", async () => {
      const customState = {
        ...mockBackendState,
        project: {
          ...mockBackendState.project,
          settings: {
            resolution: { width: 1400, height: 900 }, // Не совпадает ни с одним стандартным
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      }

      mockGetProjectState.mockResolvedValue(customState)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings.aspectRatio.label).toBe("custom")
        expect(result.current.settings.aspectRatio.value.name).toBe("1400:900")
      })
    })
  })

  describe("cleanup и отписка", () => {
    it("должен отписаться от событий при размонтировании", async () => {
      const unsubscribeEvent = vi.fn()
      const unsubscribeState = vi.fn()

      mockOnEvent.mockReturnValue(unsubscribeEvent)
      mockOnStateChange.mockReturnValue(unsubscribeState)

      const { unmount } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(mockOnEvent).toHaveBeenCalled()
      })

      unmount()

      expect(unsubscribeEvent).toHaveBeenCalled()
      expect(unsubscribeState).toHaveBeenCalled()
    })
  })

  describe("edge cases", () => {
    it("должен использовать дефолтные настройки если backend state пустой", async () => {
      mockGetProjectState.mockResolvedValue(null)

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings.resolution).toBe("1920x1080")
        expect(result.current.settings.frameRate).toBe("30")
        expect(result.current.settings.colorSpace).toBe("sdr")
      })
    })

    it("должен обработать ошибку при загрузке начального состояния", async () => {
      mockGetProjectState.mockRejectedValue(new Error("Failed to load state"))

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      // Должен использовать дефолтные настройки
      await waitFor(() => {
        expect(result.current.settings.resolution).toBe("1920x1080")
      })
    })

    it("должен сохранять стабильность функций между рендерами", async () => {
      mockGetProjectState.mockResolvedValue(mockBackendState)

      const { result, rerender } = renderHook(() => useProjectSettings(), {
        wrapper: ({ children }) => <ProjectSettingsProvider>{children}</ProjectSettingsProvider>,
      })

      await waitFor(() => {
        expect(result.current.settings).toBeDefined()
      })

      const firstUpdateSettings = result.current.updateSettings
      const firstResetSettings = result.current.resetSettings

      rerender()

      expect(result.current.updateSettings).toBe(firstUpdateSettings)
      expect(result.current.resetSettings).toBe(firstResetSettings)
    })
  })
})
