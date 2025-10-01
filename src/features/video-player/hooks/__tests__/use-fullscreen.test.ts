import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useFullscreen } from "../use-fullscreen"

// Мокаем document.fullscreenElement и методы для работы с полноэкранным режимом
Object.defineProperty(document, "fullscreenElement", {
  writable: true,
  value: null,
})

// Мокаем методы для работы с полноэкранным режимом
document.exitFullscreen = vi.fn().mockImplementation(() => Promise.resolve())
Element.prototype.requestFullscreen = vi.fn().mockImplementation(() => {
  // Устанавливаем текущий элемент как fullscreenElement
  Object.defineProperty(document, "fullscreenElement", {
    writable: true,
    value: null,
  })
  // Вызываем событие fullscreenchange
  const event = new Event("fullscreenchange")
  document.dispatchEvent(event)
  return Promise.resolve()
})

// Мокаем console.log для проверки вызова
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "log").mockImplementation(() => {})

  // Сбрасываем fullscreenElement перед каждым тестом
  Object.defineProperty(document, "fullscreenElement", {
    writable: true,
    value: null,
  })
})

describe("useFullscreen", () => {
  it("should initialize with isFullscreen as false", () => {
    // Рендерим хук
    const { result } = renderHook(() => useFullscreen())

    // Проверяем, что начальное значение isFullscreen равно false
    expect(result.current.isFullscreen).toBe(false)
  })

  it("should provide enterFullscreen, exitFullscreen, and toggleFullscreen functions", () => {
    // Рендерим хук
    const { result } = renderHook(() => useFullscreen())

    // Проверяем, что хук возвращает нужные функции
    expect(typeof result.current.enterFullscreen).toBe("function")
    expect(typeof result.current.exitFullscreen).toBe("function")
    expect(typeof result.current.toggleFullscreen).toBe("function")
  })

  it("should enter fullscreen mode when enterFullscreen is called", () => {
    // Рендерим хук
    const { result } = renderHook(() => useFullscreen())

    // Создаем тестовый элемент
    const testElement = document.createElement("div")

    // Вызываем функцию enterFullscreen
    act(() => {
      result.current.enterFullscreen(testElement)
    })

    // Проверяем, что requestFullscreen был вызван
    expect(testElement.requestFullscreen).toHaveBeenCalled()
  })

  it("should exit fullscreen mode when exitFullscreen is called", () => {
    // Рендерим хук
    const { result } = renderHook(() => useFullscreen())

    // Устанавливаем fullscreenElement, чтобы симулировать полноэкранный режим
    const testElement = document.createElement("div")
    Object.defineProperty(document, "fullscreenElement", {
      writable: true,
      value: testElement,
    })

    // Вызываем функцию exitFullscreen
    act(() => {
      result.current.exitFullscreen()
    })

    // Проверяем, что exitFullscreen был вызван
    expect(document.exitFullscreen).toHaveBeenCalled()
  })

  it("should toggle fullscreen mode when toggleFullscreen is called", () => {
    // Рендерим хук
    const { result } = renderHook(() => useFullscreen())

    // Создаем тестовый элемент
    const testElement = document.createElement("div")

    // Вызываем toggleFullscreen, когда мы не в полноэкранном режиме
    act(() => {
      result.current.toggleFullscreen(testElement)
    })

    // Проверяем, что requestFullscreen был вызван
    expect(testElement.requestFullscreen).toHaveBeenCalled()

    // Сбрасываем моки
    vi.clearAllMocks()

    // Устанавливаем fullscreenElement, чтобы симулировать полноэкранный режим
    Object.defineProperty(document, "fullscreenElement", {
      writable: true,
      value: testElement,
    })

    // Вызываем toggleFullscreen, когда мы в полноэкранном режиме
    act(() => {
      result.current.toggleFullscreen(testElement)
    })

    // Проверяем, что exitFullscreen был вызван
    expect(document.exitFullscreen).toHaveBeenCalled()
  })

  it("should update isFullscreen when fullscreenchange event is fired", () => {
    // Рендерим хук
    const { result } = renderHook(() => useFullscreen())

    // Проверяем начальное значение
    expect(result.current.isFullscreen).toBe(false)

    // Создаем тестовый элемент и устанавливаем его как fullscreenElement
    const testElement = document.createElement("div")
    Object.defineProperty(document, "fullscreenElement", {
      writable: true,
      value: testElement,
    })

    // Вызываем событие fullscreenchange
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"))
    })

    // Проверяем, что isFullscreen обновился
    expect(result.current.isFullscreen).toBe(true)

    // Сбрасываем fullscreenElement
    Object.defineProperty(document, "fullscreenElement", {
      writable: true,
      value: null,
    })

    // Вызываем событие fullscreenchange снова
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"))
    })

    // Проверяем, что isFullscreen обновился
    expect(result.current.isFullscreen).toBe(false)
  })
})
