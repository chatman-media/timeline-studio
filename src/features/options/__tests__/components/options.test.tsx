import { describe, expect, it, vi } from "vitest"

import type { MediaFile } from "@/features/media/types/media"
import { setTranslations } from "@/test/mocks/libraries/i18n"
import { renderWithBase, screen } from "@/test/test-utils"

import { Options } from "../../components/options"

// Мокаем переводы для теста

// Моковый медиафайл для тестов
const mockMediaFile: MediaFile = {
  id: "test-video-1",
  path: "/test/sample.mp4",
  name: "sample.mp4",
  type: "video" as any,
  size: 1000000,
  isVideo: true,
  isAudio: false,
  isImage: false,
  duration: 60,
  createdAt: new Date("2025-01-15T10:30:00Z"),
  isLoadingMetadata: false,
  probeData: {
    streams: [
      {
        index: 0,
        codec_name: "h264",
        codec_type: "video",
        width: 1920,
        height: 1080,
        r_frame_rate: "30/1",
        duration: "60.0",
        bit_rate: "5000000",
      },
    ],
    format: {
      filename: "/test/sample.mp4",
      nb_streams: 1,
      format_name: "mov,mp4,m4a,3gp,3g2,mj2",
      duration: 60,
      size: 1000000,
      bit_rate: 5000000,
    },
  },
}

// НЕ мокаем компоненты вкладок - используем реальные
// Это позволит тесту работать с реальной структурой

// Мокаем UI компоненты Tabs
vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange, ...props }: any) => (
    <div data-testid="options-tabs" data-value={value} {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="options-tabs-list" {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, onClick, ...props }: any) => (
    <button data-testid={`options-tab-${value}`} onClick={onClick} value={value} {...props}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid={`options-content-${value}`} {...props}>
      {children}
    </div>
  ),
}))

// Устанавливаем переводы для компонента Options
setTranslations({
  "options.tabs.video": "Видео",
  "options.tabs.audio": "Аудио",
  "options.tabs.speed": "Скорость",
  "options.tabs.info": "Информация",
})

describe("Options", () => {
  it("should render options component", () => {
    renderWithBase(<Options />)

    // Проверяем, что компонент рендерится
    expect(screen.getByTestId("options")).toBeInTheDocument()
  })

  it("should accept props without errors", () => {
    // Компонент должен рендериться без ошибок
    expect(() => {
      renderWithBase(<Options />)
    }).not.toThrow()

    expect(() => {
      renderWithBase(<Options selectedMediaFile={mockMediaFile} />)
    }).not.toThrow()
  })
})
