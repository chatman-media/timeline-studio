import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useTimelineTracks } from "../use-timeline-tracks"

describe("useTimelineTracks", () => {
  describe("Базовая функциональность", () => {
    it("должен возвращать аудио треки", () => {
      const { result } = renderHook(() => useTimelineTracks())

      expect(result.current.audioTracks).toHaveLength(2)
      expect(result.current.audioTracks[0]).toEqual({
        id: "audio1",
        name: "Audio Track 1",
        type: "stereo",
        trackId: "audio1",
      })
      expect(result.current.audioTracks[1]).toEqual({
        id: "audio2",
        name: "Audio Track 2",
        type: "mono",
        trackId: "audio2",
      })
    })

    it("должен возвращать видео треки", () => {
      const { result } = renderHook(() => useTimelineTracks())

      expect(result.current.videoTracks).toHaveLength(1)
      expect(result.current.videoTracks[0]).toEqual({
        id: "video1",
        name: "Video Track 1",
        trackId: "video1",
      })
    })

    it("должен возвращать все треки в правильном порядке", () => {
      const { result } = renderHook(() => useTimelineTracks())

      expect(result.current.allTracks).toHaveLength(3)
      // Видео треки идут первыми
      expect(result.current.allTracks[0].id).toBe("video1")
      // Затем аудио треки
      expect(result.current.allTracks[1].id).toBe("audio1")
      expect(result.current.allTracks[2].id).toBe("audio2")
    })
  })

  describe("Мемоизация", () => {
    it("должен возвращать одинаковые ссылки при повторных рендерах", () => {
      const { result, rerender } = renderHook(() => useTimelineTracks())

      const audioTracks1 = result.current.audioTracks
      const videoTracks1 = result.current.videoTracks
      const allTracks1 = result.current.allTracks

      rerender()

      const audioTracks2 = result.current.audioTracks
      const videoTracks2 = result.current.videoTracks
      const allTracks2 = result.current.allTracks

      // Проверяем что ссылки не изменились благодаря useMemo
      expect(audioTracks1).toBe(audioTracks2)
      expect(videoTracks1).toBe(videoTracks2)

      // allTracks создаётся каждый раз заново из-за spread оператора
      expect(allTracks1).not.toBe(allTracks2)
      // Но содержимое должно быть одинаковым
      expect(allTracks1).toEqual(allTracks2)
    })
  })

  describe("Типы треков", () => {
    it("должен правильно типизировать аудио треки", () => {
      const { result } = renderHook(() => useTimelineTracks())

      const stereoTrack = result.current.audioTracks.find((t) => t.type === "stereo")
      const monoTrack = result.current.audioTracks.find((t) => t.type === "mono")

      expect(stereoTrack).toBeDefined()
      expect(monoTrack).toBeDefined()
      expect(stereoTrack?.name).toBe("Audio Track 1")
      expect(monoTrack?.name).toBe("Audio Track 2")
    })

    it("видео треки не должны иметь поле type", () => {
      const { result } = renderHook(() => useTimelineTracks())

      const videoTrack = result.current.videoTracks[0]
      expect(videoTrack).not.toHaveProperty("type")
    })
  })

  describe("Консистентность данных", () => {
    it("должен иметь уникальные ID для всех треков", () => {
      const { result } = renderHook(() => useTimelineTracks())

      const allIds = result.current.allTracks.map((t) => t.id)
      const uniqueIds = new Set(allIds)

      expect(uniqueIds.size).toBe(allIds.length)
    })

    it("должен иметь соответствие между id и trackId", () => {
      const { result } = renderHook(() => useTimelineTracks())

      result.current.allTracks.forEach((track) => {
        expect(track.id).toBe(track.trackId)
      })
    })

    it("должен иметь корректные имена треков", () => {
      const { result } = renderHook(() => useTimelineTracks())

      expect(result.current.audioTracks[0].name).toMatch(/Audio Track \d/)
      expect(result.current.audioTracks[1].name).toMatch(/Audio Track \d/)
      expect(result.current.videoTracks[0].name).toMatch(/Video Track \d/)
    })
  })

  describe("Структура возвращаемых данных", () => {
    it("должен возвращать объект с тремя полями", () => {
      const { result } = renderHook(() => useTimelineTracks())

      expect(result.current).toHaveProperty("audioTracks")
      expect(result.current).toHaveProperty("videoTracks")
      expect(result.current).toHaveProperty("allTracks")
      expect(Object.keys(result.current)).toHaveLength(3)
    })

    it("должен возвращать массивы для всех полей", () => {
      const { result } = renderHook(() => useTimelineTracks())

      expect(Array.isArray(result.current.audioTracks)).toBe(true)
      expect(Array.isArray(result.current.videoTracks)).toBe(true)
      expect(Array.isArray(result.current.allTracks)).toBe(true)
    })
  })

  describe("Edge cases", () => {
    it("должен корректно работать при множественных вызовах", () => {
      const { result: result1 } = renderHook(() => useTimelineTracks())
      const { result: result2 } = renderHook(() => useTimelineTracks())

      // Разные экземпляры хука должны возвращать одинаковые данные
      expect(result1.current.audioTracks).toEqual(result2.current.audioTracks)
      expect(result1.current.videoTracks).toEqual(result2.current.videoTracks)
      expect(result1.current.allTracks).toEqual(result2.current.allTracks)
    })

    it("должен быть готов к миграции на реальную реализацию", () => {
      const { result } = renderHook(() => useTimelineTracks())

      // Проверяем, что структура данных подходит для будущей интеграции
      result.current.audioTracks.forEach((track) => {
        expect(track).toHaveProperty("id")
        expect(track).toHaveProperty("name")
        expect(track).toHaveProperty("trackId")
        expect(typeof track.id).toBe("string")
        expect(typeof track.name).toBe("string")
        expect(typeof track.trackId).toBe("string")
      })

      result.current.videoTracks.forEach((track) => {
        expect(track).toHaveProperty("id")
        expect(track).toHaveProperty("name")
        expect(track).toHaveProperty("trackId")
        expect(typeof track.id).toBe("string")
        expect(typeof track.name).toBe("string")
        expect(typeof track.trackId).toBe("string")
      })
    })
  })
})
