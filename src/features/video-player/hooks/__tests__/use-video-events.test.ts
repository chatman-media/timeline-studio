/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react"
import { createRef } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useVideoEvents } from "../use-video-events"

describe("useVideoEvents", () => {
  let videoElement: HTMLVideoElement
  let videoRef: React.RefObject<HTMLVideoElement>

  beforeEach(() => {
    videoElement = document.createElement("video")
    videoRef = createRef<HTMLVideoElement>() as React.MutableRefObject<HTMLVideoElement>
    videoRef.current = videoElement
    document.body.appendChild(videoElement)
  })

  afterEach(() => {
    document.body.removeChild(videoElement)
    vi.restoreAllMocks()
  })

  describe("события воспроизведения", () => {
    it("должен вызывать onPlay при воспроизведении", () => {
      const onPlay = vi.fn()
      renderHook(() => useVideoEvents(videoRef, { onPlay }))

      videoElement.dispatchEvent(new Event("play"))

      expect(onPlay).toHaveBeenCalledTimes(1)
    })

    it("должен вызывать onPause при паузе", () => {
      const onPause = vi.fn()
      renderHook(() => useVideoEvents(videoRef, { onPause }))

      videoElement.dispatchEvent(new Event("pause"))

      expect(onPause).toHaveBeenCalledTimes(1)
    })

    it("должен вызывать onEnded когда видео закончилось", () => {
      const onEnded = vi.fn()
      renderHook(() => useVideoEvents(videoRef, { onEnded }))

      videoElement.dispatchEvent(new Event("ended"))

      expect(onEnded).toHaveBeenCalledTimes(1)
    })
  })

  describe("события seek", () => {
    it("должен вызывать onSeeking при начале seek", () => {
      const onSeeking = vi.fn()
      renderHook(() => useVideoEvents(videoRef, { onSeeking }))

      videoElement.dispatchEvent(new Event("seeking"))

      expect(onSeeking).toHaveBeenCalledTimes(1)
    })

    it("должен вызывать onSeeked при завершении seek", () => {
      const onSeeked = vi.fn()
      renderHook(() => useVideoEvents(videoRef, { onSeeked }))

      videoElement.dispatchEvent(new Event("seeked"))

      expect(onSeeked).toHaveBeenCalledTimes(1)
    })

    it("должен обрабатывать последовательность seeking -> seeked", () => {
      const onSeeking = vi.fn()
      const onSeeked = vi.fn()
      renderHook(() => useVideoEvents(videoRef, { onSeeking, onSeeked }))

      videoElement.dispatchEvent(new Event("seeking"))
      expect(onSeeking).toHaveBeenCalledTimes(1)
      expect(onSeeked).not.toHaveBeenCalled()

      videoElement.dispatchEvent(new Event("seeked"))
      expect(onSeeked).toHaveBeenCalledTimes(1)
    })
  })

  describe("события времени", () => {
    it("должен вызывать onTimeUpdate с текущим временем", () => {
      const onTimeUpdate = vi.fn()
      Object.defineProperty(videoElement, "currentTime", {
        value: 5.5,
        writable: true,
      })

      renderHook(() => useVideoEvents(videoRef, { onTimeUpdate }))

      videoElement.dispatchEvent(new Event("timeupdate"))

      expect(onTimeUpdate).toHaveBeenCalledWith(5.5)
    })

    it("должен вызывать onDurationChange с длительностью", () => {
      const onDurationChange = vi.fn()
      Object.defineProperty(videoElement, "duration", {
        value: 120.5,
        writable: true,
      })

      renderHook(() => useVideoEvents(videoRef, { onDurationChange }))

      videoElement.dispatchEvent(new Event("durationchange"))

      expect(onDurationChange).toHaveBeenCalledWith(120.5)
    })

    it("не должен вызывать onDurationChange если duration NaN", () => {
      const onDurationChange = vi.fn()
      Object.defineProperty(videoElement, "duration", {
        value: Number.NaN,
        writable: true,
      })

      renderHook(() => useVideoEvents(videoRef, { onDurationChange }))

      videoElement.dispatchEvent(new Event("durationchange"))

      expect(onDurationChange).not.toHaveBeenCalled()
    })

    it("не должен вызывать onDurationChange если duration Infinity", () => {
      const onDurationChange = vi.fn()
      Object.defineProperty(videoElement, "duration", {
        value: Number.POSITIVE_INFINITY,
        writable: true,
      })

      renderHook(() => useVideoEvents(videoRef, { onDurationChange }))

      videoElement.dispatchEvent(new Event("durationchange"))

      expect(onDurationChange).not.toHaveBeenCalled()
    })
  })

  describe("события загрузки", () => {
    it("должен вызывать onLoadStart", () => {
      const onLoadStart = vi.fn()
      renderHook(() => useVideoEvents(videoRef, { onLoadStart }))

      videoElement.dispatchEvent(new Event("loadstart"))

      expect(onLoadStart).toHaveBeenCalledTimes(1)
    })

    it("должен вызывать onLoadedMetadata с метаданными", () => {
      const onLoadedMetadata = vi.fn()
      Object.defineProperties(videoElement, {
        duration: { value: 100, writable: true },
        videoWidth: { value: 1920, writable: true },
        videoHeight: { value: 1080, writable: true },
      })

      renderHook(() => useVideoEvents(videoRef, { onLoadedMetadata }))

      videoElement.dispatchEvent(new Event("loadedmetadata"))

      expect(onLoadedMetadata).toHaveBeenCalledWith({
        duration: 100,
        videoWidth: 1920,
        videoHeight: 1080,
      })
    })

    it("должен вызывать onLoadedData", () => {
      const onLoadedData = vi.fn()
      renderHook(() => useVideoEvents(videoRef, { onLoadedData }))

      videoElement.dispatchEvent(new Event("loadeddata"))

      expect(onLoadedData).toHaveBeenCalledTimes(1)
    })

    it("должен вызывать onCanPlay", () => {
      const onCanPlay = vi.fn()
      renderHook(() => useVideoEvents(videoRef, { onCanPlay }))

      videoElement.dispatchEvent(new Event("canplay"))

      expect(onCanPlay).toHaveBeenCalledTimes(1)
    })
  })

  describe("события буферизации", () => {
    it("должен вызывать onWaiting при ожидании данных", () => {
      const onWaiting = vi.fn()
      renderHook(() => useVideoEvents(videoRef, { onWaiting }))

      videoElement.dispatchEvent(new Event("waiting"))

      expect(onWaiting).toHaveBeenCalledTimes(1)
    })
  })

  describe("события изменения параметров", () => {
    it("должен вызывать onRateChange при изменении скорости", () => {
      const onRateChange = vi.fn()
      Object.defineProperty(videoElement, "playbackRate", {
        value: 2.0,
        writable: true,
      })

      renderHook(() => useVideoEvents(videoRef, { onRateChange }))

      videoElement.dispatchEvent(new Event("ratechange"))

      expect(onRateChange).toHaveBeenCalledWith(2.0)
    })

    it("должен вызывать onVolumeChange при изменении громкости", () => {
      const onVolumeChange = vi.fn()
      Object.defineProperties(videoElement, {
        volume: { value: 0.7, writable: true },
        muted: { value: false, writable: true },
      })

      renderHook(() => useVideoEvents(videoRef, { onVolumeChange }))

      videoElement.dispatchEvent(new Event("volumechange"))

      expect(onVolumeChange).toHaveBeenCalledWith(0.7, false)
    })

    it("должен вызывать onVolumeChange с muted = true", () => {
      const onVolumeChange = vi.fn()
      Object.defineProperties(videoElement, {
        volume: { value: 0.5, writable: true },
        muted: { value: true, writable: true },
      })

      renderHook(() => useVideoEvents(videoRef, { onVolumeChange }))

      videoElement.dispatchEvent(new Event("volumechange"))

      expect(onVolumeChange).toHaveBeenCalledWith(0.5, true)
    })
  })

  describe("обработка ошибок", () => {
    it("должен вызывать onError при ошибке воспроизведения", () => {
      const onError = vi.fn()
      const mockError = {
        code: 4,
        message: "MEDIA_ELEMENT_ERROR: Format error",
      }
      Object.defineProperty(videoElement, "error", {
        value: mockError,
        writable: true,
      })

      renderHook(() => useVideoEvents(videoRef, { onError }))

      videoElement.dispatchEvent(new Event("error"))

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onError.mock.calls[0][0].message).toContain("MEDIA_ELEMENT_ERROR")
    })

    it("должен использовать код ошибки если сообщение отсутствует", () => {
      const onError = vi.fn()
      const mockError = {
        code: 3,
        message: "",
      }
      Object.defineProperty(videoElement, "error", {
        value: mockError,
        writable: true,
      })

      renderHook(() => useVideoEvents(videoRef, { onError }))

      videoElement.dispatchEvent(new Event("error"))

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onError.mock.calls[0][0].message).toBe("Media error code: 3")
    })

    it("не должен вызывать onError если video.error null", () => {
      const onError = vi.fn()
      Object.defineProperty(videoElement, "error", {
        value: null,
        writable: true,
      })

      renderHook(() => useVideoEvents(videoRef, { onError }))

      videoElement.dispatchEvent(new Event("error"))

      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe("очистка обработчиков", () => {
    it("должен удалять обработчики при размонтировании", () => {
      const onPlay = vi.fn()
      const onPause = vi.fn()
      const addSpy = vi.spyOn(videoElement, "addEventListener")
      const removeSpy = vi.spyOn(videoElement, "removeEventListener")

      const { unmount } = renderHook(() => useVideoEvents(videoRef, { onPlay, onPause }))

      expect(addSpy).toHaveBeenCalledTimes(2)

      unmount()

      expect(removeSpy).toHaveBeenCalledTimes(2)
    })

    it("не должен вызывать обработчики после размонтирования", () => {
      const onPlay = vi.fn()
      const { unmount } = renderHook(() => useVideoEvents(videoRef, { onPlay }))

      unmount()

      videoElement.dispatchEvent(new Event("play"))

      expect(onPlay).not.toHaveBeenCalled()
    })
  })

  describe("условная регистрация обработчиков", () => {
    it("должен регистрировать только переданные обработчики", () => {
      const addSpy = vi.spyOn(videoElement, "addEventListener")
      const onPlay = vi.fn()

      renderHook(() => useVideoEvents(videoRef, { onPlay }))

      // Проверяем, что зарегистрирован только обработчик play
      const eventTypes = addSpy.mock.calls.map((call) => call[0])
      expect(eventTypes).toContain("play")
      expect(eventTypes).not.toContain("pause")
      expect(eventTypes).not.toContain("ended")
    })

    it("должен поддерживать частичный набор обработчиков", () => {
      const onPlay = vi.fn()
      const onError = vi.fn()
      const addSpy = vi.spyOn(videoElement, "addEventListener")

      renderHook(() => useVideoEvents(videoRef, { onPlay, onError }))

      const eventTypes = addSpy.mock.calls.map((call) => call[0])
      expect(eventTypes).toEqual(expect.arrayContaining(["play", "error"]))
      expect(eventTypes.length).toBe(2)
    })
  })

  describe("обработка null ref", () => {
    it("не должен падать если ref.current null", () => {
      const nullRef = createRef<HTMLVideoElement>() as React.MutableRefObject<HTMLVideoElement | null>
      nullRef.current = null

      expect(() => {
        renderHook(() => useVideoEvents(nullRef, { onPlay: vi.fn() }))
      }).not.toThrow()
    })
  })

  describe("множественные события", () => {
    it("должен обрабатывать все события в правильной последовательности", () => {
      const events: string[] = []
      const handlers = {
        onLoadStart: () => events.push("loadstart"),
        onLoadedMetadata: () => events.push("loadedmetadata"),
        onLoadedData: () => events.push("loadeddata"),
        onCanPlay: () => events.push("canplay"),
        onPlay: () => events.push("play"),
        onTimeUpdate: () => events.push("timeupdate"),
        onPause: () => events.push("pause"),
      }

      Object.defineProperties(videoElement, {
        duration: { value: 100, writable: true },
        videoWidth: { value: 1920, writable: true },
        videoHeight: { value: 1080, writable: true },
        currentTime: { value: 5, writable: true },
      })

      renderHook(() => useVideoEvents(videoRef, handlers))

      // Симулируем типичную последовательность событий
      videoElement.dispatchEvent(new Event("loadstart"))
      videoElement.dispatchEvent(new Event("loadedmetadata"))
      videoElement.dispatchEvent(new Event("loadeddata"))
      videoElement.dispatchEvent(new Event("canplay"))
      videoElement.dispatchEvent(new Event("play"))
      videoElement.dispatchEvent(new Event("timeupdate"))
      videoElement.dispatchEvent(new Event("pause"))

      expect(events).toEqual(["loadstart", "loadedmetadata", "loadeddata", "canplay", "play", "timeupdate", "pause"])
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать быстрые последовательные события", () => {
      const onPlay = vi.fn()
      renderHook(() => useVideoEvents(videoRef, { onPlay }))

      // Быстро отправляем несколько событий
      for (let i = 0; i < 10; i++) {
        videoElement.dispatchEvent(new Event("play"))
      }

      expect(onPlay).toHaveBeenCalledTimes(10)
    })

    it("должен корректно обновлять обработчики при изменении", () => {
      const onPlay1 = vi.fn()
      const onPlay2 = vi.fn()

      const { rerender } = renderHook(({ handler }) => useVideoEvents(videoRef, { onPlay: handler }), {
        initialProps: { handler: onPlay1 },
      })

      videoElement.dispatchEvent(new Event("play"))
      expect(onPlay1).toHaveBeenCalledTimes(1)

      rerender({ handler: onPlay2 })

      videoElement.dispatchEvent(new Event("play"))
      expect(onPlay2).toHaveBeenCalledTimes(1)
      expect(onPlay1).toHaveBeenCalledTimes(1) // Старый обработчик не должен вызываться
    })
  })
})
