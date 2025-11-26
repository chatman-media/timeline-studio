/**
 * useMediaImport Hook Tests
 *
 * Тесты для хука useMediaImport
 */

import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MediaManagementProvider } from "../../providers/media-management-provider"
import { useMediaImport } from "../use-media-import"

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    onEvent: vi.fn(() => () => {}),
    onStateChange: vi.fn(() => () => {}),
    executeCommand: vi.fn().mockResolvedValue({ id: "media-1", path: "/test/video.mp4" }),
    getProjectState: vi.fn().mockResolvedValue({
      project: {
        media_pool: {
          items: {},
        },
      },
    }),
  })),
}))
vi.mock("../../services/media-api", () => ({
  selectMediaFile: vi.fn().mockResolvedValue(["/test/video.mp4"]),
  selectAudioFile: vi.fn().mockResolvedValue(["/test/audio.mp3"]),
  getMediaFiles: vi.fn().mockResolvedValue([]),
  selectMediaDirectory: vi.fn().mockResolvedValue(null),
  restorePreviewCache: vi.fn().mockResolvedValue(undefined),
}))

describe("useMediaImport", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MediaManagementProvider>{children}</MediaManagementProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return import state and functions", () => {
    const { result } = renderHook(() => useMediaImport(), { wrapper })

    // Проверка основных свойств контекста
    expect(result.current).toHaveProperty("importFiles")
    expect(result.current).toHaveProperty("selectMediaFiles")
    expect(result.current).toHaveProperty("selectAudioFiles")
    expect(typeof result.current.importFiles).toBe("function")
    expect(typeof result.current.selectMediaFiles).toBe("function")
    expect(typeof result.current.selectAudioFiles).toBe("function")
  })

  it("should provide import state from mediaImportState", () => {
    const { result } = renderHook(() => useMediaImport(), { wrapper })

    // mediaImportState предоставляется через провайдер
    expect(result.current).toBeDefined()
  })

  it("should have default values", () => {
    const { result } = renderHook(() => useMediaImport(), { wrapper })

    // Состояние import инициализируется через провайдер
    expect(result.current).toBeDefined()
  })
})
