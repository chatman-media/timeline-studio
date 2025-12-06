/**
 * @vitest-environment jsdom
 *
 * Тесты для утилит Timeline
 */

import { describe, expect, it } from "vitest"
import type { MediaFile } from "@/domains/media-management"
import { MediaType } from "@/domains/media-management"

import type { TimelineClip, TimelineProject, TimelineSection, TimelineTrack } from "../../types"
import {
  calculateProjectDuration,
  canPlaceClipOnTrack,
  findClipById,
  findNearestClip,
  findSectionAtTime,
  findTrackById,
  getAllClips,
  getAllTracks,
  getClipsInTimeRange,
  getSelectedClips,
  getTracksByType,
  isMediaCompatibleWithTrack,
  secondsToTimecode,
  selectClipsInArea,
  snapToClip,
  snapToGrid,
  sortClipsByTime,
  sortTracksByOrder,
  timecodeToSeconds,
  validateProject,
} from "../../utils/utils"

describe("Timeline утилиты", () => {
  const createMockProject = (overrides = {}): TimelineProject =>
    ({
      id: "project-1",
      name: "Test Project",
      duration: 0,
      fps: 30,
      sampleRate: 48000,
      sections: [],
      globalTracks: [],
      resources: {
        effects: [],
        filters: [],
        transitions: [],
        timelineTransitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
      },
      settings: {
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        aspectRatio: "16:9",
        sampleRate: 48000,
        channels: 2,
        bitDepth: 16,
        timeFormat: "timecode" as const,
        snapToGrid: true,
        gridSize: 1,
        autoSave: true,
        autoSaveInterval: 60,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
      ...overrides,
    }) as TimelineProject

  const createMockSection = (overrides = {}): TimelineSection => ({
    id: "section-1",
    index: 0,
    name: "Section 1",
    startTime: 0,
    duration: 10,
    endTime: 10,
    tracks: [],
    isCollapsed: false,
    ...overrides,
  })

  const createMockTrack = (overrides = {}): TimelineTrack => ({
    id: "track-1",
    type: "video" as const,
    name: "Track 1",
    order: 0,
    clips: [],
    transitions: [],
    muted: false,
    solo: false,
    locked: false,
    isLocked: false,
    isMuted: false,
    isHidden: false,
    isSolo: false,
    expanded: true,
    volume: 1,
    pan: 0,
    height: 100,
    trackEffects: [],
    trackFilters: [],
    ...overrides,
  })

  const createMockClip = (overrides = {}): TimelineClip => ({
    id: "clip-1",
    name: "Clip 1",
    mediaId: "media-1",
    trackId: "track-1",
    startTime: 0,
    duration: 5,
    sourceIn: 0,
    sourceOut: 5,
    mediaStartTime: 0,
    mediaEndTime: 5,
    offset: 0,
    volume: 1,
    playbackRate: 1,
    speed: 1,
    isReversed: false,
    isMuted: false,
    opacity: 1,
    position: {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    effects: [],
    filters: [],
    transitions: [],
    isSelected: false,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })

  const createMockMediaFile = (overrides = {}): MediaFile => ({
    id: "media-1",
    name: "test.mp4",
    path: "/path/to/test.mp4",
    type: MediaType.Unknown,
    duration: 10,
    ...overrides,
  })

  describe("Project утилиты", () => {
    describe("calculateProjectDuration", () => {
      it("возвращает 0 для проекта без секций", () => {
        const project = createMockProject()
        expect(calculateProjectDuration(project)).toBe(0)
      })

      it("возвращает время окончания последней секции", () => {
        const project = createMockProject({
          sections: [
            createMockSection({ startTime: 0, endTime: 10 }),
            createMockSection({ startTime: 10, endTime: 25 }),
            createMockSection({ startTime: 25, endTime: 30 }),
          ],
        })
        expect(calculateProjectDuration(project)).toBe(30)
      })

      it("корректно работает с несортированными секциями", () => {
        const project = createMockProject({
          sections: [
            createMockSection({ startTime: 20, endTime: 30 }),
            createMockSection({ startTime: 0, endTime: 10 }),
            createMockSection({ startTime: 10, endTime: 20 }),
          ],
        })
        expect(calculateProjectDuration(project)).toBe(30)
      })
    })

    describe("getAllTracks", () => {
      it("возвращает только глобальные треки, если нет секций", () => {
        const globalTrack = createMockTrack({ id: "global-1" })
        const project = createMockProject({
          globalTracks: [globalTrack],
        })
        expect(getAllTracks(project)).toEqual([globalTrack])
      })

      it("объединяет треки из секций и глобальные треки", () => {
        const globalTrack = createMockTrack({ id: "global-1" })
        const sectionTrack1 = createMockTrack({ id: "section-1" })
        const sectionTrack2 = createMockTrack({ id: "section-2" })

        const project = createMockProject({
          globalTracks: [globalTrack],
          sections: [createMockSection({ tracks: [sectionTrack1] }), createMockSection({ tracks: [sectionTrack2] })],
        })

        const tracks = getAllTracks(project)
        expect(tracks).toHaveLength(3)
        expect(tracks.map((t) => t.id)).toEqual(["global-1", "section-1", "section-2"])
      })
    })

    describe("getAllClips", () => {
      it("возвращает все клипы из всех треков", () => {
        const clip1 = createMockClip({ id: "clip-1" })
        const clip2 = createMockClip({ id: "clip-2" })
        const clip3 = createMockClip({ id: "clip-3" })

        const project = createMockProject({
          globalTracks: [createMockTrack({ clips: [clip1] })],
          sections: [
            createMockSection({
              tracks: [createMockTrack({ clips: [clip2, clip3] })],
            }),
          ],
        })

        const clips = getAllClips(project)
        expect(clips).toHaveLength(3)
        expect(clips.map((c) => c.id)).toEqual(["clip-1", "clip-2", "clip-3"])
      })
    })

    describe("findSectionAtTime", () => {
      it("находит секцию по времени", () => {
        const section1 = createMockSection({ startTime: 0, endTime: 10 })
        const section2 = createMockSection({ startTime: 10, endTime: 20 })
        const section3 = createMockSection({ startTime: 20, endTime: 30 })

        const project = createMockProject({
          sections: [section1, section2, section3],
        })

        expect(findSectionAtTime(project, 5)).toBe(section1)
        expect(findSectionAtTime(project, 15)).toBe(section2)
        expect(findSectionAtTime(project, 25)).toBe(section3)
      })

      it("возвращает null если время вне секций", () => {
        const project = createMockProject({
          sections: [createMockSection({ startTime: 10, endTime: 20 })],
        })

        expect(findSectionAtTime(project, 5)).toBeNull()
        expect(findSectionAtTime(project, 25)).toBeNull()
      })

      it("включает границы секции", () => {
        const section = createMockSection({ startTime: 10, endTime: 20 })
        const project = createMockProject({ sections: [section] })

        expect(findSectionAtTime(project, 10)).toBe(section)
        expect(findSectionAtTime(project, 20)).toBe(section)
      })
    })
  })

  describe("Track утилиты", () => {
    describe("getTracksByType", () => {
      it("фильтрует треки по типу", () => {
        const videoTrack = createMockTrack({ type: "video" })
        const audioTrack1 = createMockTrack({ type: "audio" })
        const audioTrack2 = createMockTrack({ type: "audio" })

        const project = createMockProject({
          globalTracks: [videoTrack, audioTrack1, audioTrack2],
        })

        expect(getTracksByType(project, "video")).toEqual([videoTrack])
        expect(getTracksByType(project, "audio")).toEqual([audioTrack1, audioTrack2])
        expect(getTracksByType(project, "image")).toEqual([])
      })
    })

    describe("sortTracksByOrder", () => {
      it("сортирует треки по порядку", () => {
        const tracks = [
          createMockTrack({ id: "3", order: 2 }),
          createMockTrack({ id: "1", order: 0 }),
          createMockTrack({ id: "2", order: 1 }),
        ]

        const sorted = sortTracksByOrder(tracks)
        expect(sorted.map((t) => t.id)).toEqual(["1", "2", "3"])
      })

      it("не изменяет исходный массив", () => {
        const tracks = [createMockTrack({ id: "2", order: 1 }), createMockTrack({ id: "1", order: 0 })]
        const original = [...tracks]

        sortTracksByOrder(tracks)
        expect(tracks).toEqual(original)
      })
    })

    describe("findTrackById", () => {
      it("находит трек по ID", () => {
        const track = createMockTrack({ id: "target-track" })
        const project = createMockProject({
          globalTracks: [createMockTrack(), track, createMockTrack()],
        })

        expect(findTrackById(project, "target-track")).toBe(track)
      })

      it("возвращает null если трек не найден", () => {
        const project = createMockProject({
          globalTracks: [createMockTrack()],
        })

        expect(findTrackById(project, "non-existent")).toBeNull()
      })
    })

    describe("canPlaceClipOnTrack", () => {
      it("разрешает размещение если трек пустой", () => {
        const track = createMockTrack()
        expect(canPlaceClipOnTrack(track, 0, 10)).toBe(true)
      })

      it("разрешает размещение если нет пересечений", () => {
        const track = createMockTrack({
          clips: [createMockClip({ startTime: 0, duration: 5 }), createMockClip({ startTime: 10, duration: 5 })],
        })

        expect(canPlaceClipOnTrack(track, 5, 5)).toBe(true) // между клипами
        expect(canPlaceClipOnTrack(track, 15, 10)).toBe(true) // после последнего
      })

      it("запрещает размещение при пересечении", () => {
        const track = createMockTrack({
          clips: [createMockClip({ startTime: 5, duration: 10 })],
        })

        expect(canPlaceClipOnTrack(track, 0, 10)).toBe(false) // пересечение в начале
        expect(canPlaceClipOnTrack(track, 10, 10)).toBe(false) // пересечение в конце
        expect(canPlaceClipOnTrack(track, 7, 5)).toBe(false) // полностью внутри
        expect(canPlaceClipOnTrack(track, 0, 20)).toBe(false) // полностью покрывает
      })

      it("разрешает касание границ клипов", () => {
        const track = createMockTrack({
          clips: [createMockClip({ startTime: 5, duration: 5 })],
        })

        expect(canPlaceClipOnTrack(track, 0, 5)).toBe(true) // касается начала
        expect(canPlaceClipOnTrack(track, 10, 5)).toBe(true) // касается конца
      })

      it("исключает указанный клип из проверки", () => {
        const track = createMockTrack({
          clips: [
            createMockClip({ id: "clip-1", startTime: 0, duration: 10 }),
            createMockClip({ id: "clip-2", startTime: 15, duration: 10 }),
          ],
        })

        // Можно разместить на месте исключенного клипа
        expect(canPlaceClipOnTrack(track, 0, 10, "clip-1")).toBe(true)
        // Но нельзя если пересекается с другим
        expect(canPlaceClipOnTrack(track, 10, 10, "clip-1")).toBe(false)
      })
    })
  })

  describe("Clip утилиты", () => {
    describe("findClipById", () => {
      it("находит клип по ID", () => {
        const targetClip = createMockClip({ id: "target-clip" })
        const project = createMockProject({
          globalTracks: [
            createMockTrack({
              clips: [createMockClip(), targetClip, createMockClip()],
            }),
          ],
        })

        expect(findClipById(project, "target-clip")).toBe(targetClip)
      })

      it("возвращает null если клип не найден", () => {
        const project = createMockProject({
          globalTracks: [createMockTrack({ clips: [createMockClip()] })],
        })

        expect(findClipById(project, "non-existent")).toBeNull()
      })
    })

    describe("getClipsInTimeRange", () => {
      it("находит клипы в временном диапазоне", () => {
        const clip1 = createMockClip({ id: "1", startTime: 0, duration: 5 })
        const clip2 = createMockClip({ id: "2", startTime: 5, duration: 10 })
        const clip3 = createMockClip({ id: "3", startTime: 15, duration: 5 })
        const clip4 = createMockClip({ id: "4", startTime: 20, duration: 5 })

        const project = createMockProject({
          globalTracks: [createMockTrack({ clips: [clip1, clip2, clip3, clip4] })],
        })

        // Диапазон 7-18 должен захватить clip2 и clip3
        const clips = getClipsInTimeRange(project, 7, 18)
        expect(clips.map((c) => c.id)).toEqual(["2", "3"])
      })

      it("включает клипы частично попадающие в диапазон", () => {
        const clip = createMockClip({ startTime: 5, duration: 10 })
        const project = createMockProject({
          globalTracks: [createMockTrack({ clips: [clip] })],
        })

        expect(getClipsInTimeRange(project, 0, 7)).toContain(clip) // пересекает начало
        expect(getClipsInTimeRange(project, 13, 20)).toContain(clip) // пересекает конец
        expect(getClipsInTimeRange(project, 7, 13)).toContain(clip) // внутри клипа
        expect(getClipsInTimeRange(project, 0, 20)).toContain(clip) // покрывает клип
      })

      it("исключает клипы касающиеся границ", () => {
        const clip = createMockClip({ startTime: 5, duration: 5 })
        const project = createMockProject({
          globalTracks: [createMockTrack({ clips: [clip] })],
        })

        expect(getClipsInTimeRange(project, 0, 5)).not.toContain(clip)
        expect(getClipsInTimeRange(project, 10, 15)).not.toContain(clip)
      })
    })

    describe("sortClipsByTime", () => {
      it("сортирует клипы по времени начала", () => {
        const clips = [
          createMockClip({ id: "3", startTime: 20 }),
          createMockClip({ id: "1", startTime: 0 }),
          createMockClip({ id: "2", startTime: 10 }),
        ]

        const sorted = sortClipsByTime(clips)
        expect(sorted.map((c) => c.id)).toEqual(["1", "2", "3"])
      })
    })

    describe("findNearestClip", () => {
      it("находит ближайший клип к времени", () => {
        const clip1 = createMockClip({ id: "1", startTime: 0, duration: 4 }) // центр в 2
        const clip2 = createMockClip({ id: "2", startTime: 10, duration: 4 }) // центр в 12
        const clip3 = createMockClip({ id: "3", startTime: 20, duration: 4 }) // центр в 22

        const project = createMockProject({
          globalTracks: [createMockTrack({ clips: [clip1, clip2, clip3] })],
        })

        expect(findNearestClip(project, 3)?.id).toBe("1") // ближе к clip1
        expect(findNearestClip(project, 8)?.id).toBe("2") // ближе к clip2
        expect(findNearestClip(project, 18)?.id).toBe("3") // ближе к clip3
      })

      it("фильтрует по типу трека", () => {
        const videoClip = createMockClip({ id: "video", startTime: 5, duration: 2 })
        const audioClip = createMockClip({ id: "audio", startTime: 4, duration: 2 })

        const project = createMockProject({
          globalTracks: [
            createMockTrack({ type: "video", clips: [videoClip] }),
            createMockTrack({ type: "audio", clips: [audioClip] }),
          ],
        })

        // audioClip ближе, но запрашиваем video
        expect(findNearestClip(project, 5, "video")?.id).toBe("video")
      })

      it("возвращает null для пустого проекта", () => {
        const project = createMockProject()
        expect(findNearestClip(project, 10)).toBeNull()
      })
    })
  })

  describe("Time утилиты", () => {
    describe("secondsToTimecode", () => {
      it("конвертирует секунды в тайм-код", () => {
        expect(secondsToTimecode(0)).toBe("00:00:00:00")
        expect(secondsToTimecode(1)).toBe("00:00:01:00")
        expect(secondsToTimecode(61)).toBe("00:01:01:00")
        expect(secondsToTimecode(3661)).toBe("01:01:01:00")
      })

      it("обрабатывает дробные секунды как кадры", () => {
        expect(secondsToTimecode(1.5, 30)).toBe("00:00:01:15") // 0.5 сек = 15 кадров при 30fps
        expect(secondsToTimecode(1.5, 60)).toBe("00:00:01:30") // 0.5 сек = 30 кадров при 60fps
      })

      it("корректно работает с разными fps", () => {
        expect(secondsToTimecode(1 + 1 / 24, 24)).toBe("00:00:01:01")
        expect(secondsToTimecode(1 + 1 / 25, 25)).toBe("00:00:01:01")
        expect(secondsToTimecode(1 + 1 / 30, 30)).toBe("00:00:01:01")
      })
    })

    describe("timecodeToSeconds", () => {
      it("конвертирует тайм-код в секунды", () => {
        expect(timecodeToSeconds("00:00:00:00")).toBe(0)
        expect(timecodeToSeconds("00:00:01:00")).toBe(1)
        expect(timecodeToSeconds("00:01:00:00")).toBe(60)
        expect(timecodeToSeconds("01:00:00:00")).toBe(3600)
      })

      it("учитывает кадры", () => {
        expect(timecodeToSeconds("00:00:00:15", 30)).toBe(0.5)
        expect(timecodeToSeconds("00:00:00:30", 60)).toBe(0.5)
      })

      it("выбрасывает ошибку для неверного формата", () => {
        expect(() => timecodeToSeconds("00:00:00")).toThrow("Invalid timecode format")
        expect(() => timecodeToSeconds("00:00")).toThrow("Invalid timecode format")
        expect(() => timecodeToSeconds("invalid")).toThrow("Invalid timecode format")
      })

      it("обратная операция с secondsToTimecode", () => {
        const testValues = [0, 1, 59, 60, 3599, 3600, 3661.5]
        testValues.forEach((seconds) => {
          const timecode = secondsToTimecode(seconds, 30)
          const backToSeconds = timecodeToSeconds(timecode, 30)
          expect(backToSeconds).toBeCloseTo(seconds, 2)
        })
      })
    })

    describe("snapToGrid", () => {
      it("привязывает время к сетке", () => {
        expect(snapToGrid(0.4, 1)).toBe(0)
        expect(snapToGrid(0.6, 1)).toBe(1)
        expect(snapToGrid(1.4, 1)).toBe(1)
        expect(snapToGrid(1.6, 1)).toBe(2)
      })

      it("работает с разными размерами сетки", () => {
        expect(snapToGrid(2.3, 0.5)).toBe(2.5)
        expect(snapToGrid(2.2, 0.5)).toBe(2.0)
        expect(snapToGrid(5.8, 2)).toBe(6)
        expect(snapToGrid(5.2, 2)).toBe(6) // 5.2/2 = 2.6, округляется до 3, 3*2 = 6
      })

      it("обрабатывает отрицательные значения", () => {
        expect(snapToGrid(-0.4, 1)).toBe(-0)
        expect(snapToGrid(-0.6, 1)).toBe(-1)
        expect(snapToGrid(-1.6, 1)).toBe(-2)
      })
    })

    describe("snapToClip", () => {
      it("привязывает к началу или концу ближайшего клипа", () => {
        const project = createMockProject({
          globalTracks: [
            createMockTrack({
              clips: [
                createMockClip({ startTime: 5, duration: 5 }), // конец в 10
                createMockClip({ startTime: 15, duration: 5 }), // конец в 20
              ],
            }),
          ],
        })

        expect(snapToClip(4.95, project)).toBe(5) // привязка к началу первого
        expect(snapToClip(10.05, project)).toBe(10) // привязка к концу первого
        expect(snapToClip(14.9, project)).toBe(15) // привязка к началу второго
      })

      it("не привязывает если расстояние больше snapDistance", () => {
        const project = createMockProject({
          globalTracks: [createMockTrack({ clips: [createMockClip({ startTime: 10, duration: 5 })] })],
        })

        expect(snapToClip(9.8, project, 0.1)).toBe(9.8) // слишком далеко
        expect(snapToClip(9.95, project, 0.1)).toBe(10) // достаточно близко
      })

      it("привязывает к ближайшей точке если несколько в пределах snapDistance", () => {
        const project = createMockProject({
          globalTracks: [
            createMockTrack({
              clips: [
                createMockClip({ startTime: 10, duration: 1 }), // конец в 11
                createMockClip({ startTime: 11.05, duration: 1 }),
              ],
            }),
          ],
        })

        expect(snapToClip(11.02, project, 0.1)).toBe(11) // ближе к концу первого
        expect(snapToClip(11.03, project, 0.1)).toBe(11.05) // ближе к началу второго
      })
    })
  })

  describe("Selection утилиты", () => {
    describe("getSelectedClips", () => {
      it("возвращает только выделенные клипы", () => {
        const selected1 = createMockClip({ id: "1", isSelected: true })
        const notSelected = createMockClip({ id: "2", isSelected: false })
        const selected2 = createMockClip({ id: "3", isSelected: true })

        const project = createMockProject({
          globalTracks: [createMockTrack({ clips: [selected1, notSelected, selected2] })],
        })

        const selectedClips = getSelectedClips(project)
        expect(selectedClips).toHaveLength(2)
        expect(selectedClips.map((c) => c.id)).toEqual(["1", "3"])
      })

      it("возвращает пустой массив если нет выделенных", () => {
        const project = createMockProject({
          globalTracks: [createMockTrack({ clips: [createMockClip()] })],
        })

        expect(getSelectedClips(project)).toEqual([])
      })
    })

    describe("selectClipsInArea", () => {
      it("выбирает клипы в указанной области", () => {
        const track1 = createMockTrack({
          id: "track-1",
          clips: [
            createMockClip({ id: "1", startTime: 0, duration: 5 }),
            createMockClip({ id: "2", startTime: 10, duration: 5 }),
          ],
        })

        const track2 = createMockTrack({
          id: "track-2",
          clips: [
            createMockClip({ id: "3", startTime: 3, duration: 4 }),
            createMockClip({ id: "4", startTime: 12, duration: 3 }),
          ],
        })

        const project = createMockProject({
          globalTracks: [track1, track2],
        })

        // Выбираем область 2-12 на обоих треках
        const selected = selectClipsInArea(project, 2, 12, ["track-1", "track-2"])
        expect(selected.map((c) => c.id).sort()).toEqual(["1", "2", "3"])
      })

      it("фильтрует по указанным трекам", () => {
        const track1 = createMockTrack({
          id: "track-1",
          clips: [createMockClip({ id: "1", startTime: 5, duration: 5 })],
        })

        const track2 = createMockTrack({
          id: "track-2",
          clips: [createMockClip({ id: "2", startTime: 5, duration: 5 })],
        })

        const project = createMockProject({
          globalTracks: [track1, track2],
        })

        const selected = selectClipsInArea(project, 0, 15, ["track-1"])
        expect(selected.map((c) => c.id)).toEqual(["1"])
      })

      it("игнорирует несуществующие треки", () => {
        const track = createMockTrack({
          id: "track-1",
          clips: [createMockClip()],
        })

        const project = createMockProject({
          globalTracks: [track],
        })

        const selected = selectClipsInArea(project, 0, 100, ["track-1", "non-existent"])
        expect(selected).toHaveLength(1)
      })
    })
  })

  describe("Validation утилиты", () => {
    describe("validateProject", () => {
      it("возвращает пустой массив для валидного проекта", () => {
        const project = createMockProject({
          sections: [createMockSection({ startTime: 0, duration: 10, endTime: 10 })],
          globalTracks: [
            createMockTrack({
              clips: [createMockClip({ startTime: 0, duration: 5 })],
            }),
          ],
        })

        expect(validateProject(project)).toEqual([])
      })

      it("проверяет отрицательное время начала секции", () => {
        const project = createMockProject({
          sections: [createMockSection({ name: "Bad Section", startTime: -1, duration: 10 })],
        })

        const errors = validateProject(project)
        expect(errors).toContain("Section Bad Section: start time cannot be negative")
      })

      it("проверяет неположительную длительность секции", () => {
        const project = createMockProject({
          sections: [
            createMockSection({ name: "Zero Duration", duration: 0 }),
            createMockSection({ name: "Negative Duration", duration: -5 }),
          ],
        })

        const errors = validateProject(project)
        expect(errors).toContain("Section Zero Duration: duration must be positive")
        expect(errors).toContain("Section Negative Duration: duration must be positive")
      })

      it("проверяет соответствие endTime", () => {
        const project = createMockProject({
          sections: [
            createMockSection({
              name: "Mismatch",
              startTime: 10,
              duration: 20,
              endTime: 25, // должно быть 30
            }),
          ],
        })

        const errors = validateProject(project)
        expect(errors).toContain("Section Mismatch: end time mismatch")
      })

      it("проверяет клипы", () => {
        const project = createMockProject({
          globalTracks: [
            createMockTrack({
              clips: [
                createMockClip({ name: "Negative Start", startTime: -1 }),
                createMockClip({ name: "Zero Duration", duration: 0 }),
                createMockClip({ name: "Negative Media", mediaStartTime: -5 }),
              ],
            }),
          ],
        })

        const errors = validateProject(project)
        expect(errors).toContain("Clip Negative Start: start time cannot be negative")
        expect(errors).toContain("Clip Zero Duration: duration must be positive")
        expect(errors).toContain("Clip Negative Media: media start time cannot be negative")
      })
    })

    describe("isMediaCompatibleWithTrack", () => {
      it("проверяет совместимость видео", () => {
        const videoFile = createMockMediaFile({ type: MediaType.Video, isVideo: true })
        const videoTrack = createMockTrack({ type: "video" })
        const audioTrack = createMockTrack({ type: "audio" })

        expect(isMediaCompatibleWithTrack(videoFile, videoTrack)).toBe(true)
        expect(isMediaCompatibleWithTrack(videoFile, audioTrack)).toBe(false)
      })

      it("проверяет совместимость аудио", () => {
        const audioFile = createMockMediaFile({ type: MediaType.Audio, isAudio: true })
        const audioTrack = createMockTrack({ type: "audio" })
        const musicTrack = createMockTrack({ type: "music" })
        const voiceoverTrack = createMockTrack({ type: "voiceover" })
        const sfxTrack = createMockTrack({ type: "sfx" })
        const ambientTrack = createMockTrack({ type: "ambient" })
        const videoTrack = createMockTrack({ type: "video" })

        expect(isMediaCompatibleWithTrack(audioFile, audioTrack)).toBe(true)
        expect(isMediaCompatibleWithTrack(audioFile, musicTrack)).toBe(true)
        expect(isMediaCompatibleWithTrack(audioFile, voiceoverTrack)).toBe(true)
        expect(isMediaCompatibleWithTrack(audioFile, sfxTrack)).toBe(true)
        expect(isMediaCompatibleWithTrack(audioFile, ambientTrack)).toBe(true)
        expect(isMediaCompatibleWithTrack(audioFile, videoTrack)).toBe(false)
      })

      it("проверяет совместимость изображений", () => {
        const imageFile = createMockMediaFile({ type: MediaType.StillImage, isImage: true })
        const imageTrack = createMockTrack({ type: "image" })
        const videoTrack = createMockTrack({ type: "video" })
        const audioTrack = createMockTrack({ type: "audio" })

        expect(isMediaCompatibleWithTrack(imageFile, imageTrack)).toBe(true)
        expect(isMediaCompatibleWithTrack(imageFile, videoTrack)).toBe(false)
        expect(isMediaCompatibleWithTrack(imageFile, audioTrack)).toBe(false)
      })

      it("обрабатывает неизвестные типы треков", () => {
        const videoFile = createMockMediaFile({ type: MediaType.Video, isVideo: true })
        const unknownTrack = createMockTrack({ type: "unknown" as any })

        expect(isMediaCompatibleWithTrack(videoFile, unknownTrack)).toBe(false)
      })

      it("обрабатывает файлы без типа", () => {
        const unknownFile = createMockMediaFile({ type: MediaType.Unknown })
        const videoTrack = createMockTrack({ type: "video" })

        expect(isMediaCompatibleWithTrack(unknownFile, videoTrack)).toBe(false)
      })
    })
  })
})
