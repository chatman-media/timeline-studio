/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: any) => {
      if (typeof defaultValue === "string") return defaultValue
      return key
    },
    i18n: {
      language: "ru",
    },
  }),
}))

// Mock dependencies
vi.mock("@timeline-studio/core/hooks", () => ({
  useModals: vi.fn(() => ({
    activeModal: "none",
    modalData: null,
    isModalOpen: false,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    submitModal: vi.fn(),
    openCameraCapture: vi.fn(),
    openVoiceRecording: vi.fn(),
    openExport: vi.fn(),
    openProjectSettings: vi.fn(),
    openUserSettings: vi.fn(),
    openKeyboardShortcuts: vi.fn(),
    openColorGrading: vi.fn(),
    openEffectDetail: vi.fn(),
  })),
  useNotifications: vi.fn(() => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  })),
}))

vi.mock("@/features/timeline/hooks/state/use-timeline", () => ({
  useTimeline: vi.fn(() => ({
    project: null,
    send: vi.fn(),
  })),
}))

vi.mock("@/features/transcription/components/enhanced-transcription-panel", () => ({
  EnhancedTranscriptionPanel: () => (
    <section>
      <h2>AI Генерация субтитров</h2>
      <p>Автоматическое создание субтитров с использованием AI</p>
    </section>
  ),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

import { useModals } from "@timeline-studio/core/hooks"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"

import { SubtitleAIToolsModal } from "../subtitle-ai-tools-modal"

const mockedUseModals = vi.mocked(useModals)
const mockedUseTimeline = vi.mocked(useTimeline)

/**
 * NOTE: Большинство тестов пропущены, так как требуют integration/E2E testing:
 * - Tauri file dialog API требует нативных моков
 * - Полный flow транскрипции с Whisper service сложно мокировать
 * - Выбор файлов через нативный dialog требует E2E окружения
 *
 * E2E тесты для субтитров находятся в e2e/tests/subtitles-browser.spec.ts
 * Для полного покрытия AI Tools Modal рекомендуется добавить дополнительные E2E тесты:
 * - Тестирование транскрипции с Whisper
 * - Проверка выбора файлов через Tauri dialog
 * - Полный flow создания субтитров с AI
 */
describe("SubtitleAIToolsModal", () => {
  const mockProject = {
    sections: [
      {
        tracks: [
          {
            id: "video-track-1",
            type: "video",
            clips: [
              {
                id: "clip-1",
                type: "video",
                mediaFile: {
                  path: "/path/to/video.mp4",
                  name: "video.mp4",
                },
                duration: 120,
              },
            ],
          },
          {
            id: "audio-track-1",
            type: "audio",
            clips: [
              {
                id: "clip-2",
                type: "audio",
                mediaFile: {
                  path: "/path/to/audio.mp3",
                  name: "audio.mp3",
                },
                duration: 180,
              },
            ],
          },
        ],
      },
    ],

    globalTracks: [],
  }

  const mockSend = vi.fn()
  const mockCloseModal = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    ;(mockedUseModals as any).mockReturnValue({
      activeModal: "none",
      modalData: null,
      isModalOpen: false,
      openModal: vi.fn(),
      closeModal: mockCloseModal,
      submitModal: vi.fn(),
      openCameraCapture: vi.fn(),
      openVoiceRecording: vi.fn(),
      openExport: vi.fn(),
      openProjectSettings: vi.fn(),
      openUserSettings: vi.fn(),
      openKeyboardShortcuts: vi.fn(),
      openColorGrading: vi.fn(),
      openEffectDetail: vi.fn(),
    })

    mockedUseTimeline.mockReturnValue({
      project: mockProject as any,
      send: mockSend,
    } as any)
  })

  it("should render the modal with enhanced transcription panel", () => {
    const { container } = render(<SubtitleAIToolsModal data-oid="52a._2n" />)

    // Проверяем что модальное окно рендерится с правильной структурой
    // EnhancedTranscriptionPanel использует Tauri dialog для выбора файлов,
    // поэтому тестируем только факт рендеринга компонента
    expect(container.firstChild).toBeTruthy()

    // Проверяем наличие основного заголовка Enhanced AI
    expect(screen.getByText("AI Генерация субтитров")).toBeInTheDocument()
    expect(screen.getByText("Автоматическое создание субтитров с использованием AI")).toBeInTheDocument()
  })

  /**
   * Все интерактивные тесты пропущены, так как требуют E2E окружения:
   * - EnhancedTranscriptionPanel использует Tauri file dialog API (@tauri-apps/plugin-dialog)
   * - Полный flow транскрипции требует интеграции с Whisper service
   * - Тестирование UI взаимодействия требует реального DOM и нативных API
   *
   * Эти сценарии покрываются в E2E тестах (см. e2e/tests/subtitles-browser.spec.ts)
   * и в интеграционных тестах EnhancedTranscriptionPanel
   */
})
