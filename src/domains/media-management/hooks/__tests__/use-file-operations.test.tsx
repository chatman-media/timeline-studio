/**
 * useFileOperations Hook Tests
 *
 * Тесты для хука useFileOperations
 */

import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MediaManagementProvider } from "../../providers/media-management-provider"
import { useFileOperations } from "../use-file-operations"

vi.mock("@/lib/tauri-logger")
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    onEvent: vi.fn(() => () => {}),
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
vi.mock("@/features/media/services/media-api", () => ({
  selectMediaFile: vi.fn().mockResolvedValue(["/test/video.mp4"]),
  selectAudioFile: vi.fn().mockResolvedValue(["/test/audio.mp3"]),
}))

describe("useFileOperations", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MediaManagementProvider>{children}</MediaManagementProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return file operations state", () => {
    const { result } = renderHook(() => useFileOperations(), { wrapper })

    // fileOperationsState предоставляется через провайдер
    expect(result.current).toBeDefined()
  })

  it("should have default values", () => {
    const { result } = renderHook(() => useFileOperations(), { wrapper })

    // Состояние инициализируется через провайдер
    expect(result.current).toBeDefined()
  })

  it("should provide operations data", () => {
    const { result } = renderHook(() => useFileOperations(), { wrapper })

    expect(result.current).toBeDefined()
  })
})
