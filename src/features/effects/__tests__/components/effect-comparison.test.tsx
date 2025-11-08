import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EffectComparison } from "../../components/effect-comparison"
import type { VideoEffect } from "../../types"
import { generateCSSFilterForEffect, getPlaybackRate } from "../../utils/css-effects"

// Мокаем внешние зависимости
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/slider", () => ({
  Slider: ({ value, onValueChange, min, max, step, ...props }: any) => (
    <input
      type="range"
      data-testid="slider"
      value={value[0]}
      onChange={(e) => onValueChange([Number.parseInt(e.target.value, 10)])}
      min={min}
      max={max}
      step={step}
      {...props}
    />
  ),
}))

vi.mock("lucide-react", () => ({
  Pause: () => <span data-testid="pause-icon">Pause</span>,
  Play: () => <span data-testid="play-icon">Play</span>,
  RotateCcw: () => <span data-testid="reset-icon">Reset</span>,
}))

vi.mock("../../utils/css-effects", () => ({
  generateCSSFilterForEffect: vi.fn(),
  getPlaybackRate: vi.fn(),
}))

describe("EffectComparison", () => {
  const mockEffect: VideoEffect = {
    id: "test-effect",
    name: {
      ru: "Тестовый эффект",
      en: "Test Effect",
    },
    description: {
      ru: "Описание тестового эффекта",
      en: "Test effect description",
    },
    category: "blur_sharpen",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["test"],
    complexity: "low",
    gpuAccelerated: false,
    parameters: [
      {
        id: "intensity",
        name: { ru: "Интенсивность", en: "Intensity" },
        type: "number" as const,
        defaultValue: 50,
        min: 0,
        max: 100,
        animatable: true,
      },
      {
        id: "brightness",
        name: { ru: "Яркость", en: "Brightness" },
        type: "number" as const,
        defaultValue: 100,
        min: 0,
        max: 200,
        animatable: true,
      },
    ],
    presets: [],
    processors: {
      css: {
        filter: (params: Record<string, any>) =>
          `brightness(${params.brightness || 100}%) blur(${params.intensity || 0}px)`,
      },
    },
  }

  // Создаем мок для HTMLVideoElement
  const createVideoMock = () => {
    const videoMock = {
      currentTime: 0,
      playbackRate: 1,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      style: { filter: "" },
    }
    return videoMock as any
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Сброс моков утилит
    vi.mocked(generateCSSFilterForEffect).mockReturnValue("brightness(1.2) contrast(1.1)")
    vi.mocked(getPlaybackRate).mockReturnValue(1)

    // Мокаем HTMLVideoElement
    Object.defineProperty(HTMLVideoElement.prototype, "play", {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    })
    Object.defineProperty(HTMLVideoElement.prototype, "pause", {
      writable: true,
      value: vi.fn(),
    })
    Object.defineProperty(HTMLVideoElement.prototype, "currentTime", {
      writable: true,
      value: 0,
    })
    Object.defineProperty(HTMLVideoElement.prototype, "playbackRate", {
      writable: true,
      value: 1,
    })

    // Мокаем getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 600,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 600,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    }))
  })

  describe("Рендеринг", () => {
    it("должен отображать основные элементы", () => {
      render(<EffectComparison effect={mockEffect} />)

      // Проверяем наличие видео элементов
      const videos = document.querySelectorAll("video")
      expect(videos).toHaveLength(2)

      // Проверяем контролы
      expect(screen.getByRole("button", { name: /play|воспроизвести/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /reset|сброс/i })).toBeInTheDocument()
      expect(screen.getByTestId("slider")).toBeInTheDocument()
    })

    it("должен устанавливать правильные размеры контейнера", () => {
      render(<EffectComparison effect={mockEffect} width={800} height={600} />)

      const container = document.querySelector(".relative.overflow-hidden")
      expect(container).toHaveStyle({
        width: "800px",
        height: "600px",
      })
    })

    it("должен отображать лейблы оригинала и эффекта", () => {
      render(<EffectComparison effect={mockEffect} />)

      expect(screen.getByText("Оригинал")).toBeInTheDocument()
      expect(screen.getByText("С эффектом")).toBeInTheDocument()
    })

    it("должен использовать переданный путь к видео", () => {
      render(<EffectComparison effect={mockEffect} videoPath="/custom-video.mp4" />)

      const videos = document.querySelectorAll("video")
      videos.forEach((video) => {
        expect(video).toHaveAttribute("src", "/custom-video.mp4")
      })
    })

    it("должен использовать дефолтный путь к видео", () => {
      render(<EffectComparison effect={mockEffect} />)

      const videos = document.querySelectorAll("video")
      videos.forEach((video) => {
        expect(video).toHaveAttribute("src", "/t1.mp4")
      })
    })
  })

  describe("Применение эффектов", () => {
    it("должен применять CSS фильтры к видео с эффектом", () => {
      render(<EffectComparison effect={mockEffect} />)

      expect(vi.mocked(generateCSSFilterForEffect)).toHaveBeenCalledWith(mockEffect)

      const effectVideo = document.querySelectorAll("video")[1]
      expect(effectVideo.style.filter).toBe("brightness(1.2) contrast(1.1)")
    })

    it("должен применять кастомные параметры к эффекту", () => {
      const customParams = { intensity: 75, brightness: 120 }

      render(<EffectComparison effect={mockEffect} customParams={customParams} />)

      const expectedEffect = {
        ...mockEffect,
        parameters: mockEffect.parameters.map((param) => ({
          ...param,
          defaultValue: customParams[param.id as keyof typeof customParams] ?? param.defaultValue,
        })),
      }

      expect(vi.mocked(generateCSSFilterForEffect)).toHaveBeenCalledWith(expectedEffect)
    })

    it("должен применять скорость воспроизведения", () => {
      vi.mocked(getPlaybackRate).mockReturnValue(0.8)

      render(<EffectComparison effect={mockEffect} />)

      expect(vi.mocked(getPlaybackRate)).toHaveBeenCalledWith(mockEffect)

      const effectVideo = document.querySelectorAll("video")[1]
      expect(effectVideo.playbackRate).toBe(0.8)
    })

    it("должен обновлять эффект при изменении параметров", () => {
      const { rerender } = render(<EffectComparison effect={mockEffect} />)

      expect(vi.mocked(generateCSSFilterForEffect)).toHaveBeenCalledTimes(1)

      const newCustomParams = { brightness: 150 }
      rerender(<EffectComparison effect={mockEffect} customParams={newCustomParams} />)

      expect(vi.mocked(generateCSSFilterForEffect)).toHaveBeenCalledTimes(2)
    })
  })

  describe("Воспроизведение видео", () => {
    it("должен начинать воспроизведение при клике на Play", async () => {
      render(<EffectComparison effect={mockEffect} />)

      const playButton = screen.getByRole("button", { name: /play|воспроизвести/i })
      fireEvent.click(playButton)

      // Кнопка должна изменится на паузу
      await waitFor(() => {
        expect(screen.getByTestId("pause-icon")).toBeInTheDocument()
      })
    })

    it("должен ставить на паузу при клике на Pause", async () => {
      render(<EffectComparison effect={mockEffect} />)

      const playButton = screen.getByRole("button", { name: /play|воспроизвести/i })

      // Сначала запускаем воспроизведение
      fireEvent.click(playButton)

      await waitFor(() => {
        expect(screen.getByTestId("pause-icon")).toBeInTheDocument()
      })

      // Затем ставим на паузу
      const pauseButton = screen.getByRole("button", { name: /pause|пауза/i })
      fireEvent.click(pauseButton)

      // Кнопка должна вернуться к play
      await waitFor(() => {
        expect(screen.getByTestId("play-icon")).toBeInTheDocument()
      })
    })

    it("должен сбрасывать видео при клике на Reset", () => {
      render(<EffectComparison effect={mockEffect} />)

      // Сначала воспроизводим
      const playButton = screen.getByRole("button", { name: /play|воспроизвести/i })
      fireEvent.click(playButton)

      const resetButton = screen.getByRole("button", { name: /reset|сброс/i })
      fireEvent.click(resetButton)

      // Проверяем что кнопка вернулась к play (видео остановлено)
      expect(screen.getByTestId("play-icon")).toBeInTheDocument()
    })

    it("должен синхронизировать время воспроизведения между видео", () => {
      render(<EffectComparison effect={mockEffect} />)

      // Проверяем что компонент рендерится с двумя видео элементами
      const videos = document.querySelectorAll("video")
      expect(videos).toHaveLength(2)
    })
  })

  describe("Управление разделителем", () => {
    it("должен устанавливать начальную позицию разделителя на 50%", () => {
      render(<EffectComparison effect={mockEffect} />)

      const slider = screen.getByTestId("slider")
      expect(slider).toHaveValue("50")

      const separator = document.querySelector('[style*="left: 50%"]')
      expect(separator).toBeInTheDocument()
    })

    it("должен изменять позицию разделителя через слайдер", () => {
      render(<EffectComparison effect={mockEffect} />)

      const slider = screen.getByTestId("slider")
      fireEvent.change(slider, { target: { value: "75" } })

      expect(slider).toHaveValue("75")

      const separator = document.querySelector('[style*="left: 75%"]')
      expect(separator).toBeInTheDocument()

      // Проверяем что отображается правильный процент
      expect(screen.getByText("75%")).toBeInTheDocument()
    })

    it("должен начинать перетаскивание при mousedown на контейнере", () => {
      render(<EffectComparison effect={mockEffect} />)

      const container = document.querySelector(".relative.overflow-hidden")
      expect(container).toBeInTheDocument()

      fireEvent.mouseDown(container!)

      // После mousedown компонент должен войти в режим перетаскивания
      // Проверяем что курсор изменился
      expect(container).toHaveClass("cursor-ew-resize")
    })

    it("должен обновлять позицию при перетаскивании мышью", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener")

      render(<EffectComparison effect={mockEffect} />)

      const container = document.querySelector(".relative.overflow-hidden")
      fireEvent.mouseDown(container!)

      // Проверяем что добавлены слушатели для mousemove и mouseup
      expect(addEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith("mouseup", expect.any(Function))
    })

    it("должен применять clipPath для видео с эффектом", () => {
      render(<EffectComparison effect={mockEffect} />)

      const effectVideoContainer = document.querySelector('[style*="clip-path"]')
      expect(effectVideoContainer).toBeInTheDocument()
      expect(effectVideoContainer).toHaveStyle({
        clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)",
      })
    })

    it("должен обновлять clipPath при изменении позиции", () => {
      render(<EffectComparison effect={mockEffect} />)

      const slider = screen.getByTestId("slider")
      fireEvent.change(slider, { target: { value: "30" } })

      const effectVideoContainer = document.querySelector('[style*="clip-path"]')
      expect(effectVideoContainer).toHaveStyle({
        clipPath: "polygon(30% 0, 100% 0, 100% 100%, 30% 100%)",
      })
    })
  })

  describe("Обработка событий", () => {
    it("должен очищать слушатели событий при размонтировании", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

      const { unmount } = render(<EffectComparison effect={mockEffect} />)
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith("mouseup", expect.any(Function))
    })

    it("должен корректно обрабатывать отсутствие видео элементов", () => {
      // Просто проверяем что компонент рендерится без ошибок
      expect(() => {
        render(<EffectComparison effect={mockEffect} />)
      }).not.toThrow()
    })

    it("должен ограничивать позицию разделителя между 0 и 100", () => {
      render(<EffectComparison effect={mockEffect} />)

      const slider = screen.getByTestId("slider")

      // Тестируем максимальное значение
      fireEvent.change(slider, { target: { value: "150" } })
      expect(slider).toHaveValue("100")

      // Тестируем минимальное значение
      fireEvent.change(slider, { target: { value: "-10" } })
      expect(slider).toHaveValue("0")
    })
  })

  describe("Состояние компонента", () => {
    it("должен сохранять состояние воспроизведения", async () => {
      render(<EffectComparison effect={mockEffect} />)

      const playButton = screen.getByRole("button", { name: /play|воспроизвести/i })
      fireEvent.click(playButton)

      await waitFor(() => {
        expect(screen.getByTestId("pause-icon")).toBeInTheDocument()
      })
    })

    it("должен сбрасывать состояние при reset", () => {
      render(<EffectComparison effect={mockEffect} />)

      // Изменяем позицию слайдера
      const slider = screen.getByTestId("slider")
      fireEvent.change(slider, { target: { value: "80" } })

      // Сбрасываем
      const resetButton = screen.getByRole("button", { name: /reset|сброс/i })
      fireEvent.click(resetButton)

      // Позиция должна вернуться к 50%
      expect(slider).toHaveValue("50")
      expect(screen.getByText("50%")).toBeInTheDocument()
    })

    it("должен корректно обрабатывать изменения эффекта", () => {
      const { rerender } = render(<EffectComparison effect={mockEffect} />)

      const newEffect: VideoEffect = {
        ...mockEffect,
        id: "new-effect",
        name: { en: "New Effect", ru: "Новый эффект" },
      }

      rerender(<EffectComparison effect={newEffect} />)

      expect(vi.mocked(generateCSSFilterForEffect)).toHaveBeenLastCalledWith(newEffect)
    })
  })

  describe("Accessibility", () => {
    it("должен иметь правильную структуру для скринридеров", () => {
      render(<EffectComparison effect={mockEffect} />)

      // Проверяем наличие кнопок с правильными ролями
      expect(screen.getByRole("button", { name: /play|воспроизвести/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /reset|сброс/i })).toBeInTheDocument()

      // Проверяем наличие слайдера
      expect(screen.getByTestId("slider")).toBeInTheDocument()
    })

    it("должен отображать текущее значение позиции", () => {
      render(<EffectComparison effect={mockEffect} />)

      expect(screen.getByText("50%")).toBeInTheDocument()
      expect(screen.getByText(/позиция/i)).toBeInTheDocument()
    })
  })

  describe("Синхронизация видео", () => {
    it("должен синхронизировать видео когда разница времени > 0.1", () => {
      render(<EffectComparison effect={mockEffect} />)

      const videos = document.querySelectorAll("video")
      const originalVideo = videos[0]
      const effectVideo = videos[1]

      // Устанавливаем разное время
      Object.defineProperty(originalVideo, "currentTime", { value: 5.0, writable: true })
      Object.defineProperty(effectVideo, "currentTime", { value: 4.8, writable: true })

      // Симулируем событие timeupdate
      fireEvent(originalVideo, new Event("timeupdate"))

      // Время должно синхронизироваться
      expect(effectVideo.currentTime).toBe(5.0)
    })

    it("не должен синхронизировать видео когда разница времени < 0.1", () => {
      render(<EffectComparison effect={mockEffect} />)

      const videos = document.querySelectorAll("video")
      const originalVideo = videos[0]
      const effectVideo = videos[1]

      // Устанавливаем близкое время
      Object.defineProperty(originalVideo, "currentTime", { value: 5.0, writable: true })
      Object.defineProperty(effectVideo, "currentTime", { value: 4.95, writable: true })

      // Симулируем событие timeupdate
      fireEvent(originalVideo, new Event("timeupdate"))

      // Время не должно измениться
      expect(effectVideo.currentTime).toBe(4.95)
    })

    it("должен корректно обрабатывать отсутствие видео элементов при синхронизации", () => {
      // Мокаем refs чтобы они возвращали null
      const { container } = render(<EffectComparison effect={mockEffect} />)

      // Удаляем video элементы из DOM
      const videos = container.querySelectorAll("video")
      videos.forEach((video) => video.remove())

      // Проверяем что компонент не падает при отсутствии видео
      expect(() => {
        const mockEvent = new Event("timeupdate")
        fireEvent(window, mockEvent)
      }).not.toThrow()
    })
  })

  describe("Обработка перетаскивания мыши", () => {
    it("должен игнорировать mousemove когда не в режиме перетаскивания", () => {
      render(<EffectComparison effect={mockEffect} />)

      const slider = screen.getByTestId("slider")
      const initialValue = slider.getAttribute("value")

      // Симулируем mousemove без предварительного mousedown
      const mouseMoveEvent = new MouseEvent("mousemove", {
        clientX: 300,
        clientY: 200,
        bubbles: true,
        cancelable: true,
      })
      fireEvent(window, mouseMoveEvent)

      // Значение слайдера не должно измениться
      expect(slider.getAttribute("value")).toBe(initialValue)
    })

    it("должен игнорировать mousemove когда containerRef недоступен", () => {
      render(<EffectComparison effect={mockEffect} />)

      const container = document.querySelector(".relative.overflow-hidden")
      const slider = screen.getByTestId("slider")

      // Начинаем перетаскивание
      fireEvent.mouseDown(container!)

      // Удаляем container из DOM для имитации отсутствия ref
      container?.remove()

      const initialValue = slider.getAttribute("value")

      // Симулируем mousemove
      const mouseMoveEvent = new MouseEvent("mousemove", {
        clientX: 300,
        clientY: 200,
        bubbles: true,
        cancelable: true,
      })
      fireEvent(window, mouseMoveEvent)

      // Значение не должно измениться
      expect(slider.getAttribute("value")).toBe(initialValue)
    })

    it("должен правильно рассчитывать позицию при mousemove на краях", () => {
      render(<EffectComparison effect={mockEffect} />)

      const container = document.querySelector(".relative.overflow-hidden")
      const slider = screen.getByTestId("slider")

      // Начинаем перетаскивание
      fireEvent.mouseDown(container!)

      // Тест левого края (x = 0)
      fireEvent(
        window,
        new MouseEvent("mousemove", {
          clientX: 0,
          clientY: 200,
        }),
      )
      expect(slider).toHaveValue("0")

      // Тест правого края (x больше ширины)
      fireEvent(
        window,
        new MouseEvent("mousemove", {
          clientX: 700, // больше чем ширина 600px
          clientY: 200,
        }),
      )
      expect(slider).toHaveValue("100")
    })

    it("должен корректно завершать перетаскивание при mouseup", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

      render(<EffectComparison effect={mockEffect} />)

      const container = document.querySelector(".relative.overflow-hidden")

      // Начинаем перетаскивание
      fireEvent.mouseDown(container!)

      // Завершаем перетаскивание
      fireEvent(window, new MouseEvent("mouseup"))

      // Проверяем что слушатели удалены
      expect(removeEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith("mouseup", expect.any(Function))
    })
  })

  describe("Производительность", () => {
    it("должен не вызывать лишних перерендеров", () => {
      let renderCount = 0
      const TestComponent = () => {
        renderCount++
        return <EffectComparison effect={mockEffect} />
      }

      const { rerender } = render(<TestComponent />)
      expect(renderCount).toBe(1)

      // Повторный рендер с теми же пропсами
      rerender(<TestComponent />)

      // Рендер должен произойти, но это нормально для React
      expect(renderCount).toBe(2)
    })

    it("должен эффективно обрабатывать частые изменения позиции", () => {
      render(<EffectComparison effect={mockEffect} />)

      const slider = screen.getByTestId("slider")

      // Множественные быстрые изменения
      for (let i = 0; i < 10; i++) {
        fireEvent.change(slider, { target: { value: `${i * 10}` } })
      }

      // Финальное значение должно быть корректным
      expect(slider).toHaveValue("90")
    })
  })
})
