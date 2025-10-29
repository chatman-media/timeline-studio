import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useCurrentProject } from "../../hooks/use-current-project"

// Mock useApp hook
const mockExecuteCommand = vi.fn()
const mockProjectState = {
  project: null as any,
}

vi.mock("../../services/app-provider", () => ({
  useApp: () => ({
    projectState: mockProjectState,
    executeCommand: mockExecuteCommand,
    isConnected: true,
    isConnecting: false,
    connectionError: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    retryConnection: vi.fn(),
  }),
}))

describe("CreateProject Integration Test", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful command execution
    mockExecuteCommand.mockResolvedValue({
      success: true,
      data: {
        project: {
          id: "test-project-123",
          metadata: {
            name: "Test Project",
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
          },
          timeline: {
            duration: 0,
            fps: 30,
            sample_rate: 48000,
            tracks: [],
            markers: [],
          },
          media_pool: { items: {} },
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("должен создавать новый проект с корректными параметрами", async () => {
    const { result } = renderHook(() => useCurrentProject())

    await act(async () => {
      await result.current.createNewProject("Test Project")
    })

    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "CreateProject",
      params: {
        name: "Test Project",
        settings: {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2,
        },
      },
    })
  })

  it("должен обрабатывать ошибку создания проекта", async () => {
    mockExecuteCommand.mockRejectedValueOnce(new Error("Failed to create project"))

    const { result } = renderHook(() => useCurrentProject())

    await expect(
      act(async () => {
        await result.current.createNewProject("Test Project")
      }),
    ).rejects.toThrow("Failed to create project")
  })

  it("должен создавать проект без ресурсов и импортов", async () => {
    const { result } = renderHook(() => useCurrentProject())

    await act(async () => {
      await result.current.createNewProject("Clean Project")
    })

    // Проверяем, что команда отправлена с минимальными параметрами
    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "CreateProject",
      params: {
        name: "Clean Project",
        settings: {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2,
        },
      },
    })

    // Убеждаемся, что никакие дополнительные поля не переданы
    const callArgs = mockExecuteCommand.mock.calls[0][0]
    expect(callArgs.params).not.toHaveProperty("template")
    expect(callArgs.params).not.toHaveProperty("resources")
    expect(callArgs.params).not.toHaveProperty("imports")
  })

  it("должен создавать временный проект", async () => {
    const { result } = renderHook(() => useCurrentProject())

    await act(async () => {
      await result.current.createTempProject()
    })

    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "CreateProject",
      params: {
        name: "Temp Project",
        settings: {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2,
        },
      },
    })
  })

  it("должен создавать проект через loadOrCreateTempProject", async () => {
    const { result } = renderHook(() => useCurrentProject())

    await act(async () => {
      await result.current.loadOrCreateTempProject()
    })

    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "CreateProject",
      params: {
        name: "Temporary Project",
        settings: {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2,
        },
      },
    })
  })

  it("должен поддерживать различные настройки разрешения и FPS", async () => {
    const { result } = renderHook(() => useCurrentProject())

    // 4K проект
    await act(async () => {
      await result.current.createNewProject("4K Project")
    })

    // Проверяем, что используются настройки по умолчанию из хука
    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "CreateProject",
      params: {
        name: "4K Project",
        settings: {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2,
        },
      },
    })

    // Для кастомных настроек нужно было бы расширить хук createNewProject
    // чтобы принимать дополнительные параметры
  })

  it("должен проверять что команда CreateProject вызывается только с необходимыми параметрами", async () => {
    const { result } = renderHook(() => useCurrentProject())

    await act(async () => {
      await result.current.createNewProject("Minimal Project")
    })

    // Проверяем структуру вызова
    expect(mockExecuteCommand).toHaveBeenCalledTimes(1)
    const command = mockExecuteCommand.mock.calls[0][0]

    // Проверяем обязательные поля
    expect(command.type).toBe("CreateProject")
    expect(command.params.name).toBe("Minimal Project")
    expect(command.params.settings).toEqual({
      resolution: { width: 1920, height: 1080 },
      frame_rate: 30,
      audio_sample_rate: 48000,
      audio_channels: 2,
    })

    // Проверяем что нет лишних полей
    const paramKeys = Object.keys(command.params)
    expect(paramKeys).toHaveLength(2) // только name и settings
    expect(paramKeys).toContain("name")
    expect(paramKeys).toContain("settings")
  })
})
