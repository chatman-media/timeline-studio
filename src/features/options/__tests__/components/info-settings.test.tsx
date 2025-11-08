import { describe, expect, it, vi } from "vitest"

import type { MediaFile } from "@/features/media/types/media"
import { renderWithProviders, screen } from "@/test/test-utils"

import { InfoSettings } from "../../components/info-settings"

// Мокаем lucide-react иконки
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>()
  return {
    ...actual,
    // Переопределяем только если нужно
  }
})

// Мокаем ResizeObserver для компонентов со Slider
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

const mockMediaFile: MediaFile = {
  id: "test-media-1",
  name: "test-video.mp4",
  path: "/path/to/test-video.mp4",
  type: "video" as any,
  isVideo: true,
  isAudio: false,
  isImage: false,
  size: 1024000,
  duration: 120,
  createdAt: new Date("2023-01-01T00:00:00Z"),
  probeData: {
    streams: [
      {
        index: 0,
        codec_name: "h264",
        codec_type: "video",
        width: 1920,
        height: 1080,
      },
      {
        index: 1,
        codec_name: "aac",
        codec_type: "audio",
        sample_rate: 48000,
        channels: 2,
      },
    ],
    format: {
      format_name: "mov,mp4,m4a,3gp,3g2,mj2",
      format_long_name: "QuickTime / MOV",
      duration: 120.0,
      size: 1024000,
      bit_rate: 68266,
    },
  },
}

describe("InfoSettings", () => {
  it("should render info settings component", () => {
    renderWithProviders(<InfoSettings />)

    // Проверяем, что компонент рендерится
    expect(screen.getByTestId("info-settings")).toBeInTheDocument()
  })

  it("should render all info setting sections", () => {
    renderWithProviders(<InfoSettings />)

    // Проверяем новые элементы управления согласно обновленному дизайну (по ключам i18n)
    expect(screen.getByText("options.info.mediaInfo")).toBeInTheDocument()
    expect(screen.getByText("options.info.projectInfo")).toBeInTheDocument()
    expect(screen.getByText("options.info.technicalInfo")).toBeInTheDocument()
    expect(screen.getByText("options.info.advanced")).toBeInTheDocument()
  })

  it("should display media file information when selectedMediaFile is provided", () => {
    renderWithProviders(<InfoSettings selectedMediaFile={mockMediaFile} />)

    // Проверяем, что информация о файле отображается
    expect(screen.getByText(mockMediaFile.name)).toBeInTheDocument()
    // Проверяем, что компонент отрендерился с файлом
    expect(screen.getByTestId("info-settings")).toBeInTheDocument()
  })

  it("should show no media selected message when no media file is provided", () => {
    renderWithProviders(<InfoSettings />)

    // Проверяем сообщение о том, что медиафайл не выбран
    expect(screen.getByText("options.info.noMediaSelected")).toBeInTheDocument()
  })
})
