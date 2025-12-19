/**
 * @vitest-environment jsdom
 */
/**
 * useMediaManagement Hook Tests
 *
 * Тесты для хука useMediaManagement
 */

import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MediaManagementProvider } from "../../providers/media-management-provider"
import { useMediaManagement } from "../use-media-management"

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    traceSync: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    info: vi.fn(),
    infoSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
  })),
}))

vi.mock("@/domains/project-management/services/backend-sync", () => ({
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

describe("useMediaManagement", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MediaManagementProvider data-oid="kfrpcu_">{children}</MediaManagementProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => {
      renderHook(() => useMediaManagement())
    }).toThrow("useMediaManagement must be used within MediaManagementProvider")

    consoleError.mockRestore()
  })

  it("should return context when used within provider", () => {
    const { result } = renderHook(() => useMediaManagement(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty("fileOperationsState")
    expect(result.current).toHaveProperty("mediaImportState")
  })

  it("should provide file operations state", () => {
    const { result } = renderHook(() => useMediaManagement(), { wrapper })

    expect(result.current.fileOperationsState).toBeDefined()
    expect(result.current.fileOperationsState).toHaveProperty("operations")
  })

  it("should provide media import state", () => {
    const { result } = renderHook(() => useMediaManagement(), { wrapper })

    expect(result.current.mediaImportState).toBeDefined()
    expect(result.current.mediaImportState).toHaveProperty("status")
  })

  it("should provide media pool", () => {
    const { result } = renderHook(() => useMediaManagement(), { wrapper })

    expect(result.current.mediaPool).toBeDefined()
    expect(result.current.mediaPool).toBeInstanceOf(Map)
  })

  it("should provide import functions", () => {
    const { result } = renderHook(() => useMediaManagement(), { wrapper })

    expect(result.current.importFiles).toBeInstanceOf(Function)
    expect(result.current.selectMediaFiles).toBeInstanceOf(Function)
    expect(result.current.selectAudioFiles).toBeInstanceOf(Function)
    expect(result.current.selectMediaDirectory).toBeInstanceOf(Function)
  })

  it("should provide getMediaInfo function", () => {
    const { result } = renderHook(() => useMediaManagement(), { wrapper })

    expect(result.current.getMediaInfo).toBeInstanceOf(Function)
  })
})
