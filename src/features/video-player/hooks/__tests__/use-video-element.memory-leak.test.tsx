/**
 * @vitest-environment jsdom
 */

import { renderHook } from "@testing-library/react"
import { type MediaFile, MediaType } from "@timeline-studio/domains/media-management"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useVideoElement } from "../use-video-element"

describe("useVideoElement - Memory Leak Prevention", () => {
  let mockMediaFile: MediaFile
  let videoRefs: Record<string, HTMLVideoElement>

  beforeEach(() => {
    mockMediaFile = {
      id: "test-video-1",
      name: "test-video.mp4",
      path: "/path/to/test-video.mp4",
      type: MediaType.Video,
      duration: 120,
      size: 1024 * 1024 * 100, // 100MB
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

    // Mock URL.revokeObjectURL
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
  })

  afterEach(() => {
    // Cleanup any remaining video elements
    document.querySelectorAll("video").forEach((el) => el.remove())
    vi.restoreAllMocks()
  })

  it("должен полностью очищать video element при удалении", () => {
    const { result } = renderHook(() => useVideoElement())

    const setVideoSource = vi.fn()

    // Создаем video element
    const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

    expect(document.body.contains(videoElement)).toBe(true)
    expect(videoElement.src).toContain(mockMediaFile.path)

    // Уничтожаем элемент
    result.current.destroyVideoElement(videoElement)

    // Проверяем, что элемент удален из DOM
    expect(document.body.contains(videoElement)).toBe(false)

    // Проверяем, что src был очищен
    expect(videoElement.src).toBe("")
  })

  it("должен вызывать URL.revokeObjectURL для blob URLs", () => {
    const { result } = renderHook(() => useVideoElement())

    const setVideoSource = vi.fn()

    // Создаем video element с blob URL
    const blobUrl = "blob:http://localhost:3000/test-blob-id"
    const mockMediaFileWithBlob = {
      ...mockMediaFile,
      path: blobUrl,
    }

    const videoElement = result.current.getOrCreateVideoElement(mockMediaFileWithBlob, videoRefs, 0.5, setVideoSource)

    // Уничтожаем элемент
    result.current.destroyVideoElement(videoElement)

    // Проверяем, что URL.revokeObjectURL был вызван
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(blobUrl)
  })

  it("должен автоматически очищать неиспользуемые video elements", () => {
    const { result } = renderHook(() => useVideoElement())

    const setVideoSource = vi.fn()

    // Создаем 3 video elements
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

    expect(result.current.allVideoElementsRef.current.size).toBe(3)
    expect(document.querySelectorAll("video").length).toBe(3)

    // Указываем, что активен только video-1
    result.current.cleanupUnusedVideoElements(["video-1"], videoRefs)

    // Проверяем, что video-2 и video-3 удалены
    expect(result.current.allVideoElementsRef.current.size).toBe(1)
    expect(document.querySelectorAll("video").length).toBe(1)

    // Проверяем, что video-1 все еще в DOM
    expect(document.body.contains(video1)).toBe(true)

    // Проверяем, что video-2 и video-3 удалены
    expect(document.body.contains(video2)).toBe(false)
    expect(document.body.contains(video3)).toBe(false)

    // Проверяем, что ссылки удалены из videoRefs
    expect(videoRefs["video-1"]).toBeDefined()
    expect(videoRefs["video-2"]).toBeUndefined()
    expect(videoRefs["video-3"]).toBeUndefined()
  })

  it("должен корректно обрабатывать ошибки при cleanup", () => {
    const { result } = renderHook(() => useVideoElement())

    const setVideoSource = vi.fn()

    // Создаем video element
    const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

    // Создаем ситуацию ошибки - удаляем элемент вручную
    videoElement.remove()

    // Попытка уничтожить уже удаленный элемент не должна вызвать ошибку
    expect(() => {
      result.current.destroyVideoElement(videoElement)
    }).not.toThrow()
  })

  it("должен останавливать воспроизведение перед удалением", () => {
    const { result } = renderHook(() => useVideoElement())

    const setVideoSource = vi.fn()

    // Создаем video element
    const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

    // Мокаем pause
    const pauseSpy = vi.spyOn(videoElement, "pause")

    // Симулируем воспроизведение
    Object.defineProperty(videoElement, "paused", {
      value: false,
      writable: true,
    })

    // Уничтожаем элемент
    result.current.destroyVideoElement(videoElement)

    // Проверяем, что pause был вызван
    expect(pauseSpy).toHaveBeenCalled()
  })

  it("должен вызывать load() после очистки src для освобождения медиа буфера", () => {
    const { result } = renderHook(() => useVideoElement())

    const setVideoSource = vi.fn()

    // Создаем video element
    const videoElement = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

    // Мокаем load
    const loadSpy = vi.spyOn(videoElement, "load")

    // Уничтожаем элемент
    result.current.destroyVideoElement(videoElement)

    // Проверяем, что load был вызван после очистки src
    expect(loadSpy).toHaveBeenCalled()
  })

  it("не должно быть утечки памяти при многократном создании и удалении", () => {
    const { result } = renderHook(() => useVideoElement())

    const setVideoSource = vi.fn()

    // Создаем и удаляем 100 video elements
    for (let i = 0; i < 100; i++) {
      const videoElement = result.current.getOrCreateVideoElement(
        { ...mockMediaFile, id: `video-${i}` },
        videoRefs,
        0.5,
        setVideoSource,
      )

      result.current.destroyVideoElement(videoElement)
      delete videoRefs[`video-${i}`]
    }

    // Проверяем, что в DOM нет video elements
    expect(document.querySelectorAll("video").length).toBe(0)

    // Проверяем, что реестр пуст
    expect(result.current.allVideoElementsRef.current.size).toBe(0)
  })

  it("должен переиспользовать существующие video elements", () => {
    const { result } = renderHook(() => useVideoElement())

    const setVideoSource = vi.fn()

    // Создаем video element
    const videoElement1 = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

    // Пытаемся создать еще раз с тем же ID
    const videoElement2 = result.current.getOrCreateVideoElement(mockMediaFile, videoRefs, 0.5, setVideoSource)

    // Должен быть тот же элемент
    expect(videoElement1).toBe(videoElement2)

    // Должен быть только один элемент в DOM
    expect(document.querySelectorAll("video").length).toBe(1)
  })
})
