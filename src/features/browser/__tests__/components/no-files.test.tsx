import { act, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { renderWithBase, screen } from "@/test/test-utils"

import { NoFiles } from "../../components/no-files"

describe("NoFiles", () => {
  it("должен рендериться для типа media", async () => {
    renderWithBase(<NoFiles type="media" />)

    expect(screen.getByText("Медиафайлы не найдены")).toBeInTheDocument()
    expect(screen.getByText("Добавьте видео, аудио или фото файлы для работы с проектом")).toBeInTheDocument()

    // Ожидаем загрузку путей из AppDirectories
    await waitFor(
      () => {
        // Проверяем что путь загрузился (он будет содержать /Resources/Media)
        const pathElement = screen.queryByText(/Resources\/Media/)
        expect(pathElement).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it("должен рендериться для типа music", async () => {
    renderWithBase(<NoFiles type="music" />)

    expect(screen.getByText("Музыкальные файлы не найдены")).toBeInTheDocument()
    expect(screen.getByText("Добавьте музыку и звуковые эффекты для озвучивания проекта")).toBeInTheDocument()

    // Ожидаем загрузку путей
    await waitFor(
      () => {
        const pathElement = screen.queryByText(/Music/)
        expect(pathElement).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it("должен рендериться для типа effects", async () => {
    renderWithBase(<NoFiles type="effects" />)

    expect(screen.getByText("Эффекты не найдены")).toBeInTheDocument()
    expect(screen.getByText("Добавьте видеоэффекты для улучшения ваших клипов")).toBeInTheDocument()

    // Ожидаем загрузку путей
    await waitFor(
      () => {
        const pathElement = screen.queryByText(/Effects/)
        expect(pathElement).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it("должен рендериться для типа filters", async () => {
    renderWithBase(<NoFiles type="filters" />)

    expect(screen.getByText("Фильтры не найдены")).toBeInTheDocument()
    expect(screen.getByText("Добавьте цветовые фильтры и коррекцию для видео")).toBeInTheDocument()

    // Ожидаем загрузку путей
    await waitFor(
      () => {
        const pathElement = screen.queryByText(/Filters/)
        expect(pathElement).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it("должен показывать кнопку импорта когда передан onImport", () => {
    const mockImport = vi.fn()
    renderWithBase(<NoFiles type="media" onImport={mockImport} />)

    const importButton = screen.getByText("Импортировать медиафайлы")
    expect(importButton).toBeInTheDocument()
  })

  it("должен вызывать onImport при клике на кнопку", () => {
    const mockImport = vi.fn()
    renderWithBase(<NoFiles type="media" onImport={mockImport} />)

    const importButton = screen.getByText("Импортировать медиафайлы")
    act(() => {
      act(() => {
        importButton.click()
      })
    })

    expect(mockImport).toHaveBeenCalledTimes(1)
  })

  it("не должен показывать кнопку импорта когда onImport не передан", () => {
    renderWithBase(<NoFiles type="media" />)

    expect(screen.queryByText("Импортировать медиафайлы")).not.toBeInTheDocument()
  })

  it("должен показывать поддерживаемые форматы для media", () => {
    renderWithBase(<NoFiles type="media" />)

    expect(screen.getByText("Поддерживаемые форматы:")).toBeInTheDocument()
    expect(screen.getByText("Видео: MP4, MOV, AVI, MKV, WEBM, INSV (360°)")).toBeInTheDocument()
    expect(screen.getByText("Аудио: MP3, WAV, AAC, ALAC, OGG, FLAC")).toBeInTheDocument()
  })

  it("должен показывать правильные форматы для music", () => {
    renderWithBase(<NoFiles type="music" />)

    expect(screen.getByText("MP3, WAV, AAC, ALAC, OGG, FLAC")).toBeInTheDocument()
  })

  it("должен применять переданный className", () => {
    renderWithBase(<NoFiles type="media" className="custom-class" />)

    // Проверяем что className применился к основному контейнеру
    const container = screen.getByText("Медиафайлы не найдены").closest(".custom-class")
    expect(container).toBeInTheDocument()
  })

  it("должен показывать правильную иконку для каждого типа", () => {
    const { rerender } = renderWithBase(<NoFiles type="media" />)
    expect(screen.getByTestId("video-icon")).toBeInTheDocument()

    act(() => {
      rerender(<NoFiles type="music" />)
    })
    expect(screen.getByTestId("music-icon")).toBeInTheDocument()

    act(() => {
      rerender(<NoFiles type="effects" />)
    })
    expect(screen.getByTestId("sparkles-icon")).toBeInTheDocument()
  })
})
