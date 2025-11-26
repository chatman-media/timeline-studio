/**
 * Tests for AIDirectorV3Dashboard component
 */

import { render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AIDirectorV3Dashboard } from "../ai-director-v3-dashboard"

// Mock dependencies
vi.mock("@/domains/media-management", () => ({
  useMediaManagement: vi.fn(),
}))

vi.mock("@/features/ai-director/hooks/use-ai-director-analysis-v2", () => ({
  useAIDirectorAnalysisV2: vi.fn(),
}))

vi.mock("@/lib/tauri-logger", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    createLogger: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      infoSync: vi.fn(),
      warnSync: vi.fn(),
      errorSync: vi.fn(),
    })),
  }
})

const mockShowInfo = vi.fn()
const mockShowSuccess = vi.fn()
const mockShowWarning = vi.fn()
const mockShowError = vi.fn()

vi.mock("@/domains/system-integration", () => ({
  useNotifications: vi.fn(() => ({
    showInfo: mockShowInfo,
    showSuccess: mockShowSuccess,
    showWarning: mockShowWarning,
    showError: mockShowError,
  })),
}))

import { useMediaManagement } from "@/domains/media-management"
import { useNotifications } from "@/domains/system-integration"
import { useAIDirectorAnalysisV2 } from "@/features/ai-director/hooks/use-ai-director-analysis-v2"
import type { FileAnalysisProgress } from "@/features/ai-director/types/analysis-progress"

describe("AIDirectorV3Dashboard", () => {
  const mockUseMediaManagement = vi.mocked(useMediaManagement)
  const mockUseAIDirectorAnalysisV2 = vi.mocked(useAIDirectorAnalysisV2)
  const mockUseNotifications = vi.mocked(useNotifications)

  const createMockFileProgress = (overrides?: Partial<FileAnalysisProgress>): FileAnalysisProgress => ({
    fileId: "file-1",
    filePath: "/path/to/video.mp4",
    fileName: "video.mp4",
    status: "pending",
    progress: 0,
    analyzers: [
      {
        type: "scene_detection",
        status: "pending",
        progress: 0,
      },
      {
        type: "audio_quality",
        status: "pending",
        progress: 0,
      },
    ],
    stats: {
      totalAnalyzers: 2,
      completedAnalyzers: 0,
      failedAnalyzers: 0,
      skippedAnalyzers: 0,
    },
    ...overrides,
  })

  const mockStartBatchAnalysis = vi.fn()
  const mockCancelAnalysis = vi.fn()
  const mockReset = vi.fn()

  const defaultMocks = {
    mediaPool: new Map([
      ["file-1", { id: "file-1", path: "/path/to/video1.mp4", name: "video1.mp4", type: "Video" as const }],
      ["file-2", { id: "file-2", path: "/path/to/video2.mp4", name: "video2.mp4", type: "Video" as const }],
    ]),
    analysisHook: {
      isAnalyzing: false,
      filesProgress: [],
      batchProgress: null,
      startBatchAnalysis: mockStartBatchAnalysis,
      cancelAnalysis: mockCancelAnalysis,
      reset: mockReset,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseMediaManagement.mockReturnValue({
      mediaPool: defaultMocks.mediaPool,
    } as any)

    mockUseAIDirectorAnalysisV2.mockReturnValue(defaultMocks.analysisHook as any)
  })

  describe("Rendering", () => {
    it("renders dashboard correctly", () => {
      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      expect(screen.getByText("AI Director v3")).toBeInTheDocument()
      expect(screen.getByText("Batch analysis with real-time progress")).toBeInTheDocument()
    })

    it("shows settings button", () => {
      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      const settingsButton = screen.getByRole("button", { name: /settings/i })
      expect(settingsButton).toBeInTheDocument()
    })

    it("shows empty state with file selection when no analysis in progress", () => {
      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      expect(screen.getByText("Выберите файлы для анализа")).toBeInTheDocument()
      expect(screen.getByText(/2 файлов в медиапуле/)).toBeInTheDocument()
    })

    it("shows files from media pool in empty state", () => {
      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      expect(screen.getByText("video1.mp4")).toBeInTheDocument()
      expect(screen.getByText("video2.mp4")).toBeInTheDocument()
    })
  })

  describe("File Selection and Analysis Start", () => {
    it("allows selecting files from media pool", async () => {
      const user = userEvent.setup()
      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      // Click on first file to select it
      const file1 = screen.getByText("video1.mp4")
      await user.click(file1.closest('[class*="cursor-pointer"]')!)

      // Should show "Начать анализ" button with file count
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Начать анализ.*1/ })).toBeInTheDocument()
      })
    })

    it("starts analysis with selected files", async () => {
      const user = userEvent.setup()
      mockStartBatchAnalysis.mockResolvedValue(undefined)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      // Select files using "Выбрать все" button
      const selectAllButton = screen.getByRole("button", { name: /Выбрать все/ })
      await user.click(selectAllButton)

      // Click start analysis
      const startButton = screen.getByRole("button", { name: /Начать анализ/ })
      await user.click(startButton)

      await waitFor(() => {
        expect(mockStartBatchAnalysis).toHaveBeenCalledWith(
          ["/path/to/video1.mp4", "/path/to/video2.mp4"],
          expect.any(Set),
        )
      })

      expect(mockShowSuccess).toHaveBeenCalledWith("Анализ запущен", expect.stringMatching(/Обработка 2 файл/))
    })

    it("disables start button when no files selected", () => {
      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      const startButton = screen.getByRole("button", { name: /Выберите файлы/ })
      expect(startButton).toBeDisabled()
    })
  })

  describe("Analysis Progress", () => {
    it("displays file progress cards during analysis", () => {
      const filesProgress = [
        createMockFileProgress({
          fileId: "file-1",
          filePath: "/path/to/video1.mp4",
          fileName: "video1.mp4",
          status: "analyzing",
          progress: 50,
        }),
        createMockFileProgress({
          fileId: "file-2",
          filePath: "/path/to/video2.mp4",
          fileName: "video2.mp4",
          status: "pending",
          progress: 0,
        }),
      ]

      mockUseAIDirectorAnalysisV2.mockReturnValue({
        ...defaultMocks.analysisHook,
        isAnalyzing: true,
        filesProgress,
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      expect(screen.getByText("video1.mp4")).toBeInTheDocument()
      expect(screen.getByText("video2.mp4")).toBeInTheDocument()
      expect(screen.getByText(/50%/)).toBeInTheDocument()
    })

    it("shows overall progress card during analysis", () => {
      mockUseAIDirectorAnalysisV2.mockReturnValue({
        ...defaultMocks.analysisHook,
        isAnalyzing: true,
        filesProgress: [createMockFileProgress()],
        batchProgress: {
          status: "running",
          totalFiles: 2,
          completedFiles: 1,
          progress: 50,
          estimatedTimeRemaining: 120,
        },
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      expect(screen.getByText(/50%/)).toBeInTheDocument()
      expect(screen.getByText(/1.*2/)).toBeInTheDocument() // "1 / 2" files
    })

    it("displays cancel button during analysis", () => {
      mockUseAIDirectorAnalysisV2.mockReturnValue({
        ...defaultMocks.analysisHook,
        isAnalyzing: true,
        filesProgress: [createMockFileProgress()],
        batchProgress: {
          status: "running",
          totalFiles: 1,
          completedFiles: 0,
          progress: 25,
        },
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      expect(cancelButton).toBeInTheDocument()
    })

    it("cancels analysis when cancel button clicked", async () => {
      const user = userEvent.setup()

      mockUseAIDirectorAnalysisV2.mockReturnValue({
        ...defaultMocks.analysisHook,
        isAnalyzing: true,
        filesProgress: [createMockFileProgress()],
        batchProgress: {
          status: "running",
          totalFiles: 1,
          completedFiles: 0,
          progress: 25,
        },
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockCancelAnalysis).toHaveBeenCalled()
      expect(mockShowInfo).toHaveBeenCalledWith("Analysis cancelled", "You can start a new analysis")
    })
  })

  describe("Analysis Completion", () => {
    it("shows new analysis button after completion", () => {
      mockUseAIDirectorAnalysisV2.mockReturnValue({
        ...defaultMocks.analysisHook,
        isAnalyzing: false,
        filesProgress: [
          createMockFileProgress({
            status: "completed",
            progress: 100,
          }),
        ],
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      const newAnalysisButton = screen.getByRole("button", { name: /new analysis/i })
      expect(newAnalysisButton).toBeInTheDocument()
    })

    it("resets dashboard when new analysis clicked", async () => {
      const user = userEvent.setup()

      mockUseAIDirectorAnalysisV2.mockReturnValue({
        ...defaultMocks.analysisHook,
        isAnalyzing: false,
        filesProgress: [
          createMockFileProgress({
            status: "completed",
            progress: 100,
          }),
        ],
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      const newAnalysisButton = screen.getByRole("button", { name: /new analysis/i })
      await user.click(newAnalysisButton)

      expect(mockReset).toHaveBeenCalled()
      expect(mockShowInfo).toHaveBeenCalledWith("Dashboard reset", "Ready for new analysis")
    })

    it("displays file statistics in overall progress card", () => {
      mockUseAIDirectorAnalysisV2.mockReturnValue({
        ...defaultMocks.analysisHook,
        isAnalyzing: false,
        filesProgress: [
          createMockFileProgress({ status: "completed", progress: 100 }),
          createMockFileProgress({ status: "completed", progress: 100, fileId: "file-2" }),
          createMockFileProgress({ status: "error", progress: 50, fileId: "file-3" }),
        ],
        batchProgress: {
          status: "completed",
          totalFiles: 3,
          completedFiles: 2,
          progress: 100,
        },
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      // Check that progress card is rendered with file statistics
      expect(screen.getByText(/completed/i)).toBeInTheDocument()
      // Verify we have 2 completed files in the progress display
      expect(screen.getByText("2", { selector: ".font-semibold" })).toBeInTheDocument()
    })
  })

  describe("Settings Integration", () => {
    it("opens settings popover when settings button clicked", async () => {
      const user = userEvent.setup()
      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      const settingsButton = screen.getByRole("button", { name: /settings/i })
      await user.click(settingsButton)

      expect(screen.getByText("Analysis Settings")).toBeInTheDocument()
      expect(screen.getByText("Analysis Mode")).toBeInTheDocument()
    })

    it("disables settings during analysis", async () => {
      const user = userEvent.setup()

      mockUseAIDirectorAnalysisV2.mockReturnValue({
        ...defaultMocks.analysisHook,
        isAnalyzing: true,
        filesProgress: [createMockFileProgress()],
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      const settingsButton = screen.getByRole("button", { name: /settings/i })
      await user.click(settingsButton)

      // Settings panel should show but controls should be disabled
      const quickRadio = screen.getByRole("radio", { name: /quick/i })
      expect(quickRadio).toBeDisabled()
    })

    it("allows changing analyzer selection", async () => {
      const user = userEvent.setup()
      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      const settingsButton = screen.getByRole("button", { name: /settings/i })
      await user.click(settingsButton)

      const momentCheckbox = screen.getByRole("checkbox", { name: /moment detection/i })
      await user.click(momentCheckbox)

      // Verify checkbox was toggled
      expect(momentCheckbox).toBeChecked()
    })
  })

  describe("Error Handling", () => {
    it("shows error toast when analysis fails to start", async () => {
      const user = userEvent.setup()
      const error = new Error("Failed to initialize analysis")
      mockStartBatchAnalysis.mockRejectedValue(error)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      // Select all files first
      const selectAllButton = screen.getByRole("button", { name: /Выбрать все/ })
      await user.click(selectAllButton)

      // Click start analysis
      const startButton = screen.getByRole("button", { name: /Начать анализ/ })
      await user.click(startButton)

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith("Ошибка запуска анализа", "Failed to initialize analysis")
      })
    })

    it("displays error state in file card", () => {
      mockUseAIDirectorAnalysisV2.mockReturnValue({
        ...defaultMocks.analysisHook,
        filesProgress: [
          createMockFileProgress({
            status: "error",
            progress: 50,
            error: "Analysis failed: timeout",
          }),
        ],
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      expect(screen.getByText("Analysis failed: timeout")).toBeInTheDocument()
    })
  })

  describe("Empty Media Pool", () => {
    it("shows empty pool message when no files in media pool", () => {
      mockUseMediaManagement.mockReturnValue({
        mediaPool: new Map(),
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      expect(screen.getByText(/Медиапул пуст/)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Открыть Browser для импорта/ })).toBeInTheDocument()
    })
  })

  describe("Active Analyzers Display", () => {
    it("shows active analyzer count and mode", () => {
      mockUseAIDirectorAnalysisV2.mockReturnValue({
        ...defaultMocks.analysisHook,
        filesProgress: [createMockFileProgress()],
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      expect(screen.getByText(/Mode: balanced/i)).toBeInTheDocument()
      expect(screen.getByText(/2 analyzers active/i)).toBeInTheDocument()
    })

    it("updates analyzer count when settings change", async () => {
      const user = userEvent.setup()

      mockUseAIDirectorAnalysisV2.mockReturnValue({
        ...defaultMocks.analysisHook,
        filesProgress: [createMockFileProgress()],
      } as any)

      render(<AIDirectorV3Dashboard initialFiles={[]} />)

      // Open settings and add analyzer
      const settingsButton = screen.getByRole("button", { name: /settings/i })
      await user.click(settingsButton)

      const momentCheckbox = screen.getByRole("checkbox", { name: /moment detection/i })
      await user.click(momentCheckbox)

      // The count should update (now 3 analyzers)
      await waitFor(() => {
        expect(screen.getByText(/3 analyzers active/i)).toBeInTheDocument()
      })
    })
  })
})
