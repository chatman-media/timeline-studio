import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useFavorites } from "../../hooks/use-favorites"

// Мокаем useApp
const mockExecuteCommand = vi.fn()

vi.mock("../../services/app-provider", () => ({
  useApp: () => ({
    executeCommand: mockExecuteCommand,
  }),
}))

describe("useFavorites", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен возвращать объект избранных элементов", () => {
    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toEqual({
      transition: [],
      effect: [],
      template: [],
      filter: [],
      subtitle: [],
      media: [],
      music: [],
      styleTemplate: [],
    })
  })

  it("должен предоставлять метод обновления избранных", async () => {
    const { result } = renderHook(() => useFavorites())

    const newItem = { id: "effect1", name: "Blur" }

    // Добавляем элемент в избранное
    await act(async () => {
      await result.current.addToFavorites(newItem, "effect")
    })

    // Проверяем, что элемент добавился
    expect(result.current.favorites.effect).toContainEqual(newItem)

    // Проверяем, что вызвалась команда
    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "BrowserAddToFavorites",
      params: { file_id: "effect1", tab: "effects" },
    })
  })

  it("должен предоставлять метод добавления в избранное", async () => {
    const { result } = renderHook(() => useFavorites())

    const newItem = { id: "filter1", name: "Sepia" }

    await act(async () => {
      await result.current.addToFavorites(newItem, "filter")
    })

    expect(result.current.favorites.filter).toContainEqual(newItem)
  })

  it("должен предоставлять метод удаления из избранного", async () => {
    const { result } = renderHook(() => useFavorites())

    // Сначала добавляем элемент
    const item = { id: "effect1", name: "Blur" }
    await act(async () => {
      await result.current.addToFavorites(item, "effect")
    })

    expect(result.current.favorites.effect).toContainEqual(item)

    // Затем удаляем
    await act(async () => {
      await result.current.removeFromFavorites(item, "effect")
    })

    expect(result.current.favorites.effect).not.toContainEqual(item)
  })

  it("должен проверять, является ли элемент избранным", async () => {
    const { result } = renderHook(() => useFavorites())

    // Добавляем элементы
    const effect1 = { id: "effect1", name: "Blur" }
    const effect2 = { id: "effect2", name: "Sharpen" }
    const filter1 = { id: "filter1", name: "Sepia" }

    await act(async () => {
      await result.current.addToFavorites(effect1, "effect")
      await result.current.addToFavorites(effect2, "effect")
      await result.current.addToFavorites(filter1, "filter")
    })

    // Проверяем избранный элемент
    expect(result.current.isItemFavorite({ id: "effect1" }, "effect")).toBe(true)
    expect(result.current.isItemFavorite({ id: "filter1" }, "filter")).toBe(true)

    // Проверяем не избранный элемент
    expect(result.current.isItemFavorite({ id: "effect3" }, "effect")).toBe(false)
    expect(result.current.isItemFavorite({ id: "filter2" }, "filter")).toBe(false)
  })

  it("должен корректно работать с пустым типом избранного", () => {
    const { result } = renderHook(() => useFavorites())

    // Когда тип не существует в favorites, возвращается false
    expect(result.current.isItemFavorite({ id: "any" }, "nonExistentType")).toBe(false)
  })

  it("должен корректно работать с элементами без id", () => {
    const { result } = renderHook(() => useFavorites())

    expect(result.current.isItemFavorite({ name: "NoId" }, "effects")).toBe(false)
  })

  it("должен обновлять isItemFavorite при изменении избранных", async () => {
    const { result } = renderHook(() => useFavorites())

    const effect1 = { id: "effect1", name: "Blur" }
    const effect2 = { id: "effect2", name: "Sharpen" }

    // Добавляем первый эффект
    await act(async () => {
      await result.current.addToFavorites(effect1, "effect")
    })

    expect(result.current.isItemFavorite({ id: "effect2" }, "effect")).toBe(false)

    // Добавляем второй эффект
    await act(async () => {
      await result.current.addToFavorites(effect2, "effect")
    })

    expect(result.current.isItemFavorite({ id: "effect2" }, "effect")).toBe(true)
  })
})
