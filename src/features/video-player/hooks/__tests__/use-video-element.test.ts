/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type MediaFile, MediaType } from "@/domains/media-management"
import { useVideoElement } from "../use-video-element"

describe("useVideoElement - Core Functionality", () => {
  let mockMediaFile: MediaFile
  let videoRefs: Record<string, HTMLVideoElement>

  beforeEach(() => {
    mockMediaFile = {
      id: "test-video-1",
      name: "test-video-1.mp4",
      path: "/path/to/test-video-1.mp4",
      type: MediaType.Video,
      duration: 120,
      size: 1024 * 1024 * 100,
      createdAt: new Date(),
      thumbnailPath: undefined,
      isVideo: true,
      isAudio: false,
      isImage: false,
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: 5000000,
      videoCodec: "h264",
    }

    videoRefs = {}
  })

  afterEach(() => {
    document.querySelectorAll("video").forEach((el) => el.remove())
    vi.restoreAllMocks()
  })

  describe("getOrCreateVideoElement", () => {
    it("должен создавать новый video элемент", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      // JSDOM использует mock для HTMLVideoElement, проверяем через tagName
      expect(videoElement.tagName).toBe("VIDEO")
      expect(videoElement.id).toBe(`video-${mockMediaFile.id}`)
      expect(document.body.contains(videoElement)).toBe(true)
    })

    it("должен устанавливать корректные атрибуты video элемента", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.7, setVideoSource)

      expect(videoElement.preload).toBe("auto")
      expect(videoElement.playsInline).toBe(true)
      expect(videoElement.controls).toBe(false)
      expect(videoElement.autoplay).toBe(false)
      expect(videoElement.loop).toBe(false)
      expect(videoElement.muted).toBe(false)
      expect(videoElement.volume).toBe(0.7)
      expect(videoElement.src).toContain(mockMediaFile.path)
    })

    it("должен скрывать video элемент в DOM", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      expect(videoElement.style.position).toBe("absolute")
      expect(videoElement.style.width).toBe("1px")
      expect(videoElement.style.height).toBe("1px")
      expect(videoElement.style.opacity).toBe("0")
      expect(videoElement.style.pointerEvents).toBe("none")
    })

    it("должен добавлять data-атрибут для идентификации", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      expect(videoElement.dataset.videoId).toBe(mockMediaFile.id)
    })

    it("должен сохранять ссылку в videoRefs", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      expect(videoRefs[mockMediaFile.id]).toBe(videoElement)
    })

    it("должен добавлять элемент в глобальный реестр", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      expect(result.current.allVideoElementsRef.current.size).toBe(1)
    })

    it("должен определять источник как media для видео без startTime", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      expect(setVideoSource).toHaveBeenCalledWith(mockMediaFile.id, "media")
    })

    it("должен определять источник как timeline для видео с startTime", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()
      const timelineVideo = { ...mockMediaFile, startTime: 5.0 }

      result.current.getOrCreateVideoElement(timelineVideo, videoRefs, 0.5, setVideoSource)

      expect(setVideoSource).toHaveBeenCalledWith(mockMediaFile.id, "timeline")
    })

    it("должен переиспользовать существующий video элемент", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement1 = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)
      const videoElement2 = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      expect(videoElement1).toBe(videoElement2)
      expect(document.querySelectorAll("video").length).toBe(1)
    })

    it("должен создавать новый элемент если старый удален из DOM", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement1 = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)
      videoElement1.remove()

      const videoElement2 = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      expect(videoElement1).not.toBe(videoElement2)
      expect(document.body.contains(videoElement2)).toBe(true)
    })

    it("должен обрабатывать множественные video элементы", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const video1 = result.current.getOrCreateVideoElement(
        { ...mockMediaFile, id: "video-1" },
        videoRefs,
        0.5,
        setVideoSource,
      )
      const video2 = result.current.getOrCreateVideoElement(
        { ...mockMediaFile, id: "video-2" },
        videoRefs,
        0.5,
        setVideoSource,
      )
      const video3 = result.current.getOrCreateVideoElement(
        { ...mockMediaFile, id: "video-3" },
        videoRefs,
        0.5,
        setVideoSource,
      )

      expect(video1).not.toBe(video2)
      expect(video2).not.toBe(video3)
      expect(result.current.allVideoElementsRef.current.size).toBe(3)
    })

    it("должен применять разную громкость для разных видео", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const video1 = result.current.getOrCreateVideoElement(
        { ...mockMediaFile, id: "video-1" },
        videoRefs,
        0.3,
        setVideoSource,
      )
      const video2 = result.current.getOrCreateVideoElement(
        { ...mockMediaFile, id: "video-2" },
        videoRefs,
        0.8,
        setVideoSource,
      )

      expect(video1.volume).toBe(0.3)
      expect(video2.volume).toBe(0.8)
    })
  })

  describe("updateVideoSrc", () => {
    it("должен обновлять src если он не соответствует video id", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)
      const loadSpy = vi.spyOn(videoElement, "load")

      // Меняем src на другой
      videoElement.src = "/different/path.mp4"

      result.current.updateVideoSrc(videoElement, mockMediaFile)

      expect(videoElement.src).toContain(mockMediaFile.path)
      expect(loadSpy).toHaveBeenCalled()
    })

    it("не должен обновлять src если он уже правильный", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)
      const loadSpy = vi.spyOn(videoElement, "load")
      const currentSrc = videoElement.src

      result.current.updateVideoSrc(videoElement, mockMediaFile)

      expect(videoElement.src).toBe(currentSrc)
      expect(loadSpy).not.toHaveBeenCalled()
    })

    it("не должен обновлять если path пустой", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)
      const loadSpy = vi.spyOn(videoElement, "load")
      const emptyPathVideo = { ...mockMediaFile, path: "" }

      result.current.updateVideoSrc(videoElement, emptyPathVideo)

      expect(loadSpy).not.toHaveBeenCalled()
    })
  })

  describe("destroyVideoElement", () => {
    it("должен останавливать воспроизведение", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)
      const pauseSpy = vi.spyOn(videoElement, "pause")

      result.current.destroyVideoElement(videoElement)

      expect(pauseSpy).toHaveBeenCalled()
    })

    it("должен очищать src", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      result.current.destroyVideoElement(videoElement)

      expect(videoElement.src).toBe("")
    })

    it("должен вызывать load() для освобождения медиа буфера", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)
      const loadSpy = vi.spyOn(videoElement, "load")

      result.current.destroyVideoElement(videoElement)

      expect(loadSpy).toHaveBeenCalled()
    })

    it("должен удалять элемент из DOM", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      expect(document.body.contains(videoElement)).toBe(true)

      result.current.destroyVideoElement(videoElement)

      expect(document.body.contains(videoElement)).toBe(false)
    })

    it("должен удалять из глобального реестра", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      expect(result.current.allVideoElementsRef.current.size).toBe(1)

      result.current.destroyVideoElement(videoElement)

      expect(result.current.allVideoElementsRef.current.size).toBe(0)
    })

    it("не должен выбрасывать ошибку при уничтожении уже удаленного элемента", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)
      videoElement.remove()

      expect(() => {
        result.current.destroyVideoElement(videoElement)
      }).not.toThrow()
    })
  })

  describe("cleanupUnusedVideoElements", () => {
    it("должен удалять неактивные video элементы", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      result.current.getOrCreateVideoElement({ ...mockMediaFile, id: "video-1" }, videoRefs, 0.5, setVideoSource)
      result.current.getOrCreateVideoElement({ ...mockMediaFile, id: "video-2" }, videoRefs, 0.5, setVideoSource)
      result.current.getOrCreateVideoElement({ ...mockMediaFile, id: "video-3" }, videoRefs, 0.5, setVideoSource)

      expect(result.current.allVideoElementsRef.current.size).toBe(3)

      result.current.cleanupUnusedVideoElements(["video-1"], videoRefs)

      expect(result.current.allVideoElementsRef.current.size).toBe(1)
      expect(videoRefs["video-1"]).toBeDefined()
      expect(videoRefs["video-2"]).toBeUndefined()
      expect(videoRefs["video-3"]).toBeUndefined()
    })

    it("должен сохранять все активные video элементы", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      result.current.getOrCreateVideoElement({ ...mockMediaFile, id: "video-1" }, videoRefs, 0.5, setVideoSource)
      result.current.getOrCreateVideoElement({ ...mockMediaFile, id: "video-2" }, videoRefs, 0.5, setVideoSource)

      result.current.cleanupUnusedVideoElements(["video-1", "video-2"], videoRefs)

      expect(result.current.allVideoElementsRef.current.size).toBe(2)
      expect(videoRefs["video-1"]).toBeDefined()
      expect(videoRefs["video-2"]).toBeDefined()
    })

    it("должен удалять все элементы если список активных пуст", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      result.current.getOrCreateVideoElement({ ...mockMediaFile, id: "video-1" }, videoRefs, 0.5, setVideoSource)
      result.current.getOrCreateVideoElement({ ...mockMediaFile, id: "video-2" }, videoRefs, 0.5, setVideoSource)

      result.current.cleanupUnusedVideoElements([], videoRefs)

      expect(result.current.allVideoElementsRef.current.size).toBe(0)
      expect(Object.keys(videoRefs).length).toBe(0)
    })

    it("не должен падать если videoRefs пуст", () => {
      const { result } = renderHook(() => useVideoElement())

      expect(() => {
        result.current.cleanupUnusedVideoElements([], {})
      }).not.toThrow()
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать video элементы с специальными символами в id", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()
      const specialIdVideo = { ...mockMediaFile, id: "video-with-special-chars_123-456" }

      const videoElement = result.current.getOrCreateVideoElement(specialIdVideo, videoRefs, 0.5, setVideoSource)

      expect(videoElement.dataset.videoId).toBe(specialIdVideo.id)
      expect(videoRefs[specialIdVideo.id]).toBe(videoElement)
    })

    it("должен обрабатывать громкость 0", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0, setVideoSource)

      expect(videoElement.volume).toBe(0)
    })

    it("должен обрабатывать громкость 1", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 1, setVideoSource)

      expect(videoElement.volume).toBe(1)
    })

    it("должен обрабатывать очень длинные пути к файлам", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()
      const longPathVideo = {
        ...mockMediaFile,
        path: "/very/long/path/to/video/file/that/might/cause/issues/test-video.mp4",
      }

      const videoElement = result.current.getOrCreateVideoElement(longPathVideo, videoRefs, 0.5, setVideoSource)

      expect(videoElement.src).toContain(longPathVideo.path)
    })

    it("должен корректно работать при быстром создании и удалении множества элементов", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      for (let i = 0; i < 50; i++) {
        const video = result.current.getOrCreateVideoElement(
          { ...mockMediaFile, id: `video-${i}` },
          videoRefs,
          0.5,
          setVideoSource,
        )
        if (i % 2 === 0) {
          result.current.destroyVideoElement(video)
          delete videoRefs[`video-${i}`]
        }
      }

      // Должно остаться 25 элементов (нечетные индексы)
      expect(result.current.allVideoElementsRef.current.size).toBe(25)
    })
  })

  describe("производительность", () => {
    it("должен эффективно переиспользовать элементы", () => {
      const { result } = renderHook(() => useVideoElement())
      const setVideoSource = vi.fn()

      const videoElement1 = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

      // Вызываем многократно
      for (let i = 0; i < 100; i++) {
        const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)
        expect(videoElement).toBe(videoElement1)
      }

      // Должен быть только один элемент
      expect(result.current.allVideoElementsRef.current.size).toBe(1)
      expect(document.querySelectorAll("video").length).toBe(1)
    })
  })
})
