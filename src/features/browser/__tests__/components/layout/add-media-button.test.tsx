/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react"
import type { MediaFile } from "@timeline-studio/domains/media-management"
import { MediaType } from "@timeline-studio/domains/video-editing/types/media"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AddMediaButton } from "../../../components/layout/add-media-button"

// Мокаем BackendSync
const mockExecuteCommand = vi.fn()
vi.mock("@timeline-studio/domains/project-management/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    executeCommand: mockExecuteCommand,
  })),
}))

// Создаем общий объект моков, который будет переиспользоваться
const mockUseResourcesReturn = vi.hoisted(() => ({
  addResource: vi.fn(),
  removeResource: vi.fn(),
  isAdded: vi.fn().mockReturnValue(false),
  addMedia: vi.fn(),
  addMusic: vi.fn(),
  addSubtitle: vi.fn(),
  addEffect: vi.fn(),
  addFilter: vi.fn(),
  addTransition: vi.fn(),
  addTemplate: vi.fn(),
  removeMedia: vi.fn(),
  removeMusic: vi.fn(),
  removeSubtitle: vi.fn(),
  removeEffect: vi.fn(),
  removeFilter: vi.fn(),
  removeTransition: vi.fn(),
  removeTemplate: vi.fn(),
  clear: vi.fn(),
  getResource: vi.fn(),
  getResources: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  replaceAll: vi.fn(),
  resourceIds: [],
  mediaResources: [],
  musicResources: [],
  subtitleResources: [],
  effectResources: [],
  filterResources: [],
  transitionResources: [],
  templateResources: [],
}))

vi.mock("@/features/timeline/providers/resources-provider", () => {
  return {
    ResourcesProvider: ({ children }: { children: React.ReactNode }) => children,
    useResources: vi.fn(() => mockUseResourcesReturn),
  }
})

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.media.add": "Add to timeline",
        "browser.media.added": "Added to timeline",
        "browser.media.remove": "Remove from timeline",
      }
      return translations[key] || key
    },
  }),
}))

// Мокаем Lucide иконки
vi.mock("lucide-react", () => ({
  Plus: ({ className, strokeWidth }: any) => (
    <div data-testid="plus-icon" className={className} data-stroke-width={strokeWidth} data-oid="3anl0pp">
      Plus Icon
    </div>
  ),

  Check: ({ className, strokeWidth }: any) => (
    <div data-testid="check-icon" className={className} data-stroke-width={strokeWidth} data-oid="_r8ed5p">
      Check Icon
    </div>
  ),

  X: ({ className, strokeWidth }: any) => (
    <div data-testid="x-icon" className={className} data-stroke-width={strokeWidth} data-oid=":94e8a3">
      X Icon
    </div>
  ),
}))

describe("AddMediaButton", () => {
  // Создаем тестовый медиа ресурс
  const testMediaFile: MediaFile = {
    id: "test-file-id",
    name: "test-file.mp4",
    path: "/path/to/test-file.mp4",
    type: MediaType.Video,
    isVideo: true,
    isAudio: false,
    isImage: false,
    size: 1024,
    duration: 60,
  }

  const testResource = {
    id: "test-resource-id",
    type: "media" as const,
    name: "test-file.mp4",
    resourceId: testMediaFile.id,
    addedAt: Date.now(),
    file: testMediaFile,
  }

  // Мокаем функции обратного вызова
  const onAddMedia = vi.fn()
  const onRemoveMedia = vi.fn()

  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
    // Мокаем setTimeout и clearTimeout
    vi.useFakeTimers()
  })

  // Восстанавливаем оригинальные функции после тестов
  afterEach(() => {
    vi.useRealTimers()
  })

  it("should render add button when isAdded is false", () => {
    // Рендерим компонент
    render(<AddMediaButton resource={testResource} type="media" size={150} data-oid="pny8cyj" />)

    // Проверяем, что отображается иконка Plus
    expect(screen.getByTestId("plus-icon")).toBeInTheDocument()

    // Проверяем, что кнопка имеет правильный title
    expect(screen.getByTitle("Add to timeline")).toBeInTheDocument()

    // Проверяем, что кнопка имеет класс invisible (скрыта по умолчанию)
    const button = screen.getByTitle("Add to timeline")
    expect(button.className).toContain("invisible")
    expect(button.className).toContain("group-hover:visible")
  })

  it("should render check icon when isAdded is true", () => {
    // Настраиваем мок для возврата true
    mockUseResourcesReturn.isAdded.mockReturnValue(true)

    // Рендерим компонент
    render(<AddMediaButton resource={testResource} type="media" size={150} data-oid="5o:x2rn" />)

    // Проверяем, что отображается иконка Check
    expect(screen.getByTestId("check-icon")).toBeInTheDocument()

    // Проверяем, что кнопка имеет правильный title
    expect(screen.getByTitle("Added to timeline")).toBeInTheDocument()

    // Проверяем, что кнопка имеет класс visible
    const button = screen.getByTitle("Added to timeline")
    expect(button.className).toContain("visible")
  })

  it("should call addMedia when clicked while hovering and not added", () => {
    // Настраиваем мок для возврата false
    mockUseResourcesReturn.isAdded.mockReturnValue(false)

    // Рендерим компонент
    render(<AddMediaButton resource={testResource} type="media" size={150} data-oid="sfxd8i_" />)

    // Наводим мышь на кнопку (необходимо для срабатывания логики)
    const button = screen.getByTitle("Add to timeline")
    act(() => {
      fireEvent.mouseEnter(button)
    })

    // Кликаем на кнопку
    act(() => {
      fireEvent.click(button)
    })

    // Проверяем, что addMedia был вызван с файлом
    expect(mockUseResourcesReturn.addMedia).toHaveBeenCalledTimes(1)
    expect(mockUseResourcesReturn.addMedia).toHaveBeenCalledWith(testResource.file)
  })

  it("should show remove icon on hover when isAdded is true and not recently added", () => {
    // Настраиваем мок для возврата true
    mockUseResourcesReturn.isAdded.mockReturnValue(true)

    // Рендерим компонент
    render(<AddMediaButton resource={testResource} type="media" size={150} data-oid="td.jih6" />)

    // Проверяем, что изначально отображается иконка Check
    expect(screen.getByTestId("check-icon")).toBeInTheDocument()

    // Продвигаем таймеры вперед, чтобы сбросить флаг isRecentlyAdded
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Получаем кнопку
    const button = screen.getByTitle("Added to timeline")

    // Симулируем наведение на кнопку
    act(() => {
      fireEvent.mouseEnter(button)
    })

    // Проверяем, что title изменился
    expect(screen.getByTitle("Remove from timeline")).toBeInTheDocument()

    // Проверяем, что отображается иконка X
    expect(screen.getByTestId("x-icon")).toBeInTheDocument()
  })

  it("should call removeResource when clicked on remove icon", async () => {
    // Настраиваем мок для возврата true
    mockUseResourcesReturn.isAdded.mockReturnValue(true)

    // Рендерим компонент
    const { rerender } = render(<AddMediaButton resource={testResource} type="media" size={150} data-oid="_vzw16g" />)

    // Продвигаем таймеры вперед, чтобы сбросить флаг isRecentlyAdded (1 секунда из компонента)
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    // Перерисовываем чтобы убедиться что состояние обновилось
    rerender(<AddMediaButton resource={testResource} type="media" size={150} data-oid="32pekfi" />)

    // Получаем кнопку
    const button = screen.getByTitle("Added to timeline")

    // Симулируем наведение на кнопку
    act(() => {
      fireEvent.mouseEnter(button)
    })

    // Теперь title должен измениться на "Remove from timeline"
    const removeButton = screen.getByTitle("Remove from timeline")

    // Кликаем на кнопку удаления
    act(() => {
      fireEvent.click(removeButton)
    })

    // Проверяем, что removeResource был вызван с правильными аргументами
    expect(mockUseResourcesReturn.removeResource).toHaveBeenCalledTimes(1)
    expect(mockUseResourcesReturn.removeResource).toHaveBeenCalledWith(testResource.id, "media")
  })
})
