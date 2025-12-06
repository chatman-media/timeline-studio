import { describe, expect, it } from "vitest"

import type { MediaFile } from "@/domains/media-management"
import { MediaType } from "@/domains/media-management"

import {
  doTimeRangesOverlap,
  getFileType,
  getRemainingMediaCounts,
  hasAudioStream,
  isHorizontalVideo,
} from "../../utils"

describe("hasAudioStream", () => {
  it("должен вернуть true, если файл содержит аудиопоток", () => {
    const file: MediaFile = {
      id: "test-1",
      name: "test.mp4",
      path: "test.mp4",
      type: MediaType.Video,
      probeData: {
        streams: [{ codec_type: "video" }, { codec_type: "audio" }],
        format: {},
      },
    }
    expect(hasAudioStream(file)).toBe(true)
  })

  it("должен вернуть false, если файл не содержит аудиопоток", () => {
    const file: MediaFile = {
      id: "test-2",
      name: "test.mp4",
      path: "test.mp4",
      type: MediaType.Video,
      probeData: {
        streams: [{ codec_type: "video" }],
        format: {},
      },
    }
    expect(hasAudioStream(file)).toBe(false)
  })

  it("должен вернуть false, если probeData отсутствует", () => {
    const file: MediaFile = {
      id: "test-3",
      name: "test.mp4",
      path: "test.mp4",
      type: MediaType.Video,
    }
    expect(hasAudioStream(file)).toBe(false)
  })
})

describe("getFileType", () => {
  it("должен вернуть 'image', если файл является изображением", () => {
    const file: MediaFile = {
      id: "test-4",
      name: "test.jpg",
      path: "test.jpg",
      type: MediaType.StillImage,
      isImage: true,
    }
    expect(getFileType(file)).toBe("image")
  })

  it("должен вернуть 'video', если файл содержит видеопоток", () => {
    const file: MediaFile = {
      id: "test-5",
      name: "test.mp4",
      path: "test.mp4",
      type: MediaType.Video,
      probeData: {
        streams: [{ codec_type: "video" }],
        format: {},
      },
    }
    expect(getFileType(file)).toBe("video")
  })

  it("должен вернуть 'audio', если файл не содержит видеопоток и не является изображением", () => {
    const file: MediaFile = {
      id: "test-6",
      name: "test.mp3",
      path: "test.mp3",
      type: MediaType.Audio,
      probeData: {
        streams: [{ codec_type: "audio" }],
        format: {},
      },
    }
    expect(getFileType(file)).toBe("audio")
  })
})

describe("getRemainingMediaCounts", () => {
  it("должен правильно подсчитывать оставшиеся видео и аудио файлы", () => {
    const mediaFiles: MediaFile[] = [
      {
        id: "video1",
        name: "video1.mp4",
        path: "video1.mp4",
        type: MediaType.Video,
        probeData: {
          streams: [{ codec_type: "video" }, { codec_type: "audio" }],
          format: {},
        },
      },
      {
        id: "audio1",
        name: "audio1.mp3",
        path: "audio1.mp3",
        type: MediaType.Audio,
        probeData: {
          streams: [{ codec_type: "audio" }],
          format: {},
        },
      },
      {
        id: "video2",
        name: "video2.mp4",
        path: "video2.mp4",
        type: MediaType.Video,
        probeData: {
          streams: [{ codec_type: "video" }, { codec_type: "audio" }],
          format: {},
        },
      },
    ]

    const addedFiles = new Set(["video1.mp4"])

    const result = getRemainingMediaCounts(mediaFiles, addedFiles)

    expect(result.remainingVideoCount).toBe(1) // video2.mp4
    expect(result.remainingAudioCount).toBe(1) // audio1.mp3
    expect(result.allFilesAdded).toBe(false)
  })

  it("должен вернуть allFilesAdded=true, если все файлы с аудио добавлены", () => {
    const mediaFiles: MediaFile[] = [
      {
        id: "video1",
        name: "video1.mp4",
        path: "video1.mp4",
        type: MediaType.Video,
        probeData: {
          streams: [{ codec_type: "video" }, { codec_type: "audio" }],
          format: {},
        },
      },
      {
        id: "audio1",
        name: "audio1.mp3",
        path: "audio1.mp3",
        type: MediaType.Audio,
        probeData: {
          streams: [{ codec_type: "audio" }],
          format: {},
        },
      },
    ]

    const addedFiles = new Set(["video1.mp4", "audio1.mp3"])

    const result = getRemainingMediaCounts(mediaFiles, addedFiles)

    expect(result.remainingVideoCount).toBe(0)
    expect(result.remainingAudioCount).toBe(0)
    expect(result.allFilesAdded).toBe(true)
  })

  it("должен вернуть allFilesAdded=false, если массив медиафайлов пуст", () => {
    const result = getRemainingMediaCounts([], new Set())

    expect(result.remainingVideoCount).toBe(0)
    expect(result.remainingAudioCount).toBe(0)
    expect(result.allFilesAdded).toBe(false)
  })
})

describe("isHorizontalVideo", () => {
  it("должен вернуть true, если ширина больше высоты без поворота", () => {
    expect(isHorizontalVideo(1920, 1080)).toBe(true)
  })

  it("должен вернуть false, если ширина меньше высоты без поворота", () => {
    expect(isHorizontalVideo(1080, 1920)).toBe(false)
  })

  it("должен учитывать поворот на 90 градусов", () => {
    expect(isHorizontalVideo(1080, 1920, 90)).toBe(true)
  })

  it("должен учитывать поворот на -90 градусов", () => {
    expect(isHorizontalVideo(1080, 1920, -90)).toBe(true)
  })

  it("должен учитывать поворот на 270 градусов", () => {
    expect(isHorizontalVideo(1080, 1920, 270)).toBe(true)
  })
})

describe("doTimeRangesOverlap", () => {
  it("должен вернуть true, если временные интервалы пересекаются", () => {
    expect(doTimeRangesOverlap(10, 20, 15, 25)).toBe(true)
  })

  it("должен вернуть true, если один интервал полностью содержится в другом", () => {
    expect(doTimeRangesOverlap(10, 30, 15, 25)).toBe(true)
  })

  it("должен вернуть false, если интервалы не пересекаются", () => {
    expect(doTimeRangesOverlap(10, 20, 21, 30)).toBe(false)
  })

  it("должен вернуть false, если конец первого интервала совпадает с началом второго (с учетом зазора)", () => {
    expect(doTimeRangesOverlap(10, 20, 20, 30)).toBe(false)
  })

  it("должен вернуть false, если конец второго интервала совпадает с началом первого (с учетом зазора)", () => {
    expect(doTimeRangesOverlap(20, 30, 10, 20)).toBe(false)
  })
})
