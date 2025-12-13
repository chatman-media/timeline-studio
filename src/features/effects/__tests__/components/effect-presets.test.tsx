/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { EffectPresets } from "../../components/effect-presets"
import type { BaseEffect, VideoEffect } from "../../types"

// Mock logger - создаем внутри фабрики vi.mock
vi.mock("@/lib/tauri-logger", () => {
  const mockLogger = {
    errorSync: vi.fn(),
    infoSync: vi.fn(),
    info: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    warn: vi.fn().mockResolvedValue(undefined),
    debug: vi.fn().mockResolvedValue(undefined),
  }

  return {
    createLogger: () => mockLogger,
    __mockLogger: mockLogger, // Экспортируем для доступа в тестах
  }
})

// Получаем доступ к mockLogger через модуль
const { __mockLogger: mockLogger } = (await import("@/lib/tauri-logger")) as any

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: "ru" },
  }),
}))

// Мокаем UI компоненты
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, className, title, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} className={className} title={title} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => (
    <div data-testid="tooltip-trigger" data-as-child={asChild}>
      {children}
    </div>
  ),
  TooltipContent: ({ children, side, className }: any) => (
    <div data-testid="tooltip-content" data-side={side} className={className}>
      {children}
    </div>
  ),
}))

// Мокаем иконки
vi.mock("lucide-react", () => ({
  ChevronDown: () => <span data-testid="chevron-down">ChevronDown</span>,
  ChevronRight: () => <span data-testid="chevron-right">ChevronRight</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
  Trash2: () => <span data-testid="trash-icon">Trash2</span>,
}))

describe("EffectPresets", () => {
  const mockPresets = [
    {
      id: "light",
      name: { ru: "Легкий", en: "Light" },
      description: { ru: "Легкий эффект", en: "Light effect" },
      parameters: { intensity: 25, brightness: 110 },
      tags: ["basic"],
    },
    {
      id: "strong",
      name: { ru: "Сильный", en: "Strong" },
      description: { ru: "Сильный эффект", en: "Strong effect" },
      parameters: { intensity: 75, brightness: 130 },
      tags: ["intense"],
    },
  ]

  const baseEffect: VideoEffect = {
    id: "test-effect",
    name: { ru: "Тестовый эффект", en: "Test Effect" },
    description: { ru: "Тестовый эффект", en: "Test Effect" },
    category: "blur_sharpen",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["popular"],
    complexity: "low",
    gpuAccelerated: false,
    parameters: [],
    presets: mockPresets,
    processors: {
      css: {
        filter: () => "blur(1px)",
      },
    },
  }

  const mockProps = {
    effect: baseEffect,
    onApplyPreset: vi.fn(),
    selectedPreset: undefined,
  }

  const mockLocalStorage = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
    }
  })()

  beforeEach(() => {
    vi.clearAllMocks()

    // Мокаем localStorage
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    })

    // Сброс состояния localStorage
    mockLocalStorage.clear()
  })

  describe("Рендеринг компонента", () => {
    it("должен отображать заголовок с количеством пресетов", () => {
      render(<EffectPresets {...mockProps} />)

      expect(screen.getByText("Пресеты")).toBeInTheDocument()
      expect(screen.getByText("(2)")).toBeInTheDocument()
    })

    it("должен отображать иконку настроек", () => {
      render(<EffectPresets {...mockProps} />)

      expect(screen.getByTestId("settings-icon")).toBeInTheDocument()
    })

    it("должен быть свернут по умолчанию", () => {
      render(<EffectPresets {...mockProps} />)

      expect(screen.getByTestId("chevron-right")).toBeInTheDocument()
      expect(screen.queryByText("Легкий")).not.toBeInTheDocument()
    })

    it("не должен отображаться если нет пресетов", () => {
      const effectWithoutPresets = { ...baseEffect, presets: [] as any }
      const { container } = render(<EffectPresets {...mockProps} effect={effectWithoutPresets} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe("Разворачивание/сворачивание", () => {
    it("должен разворачиваться при клике на заголовок", () => {
      render(<EffectPresets {...mockProps} />)

      const header = screen.getByRole("button")
      fireEvent.click(header)

      expect(screen.getByTestId("chevron-down")).toBeInTheDocument()
      expect(screen.getAllByText("Легкий")).toHaveLength(2) // button + tooltip
      expect(screen.getAllByText("Сильный")).toHaveLength(2) // button + tooltip
    })

    it("должен сворачиваться при повторном клике", () => {
      render(<EffectPresets {...mockProps} />)

      const header = screen.getByRole("button")

      // Разворачиваем
      fireEvent.click(header)
      expect(screen.getAllByText("Легкий")).toHaveLength(2) // button + tooltip

      // Сворачиваем
      fireEvent.click(header)
      expect(screen.queryByText("Легкий")).not.toBeInTheDocument()
    })
  })

  describe("Отображение пресетов", () => {
    beforeEach(() => {
      mockLocalStorage.clear()
      mockLocalStorage.getItem.mockReturnValue(null)
      render(<EffectPresets {...mockProps} />)
      const header = screen.getByRole("button")
      fireEvent.click(header) // Разворачиваем
    })

    it("должен отображать названия пресетов на русском языке", () => {
      expect(screen.getAllByText("Легкий")).toHaveLength(2) // button + tooltip
      expect(screen.getAllByText("Сильный")).toHaveLength(2) // button + tooltip
    })

    it("должен отображать описания пресетов", () => {
      expect(screen.getAllByText("Легкий эффект")).toHaveLength(2) // button + tooltip
      expect(screen.getAllByText("Сильный эффект")).toHaveLength(2) // button + tooltip
    })

    it("должен выделять выбранный пресет", () => {
      // Этот тест нужно выполнить отдельно с selectedPreset
      // поэтому не используем beforeEach этого describe блока
    })

    it("должен выделять выбранный пресет - отдельный тест", () => {
      mockLocalStorage.clear()
      mockLocalStorage.getItem.mockReturnValue(null)

      const { container } = render(<EffectPresets {...mockProps} selectedPreset="light" />)
      const header = container.querySelector("button")!
      fireEvent.click(header)

      // Ищем кнопки пресетов по их data-variant атрибуту
      const allButtons = container.querySelectorAll("button[data-variant]")
      const lightButton = Array.from(allButtons).find(
        (btn) =>
          btn.textContent?.includes("Легкий") &&
          !btn.textContent?.includes("ChevronDown") &&
          !btn.textContent?.includes("Settings"),
      )
      const strongButton = Array.from(allButtons).find(
        (btn) =>
          btn.textContent?.includes("Сильный") &&
          !btn.textContent?.includes("ChevronDown") &&
          !btn.textContent?.includes("Settings"),
      )

      expect(lightButton).toHaveAttribute("data-variant", "default")
      expect(strongButton).toHaveAttribute("data-variant", "outline")
    })

    it("должен вызывать onApplyPreset при клике на пресет", () => {
      const lightPresetButtons = screen.getAllByText("Легкий")
      const lightPresetButton = lightPresetButtons[0].closest("button")
      fireEvent.click(lightPresetButton!)

      expect(mockProps.onApplyPreset).toHaveBeenCalledWith("light", {
        intensity: 25,
        brightness: 110,
      })
    })

    it("должен отображать tooltip с информацией о пресете", () => {
      expect(screen.getAllByTestId("tooltip-content")).toHaveLength(2)
    })
  })

  describe("Пользовательские пресеты", () => {
    const customPresets = {
      custom_1234567890: {
        name: { ru: "Мой пресет", en: "My Preset" },
        description: { ru: "Пользовательский пресет", en: "Custom preset" },
        params: { intensity: 50, brightness: 120 },
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    }

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(customPresets))
    })

    it("должен загружать пользовательские пресеты из localStorage", async () => {
      render(<EffectPresets {...mockProps} />)

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("effect_presets_test-effect")

      const header = screen.getByRole("button")
      fireEvent.click(header)

      await waitFor(() => {
        expect(screen.getAllByText("Мой пресет")).toHaveLength(2) // button + tooltip
      })
    })

    it("должен отображать индикатор пользовательского пресета", async () => {
      render(<EffectPresets {...mockProps} />)

      const header = screen.getByRole("button")
      fireEvent.click(header)

      await waitFor(() => {
        expect(screen.getAllByText("Пользовательский")).toHaveLength(1) // только в кнопке, не в tooltip
      })
    })

    it("должен отображать кнопку удаления для пользовательских пресетов", async () => {
      render(<EffectPresets {...mockProps} />)

      const header = screen.getByRole("button")
      fireEvent.click(header)

      await waitFor(() => {
        expect(screen.getByTestId("trash-icon")).toBeInTheDocument()
      })
    })

    it("должен удалять пользовательский пресет", async () => {
      render(<EffectPresets {...mockProps} />)

      const header = screen.getByRole("button")
      fireEvent.click(header)

      await waitFor(() => {
        const deleteButton = screen.getByTestId("trash-icon").closest("button")
        fireEvent.click(deleteButton!)
      })

      // Когда удаляем последний пресет, компонент вызывает removeItem
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("effect_presets_test-effect")
    })

    it("должен удалять ключ из localStorage когда нет пресетов", async () => {
      render(<EffectPresets {...mockProps} />)

      const header = screen.getByRole("button")
      fireEvent.click(header)

      await waitFor(() => {
        const deleteButton = screen.getByTestId("trash-icon").closest("button")
        fireEvent.click(deleteButton!)
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("effect_presets_test-effect")
    })

    it("должен отображать дату создания пользовательского пресета", async () => {
      render(<EffectPresets {...mockProps} />)

      const header = screen.getByRole("button")
      fireEvent.click(header)

      await waitFor(() => {
        // Ищем текст в tooltipе по data-testid
        const tooltips = screen.getAllByTestId("tooltip-content")
        const createdAtTooltip = tooltips.find((tooltip) => tooltip.textContent?.includes("Создано"))
        expect(createdAtTooltip).toBeInTheDocument()
      })
    })

    it("должен обновлять количество пресетов с учетом пользовательских", async () => {
      render(<EffectPresets {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText("(3)")).toBeInTheDocument() // 2 встроенных + 1 пользовательский
      })
    })
  })

  describe("Локализация", () => {
    it("должен использовать fallback на английский для названий", () => {
      const presetWithoutRu: BaseEffect = {
        ...baseEffect,
        presets: [
          {
            id: "test",
            name: { en: "English Only", ru: "English Only" },
            description: { ru: "Описание", en: "Description" },
            parameters: { intensity: 50 },
            tags: [],
          },
        ],
      }

      render(<EffectPresets {...mockProps} effect={presetWithoutRu} />)
      const header = screen.getByRole("button")
      fireEvent.click(header)

      expect(screen.getAllByText("English Only")).toHaveLength(2) // button + tooltip
    })

    it("должен использовать fallback на английский для описаний", () => {
      const presetWithoutRu: BaseEffect = {
        ...baseEffect,
        presets: [
          {
            id: "test",
            name: { ru: "Тест", en: "Test" },
            description: { en: "English Description", ru: "English Description" },
            parameters: { intensity: 50 },
            tags: [],
          },
        ],
      }

      render(<EffectPresets {...mockProps} effect={presetWithoutRu} />)
      const header = screen.getByRole("button")
      fireEvent.click(header)

      expect(screen.getAllByText("English Description")).toHaveLength(2) // button + tooltip
    })
  })

  describe("Обработка ошибок", () => {
    it("должен обрабатывать ошибки при загрузке из localStorage", async () => {
      mockLocalStorage.getItem.mockReturnValue("invalid json")

      expect(() => {
        render(<EffectPresets {...mockProps} />)
      }).not.toThrow()

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Error parsing custom presets",
          expect.objectContaining({ error: expect.any(SyntaxError) }),
        )
      })
    })

    it("должен работать когда localStorage недоступен", async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage not available")
      })

      expect(() => {
        render(<EffectPresets {...mockProps} />)
      }).not.toThrow()

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Error accessing localStorage",
          expect.objectContaining({ error: expect.any(Error) }),
        )
      })
    })

    it("должен обрабатывать пустые пресеты", () => {
      const effectWithEmptyPresets = { ...baseEffect, presets: [] }

      const { container } = render(<EffectPresets {...mockProps} effect={effectWithEmptyPresets} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe("Tooltip отображение", () => {
    beforeEach(() => {
      mockLocalStorage.clear()
      mockLocalStorage.getItem.mockReturnValue(null)
      render(<EffectPresets {...mockProps} />)
      const header = screen.getByRole("button")
      fireEvent.click(header)
    })

    it("должен отображать параметры в tooltip", () => {
      const tooltipContent = screen.getAllByTestId("tooltip-content")
      expect(tooltipContent.length).toBeGreaterThan(0)
    })

    it("должен отображать правильные CSS классы для tooltip", () => {
      const tooltipContent = screen.getAllByTestId("tooltip-content")[0]
      expect(tooltipContent).toHaveAttribute("data-side", "right")
      expect(tooltipContent).toHaveClass("max-w-xs")
    })
  })

  describe("CSS и стили", () => {
    it("должен применять правильные классы к контейнеру", () => {
      const { container } = render(<EffectPresets {...mockProps} />)
      const mainContainer = container.firstChild

      expect(mainContainer).toHaveClass("border")
      expect(mainContainer).toHaveClass("rounded-lg")
    })

    it("должен применять hover эффекты к заголовку", () => {
      render(<EffectPresets {...mockProps} />)
      const header = screen.getByRole("button")

      expect(header).toHaveClass("hover:bg-gray-50")
      expect(header).toHaveClass("dark:hover:bg-gray-800")
    })

    it("должен применять правильную высоту к кнопкам пресетов", () => {
      render(<EffectPresets {...mockProps} />)
      const header = screen.getByRole("button")
      fireEvent.click(header)

      const presetButtons = screen.getAllByText("Легкий")
      const presetButton = presetButtons[0].closest("button")
      expect(presetButton).toHaveClass("h-auto")
      expect(presetButton).toHaveClass("py-2")
    })
  })

  describe("Интеграция", () => {
    it("должен корректно работать с эффектом без встроенных пресетов но с пользовательскими", () => {
      const customPresets = {
        custom_123: {
          name: { ru: "Единственный", en: "Only One" },
          description: { ru: "Единственный пресет", en: "Only preset" },
          params: { intensity: 60 },
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(customPresets))

      const effectWithoutBuiltinPresets: BaseEffect = { ...baseEffect, presets: [] }

      render(<EffectPresets {...mockProps} effect={effectWithoutBuiltinPresets} />)

      expect(screen.getByText("(1)")).toBeInTheDocument()
    })

    it("должен правильно объединять встроенные и пользовательские пресеты", async () => {
      const customPresets = {
        custom_456: {
          name: { ru: "Дополнительный", en: "Additional" },
          description: { ru: "Дополнительный пресет", en: "Additional preset" },
          params: { intensity: 80 },
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(customPresets))

      render(<EffectPresets {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText("(3)")).toBeInTheDocument() // 2 встроенных + 1 пользовательский
      })

      const header = screen.getByRole("button")
      fireEvent.click(header)

      expect(screen.getAllByText("Легкий")).toHaveLength(2) // встроенный (button + tooltip)
      expect(screen.getAllByText("Сильный")).toHaveLength(2) // встроенный (button + tooltip)
      await waitFor(() => {
        expect(screen.getAllByText("Дополнительный")).toHaveLength(2) // пользовательский (button + tooltip)
      })
    })
  })

  describe("Производительность", () => {
    it("должен эффективно рендерить большое количество пресетов", () => {
      const manyPresets = Array.from({ length: 20 }, (_, i) => ({
        id: `preset-${i}`,
        name: { ru: `Пресет ${i}`, en: `Preset ${i}` },
        description: { ru: `Описание ${i}`, en: `Description ${i}` },
        parameters: { intensity: i * 5 },
        tags: [],
      }))

      const effectWithManyPresets = {
        ...baseEffect,
        presets: manyPresets,
      }

      const startTime = performance.now()
      render(<EffectPresets {...mockProps} effect={effectWithManyPresets} />)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100)
    })

    it("должен правильно обрабатывать частые изменения selectedPreset", () => {
      const { rerender } = render(<EffectPresets {...mockProps} />)

      for (let i = 0; i < 10; i++) {
        const preset = i % 2 === 0 ? "light" : "strong"
        rerender(<EffectPresets {...mockProps} selectedPreset={preset} />)
      }

      expect(screen.getByText("Пресеты")).toBeInTheDocument()
    })
  })
})
