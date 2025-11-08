import { describe, expect, it } from "vitest"

import type { TimelineClip, TimelineTrack } from "../../types"
import { DEFAULT_EDIT_CONSTRAINTS, type EditConstraints } from "../../types/edit-modes"
import {
  calculateRollDelta,
  clipsOverlap,
  findCollisions,
  findRippleAffectedClips,
  findSlideAdjacentClips,
  getClipsInRange,
  getClipTrimBounds,
  getSlideBounds,
  getSlipBounds,
  sortClipsByTime,
  validateEdit,
} from "../../utils/edit-operations"

// Test data
const createClip = (id: string, startTime: number, duration: number, offset = 0): TimelineClip =>
  ({
    id,
    trackId: "track-1",
    name: "Test Clip",
    mediaId: "media-1",
    startTime,
    duration,
    mediaStartTime: 0,
    mediaEndTime: duration,
    offset,
    volume: 1,
    speed: 1,
    isReversed: false,
    opacity: 1,
    effects: [],
    filters: [],
    transitions: [],
    isSelected: false,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as any

const createTrack = (clips: TimelineClip[]): TimelineTrack =>
  ({
    id: "track-1",
    name: "Track 1",
    type: "video",
    order: 0,
    clips,
    transitions: [],
    isLocked: false,
    isMuted: false,
    isHidden: false,
    isSolo: false,
    volume: 1,
    pan: 0,
    height: 100,
    trackEffects: [],
    trackFilters: [],
  }) as any

describe("clipsOverlap", () => {
  it("должен определять перекрывающиеся клипы", () => {
    const clip1 = createClip("1", 0, 10)
    const clip2 = createClip("2", 5, 10)

    expect(clipsOverlap(clip1, clip2)).toBe(true)
    expect(clipsOverlap(clip2, clip1)).toBe(true)
  })

  it("должен определять не перекрывающиеся клипы", () => {
    const clip1 = createClip("1", 0, 10)
    const clip2 = createClip("2", 10, 10)

    expect(clipsOverlap(clip1, clip2)).toBe(false)
    expect(clipsOverlap(clip2, clip1)).toBe(false)
  })

  it("должен обрабатывать граничные случаи", () => {
    const clip1 = createClip("1", 0, 10)
    const clip2 = createClip("2", 9.999, 10)
    const clip3 = createClip("3", 10.001, 10)

    expect(clipsOverlap(clip1, clip2)).toBe(true)
    expect(clipsOverlap(clip1, clip3)).toBe(false)
  })

  it("должен работать с клипами нулевой длительности", () => {
    const clip1 = createClip("1", 5, 0)
    const clip2 = createClip("2", 5, 10)

    expect(clipsOverlap(clip1, clip2)).toBe(false)
    expect(clipsOverlap(clip2, clip1)).toBe(false)
  })
})

describe("findCollisions", () => {
  it("должен находить все коллизии", () => {
    const clip = createClip("1", 5, 10)
    const otherClips = [
      createClip("2", 0, 6), // Перекрывается в начале
      createClip("3", 14, 5), // Перекрывается в конце
      createClip("4", 20, 5), // Не перекрывается
    ]

    const collisions = findCollisions(clip, otherClips)
    expect(collisions).toHaveLength(2)
    expect(collisions.map((c) => c.id)).toEqual(["2", "3"])
  })

  it("должен игнорировать сам клип", () => {
    const clip = createClip("1", 5, 10)
    const otherClips = [clip, createClip("2", 0, 6)]

    const collisions = findCollisions(clip, otherClips)
    expect(collisions).toHaveLength(1)
    expect(collisions[0].id).toBe("2")
  })

  it("должен учитывать allowOverlap constraint", () => {
    const clip = createClip("1", 5, 10)
    const otherClips = [createClip("2", 0, 10)]
    const constraints: EditConstraints = { ...DEFAULT_EDIT_CONSTRAINTS, allowOverlap: true }

    const collisions = findCollisions(clip, otherClips, constraints)
    expect(collisions).toHaveLength(0)
  })
})

describe("getClipTrimBounds", () => {
  describe("trim start", () => {
    it("должен ограничивать начало предыдущим клипом", () => {
      const clips = [createClip("1", 0, 10), createClip("2", 15, 20)]
      const track = createTrack(clips)

      const bounds = getClipTrimBounds(clips[1], "start", track)
      expect(bounds.min).toBe(10) // Конец первого клипа
      expect(bounds.max).toBe(34) // 15 + 20 - 1 (minClipDuration)
    })

    it("должен позволять перекрытие при allowOverlap", () => {
      const clips = [createClip("1", 0, 10), createClip("2", 15, 20)]
      const track = createTrack(clips)
      const constraints = { ...DEFAULT_EDIT_CONSTRAINTS, allowOverlap: true }

      const bounds = getClipTrimBounds(clips[1], "start", track, constraints)
      expect(bounds.min).toBe(0) // Можно двигать до начала таймлайна
    })

    it("должен работать для первого клипа", () => {
      const clips = [createClip("1", 10, 20)]
      const track = createTrack(clips)

      const bounds = getClipTrimBounds(clips[0], "start", track)
      expect(bounds.min).toBe(0)
      expect(bounds.max).toBe(29) // 10 + 20 - 1
    })

    it("должен учитывать minClipDuration", () => {
      const clips = [createClip("1", 10, 20)]
      const track = createTrack(clips)
      const constraints = { ...DEFAULT_EDIT_CONSTRAINTS, minClipDuration: 5 }

      const bounds = getClipTrimBounds(clips[0], "start", track, constraints)
      expect(bounds.max).toBe(25) // 10 + 20 - 5
    })
  })

  describe("trim end", () => {
    it("должен ограничивать конец следующим клипом", () => {
      const clips = [createClip("1", 0, 10), createClip("2", 15, 20)]
      const track = createTrack(clips)

      const bounds = getClipTrimBounds(clips[0], "end", track)
      expect(bounds.min).toBe(1) // 0 + 1 (minClipDuration)
      expect(bounds.max).toBe(15) // Начало следующего клипа
    })

    it("должен позволять бесконечное расширение для последнего клипа", () => {
      const clips = [createClip("1", 0, 10)]
      const track = createTrack(clips)

      const bounds = getClipTrimBounds(clips[0], "end", track)
      expect(bounds.min).toBe(1)
      expect(bounds.max).toBe(Number.POSITIVE_INFINITY)
    })
  })
})

describe("findRippleAffectedClips", () => {
  it("должен находить все клипы после точки ripple", () => {
    const clips = [createClip("1", 0, 10), createClip("2", 15, 10), createClip("3", 30, 10)]
    const track = createTrack(clips)

    const affected = findRippleAffectedClips(clips[0], track, 10)
    expect(affected).toHaveLength(2)
    expect(affected.map((c) => c.id)).toEqual(["2", "3"])
  })

  it("не должен включать сам редактируемый клип", () => {
    const clips = [
      createClip("1", 0, 10),
      createClip("2", 5, 10), // Перекрывается
    ]
    const track = createTrack(clips)

    const affected = findRippleAffectedClips(clips[0], track, 5)
    expect(affected).toHaveLength(1)
    expect(affected[0].id).toBe("2")
  })

  it("должен работать с пустым списком", () => {
    const clip = createClip("1", 0, 10)
    const track = createTrack([clip])

    const affected = findRippleAffectedClips(clip, track, 10)
    expect(affected).toHaveLength(0)
  })
})

describe("calculateRollDelta", () => {
  it("должен вычислять delta для смежных клипов", () => {
    const clip1 = createClip("1", 0, 10)
    const clip2 = createClip("2", 10, 10)

    const delta = calculateRollDelta(clip1, clip2, 12)
    expect(delta).toBe(2) // 12 - 10
  })

  it("должен возвращать null для несмежных клипов", () => {
    const clip1 = createClip("1", 0, 10)
    const clip2 = createClip("2", 15, 10)

    const delta = calculateRollDelta(clip1, clip2, 12)
    expect(delta).toBe(null)
  })

  it("должен учитывать minClipDuration", () => {
    const clip1 = createClip("1", 0, 10)
    const clip2 = createClip("2", 10, 10)
    const constraints = { ...DEFAULT_EDIT_CONSTRAINTS, minClipDuration: 5 }

    // Попытка сделать clip2 слишком коротким
    const delta1 = calculateRollDelta(clip1, clip2, 16, constraints)
    expect(delta1).toBe(null) // clip2 стал бы 4 frames

    // Допустимое изменение
    const delta2 = calculateRollDelta(clip1, clip2, 15, constraints)
    expect(delta2).toBe(5)
  })

  it("должен работать с небольшим зазором (tolerance)", () => {
    const clip1 = createClip("1", 0, 10)
    const clip2 = createClip("2", 10.0005, 10) // Зазор 0.0005 < 0.001

    const delta = calculateRollDelta(clip1, clip2, 12)
    expect(delta).not.toBe(null)
  })
})

describe("getSlipBounds", () => {
  it("должен вычислять границы для slip", () => {
    const clip = { ...createClip("1", 10, 20, 5), mediaDuration: 50 }

    const bounds = getSlipBounds(clip)
    expect(bounds.min).toBe(-5) // -offset
    expect(bounds.max).toBe(25) // 50 - 5 - 20
  })

  it("должен работать без mediaDuration", () => {
    const clip = createClip("1", 10, 20, 5)

    const bounds = getSlipBounds(clip)
    expect(bounds.min).toBe(-5)
    expect(bounds.max).toBe(-5) // duration - offset - duration = -5
  })

  it("должен работать с нулевым offset", () => {
    const clip = { ...createClip("1", 10, 20, 0), mediaDuration: 30 }

    const bounds = getSlipBounds(clip)
    expect(bounds.min).toBe(-0) // -0 === -0, но Object.is различает -0 и +0
    expect(bounds.max).toBe(10) // 30 - 0 - 20
  })
})

describe("findSlideAdjacentClips", () => {
  it("должен находить соседние клипы", () => {
    const clips = [createClip("1", 0, 10), createClip("2", 15, 10), createClip("3", 30, 10)]
    const track = createTrack(clips)

    const adjacent = findSlideAdjacentClips(clips[1], track)
    expect(adjacent.prev?.id).toBe("1")
    expect(adjacent.next?.id).toBe("3")
  })

  it("должен обрабатывать первый клип", () => {
    const clips = [createClip("1", 0, 10), createClip("2", 15, 10)]
    const track = createTrack(clips)

    const adjacent = findSlideAdjacentClips(clips[0], track)
    expect(adjacent.prev).toBe(null)
    expect(adjacent.next?.id).toBe("2")
  })

  it("должен обрабатывать последний клип", () => {
    const clips = [createClip("1", 0, 10), createClip("2", 15, 10)]
    const track = createTrack(clips)

    const adjacent = findSlideAdjacentClips(clips[1], track)
    expect(adjacent.prev?.id).toBe("1")
    expect(adjacent.next).toBe(null)
  })

  it("должен работать с неотсортированными клипами", () => {
    const clips = [createClip("2", 15, 10), createClip("3", 30, 10), createClip("1", 0, 10)]
    const track = createTrack(clips)

    const adjacent = findSlideAdjacentClips(clips[0], track) // clip "2"
    expect(adjacent.prev?.id).toBe("1")
    expect(adjacent.next?.id).toBe("3")
  })
})

describe("getSlideBounds", () => {
  it("должен вычислять границы для slide", () => {
    const clips = [createClip("1", 0, 10), createClip("2", 20, 10), createClip("3", 40, 10)]
    const track = createTrack(clips)

    const bounds = getSlideBounds(clips[1], track)
    expect(bounds.min).toBe(-19) // 0 + 1 - 20 = -19
    expect(bounds.max).toBe(19) // 40 + 10 - 1 - 30 = 19
  })

  it("должен обрабатывать клип без соседей", () => {
    const clip = createClip("1", 20, 10)
    const track = createTrack([clip])

    const bounds = getSlideBounds(clip, track)
    expect(bounds.min).toBe(-20) // Можно сдвинуть до 0
    expect(bounds.max).toBe(Number.POSITIVE_INFINITY)
  })

  it("должен учитывать minClipDuration", () => {
    const clips = [createClip("1", 0, 10), createClip("2", 20, 10)]
    const track = createTrack(clips)
    const constraints = { ...DEFAULT_EDIT_CONSTRAINTS, minClipDuration: 5 }

    const bounds = getSlideBounds(clips[1], track, constraints)
    expect(bounds.min).toBe(-15) // 0 + 5 - 20
  })
})

describe("sortClipsByTime", () => {
  it("должен сортировать клипы по времени начала", () => {
    const clips = [createClip("3", 20, 10), createClip("1", 0, 10), createClip("2", 10, 10)]

    const sorted = sortClipsByTime(clips)
    expect(sorted.map((c) => c.id)).toEqual(["1", "2", "3"])
  })

  it("не должен мутировать исходный массив", () => {
    const clips = [createClip("2", 10, 10), createClip("1", 0, 10)]
    const original = [...clips]

    sortClipsByTime(clips)
    expect(clips).toEqual(original)
  })

  it("должен обрабатывать пустой массив", () => {
    expect(sortClipsByTime([])).toEqual([])
  })
})

describe("getClipsInRange", () => {
  it("должен находить клипы в диапазоне", () => {
    const clips = [createClip("1", 0, 10), createClip("2", 15, 10), createClip("3", 30, 10)]

    const inRange = getClipsInRange(clips, 5, 25)
    expect(inRange.map((c) => c.id)).toEqual(["1", "2"])
  })

  it("должен включать частично перекрывающиеся клипы", () => {
    const clips = [createClip("1", 0, 10), createClip("2", 5, 20)]

    expect(getClipsInRange(clips, 9, 11).map((c) => c.id)).toEqual(["1", "2"])
    expect(getClipsInRange(clips, -5, 5).map((c) => c.id)).toEqual(["1"])
    expect(getClipsInRange(clips, 20, 30).map((c) => c.id)).toEqual(["2"])
  })

  it("должен работать с точными границами", () => {
    const clips = [createClip("1", 10, 10)]

    expect(getClipsInRange(clips, 10, 20)).toHaveLength(1)
    expect(getClipsInRange(clips, 20, 30)).toHaveLength(0)
    expect(getClipsInRange(clips, 0, 10)).toHaveLength(0)
  })
})

describe("validateEdit", () => {
  describe("trim operation", () => {
    it("должен валидировать корректный trim", () => {
      const clip = createClip("1", 10, 20)
      const track = createTrack([clip])

      const result = validateEdit("trim", { clipId: "1", delta: 5, edge: "start" }, track)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("должен отклонять trim с коллизиями", () => {
      const clips = [createClip("1", 0, 10), createClip("2", 15, 10)]
      const track = createTrack(clips)

      const result = validateEdit("trim", { clipId: "1", delta: 10, edge: "end" }, track)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Operation would cause overlap with 1 clip(s)")
    })

    it("должен отклонять trim меньше minClipDuration", () => {
      const clip = createClip("1", 10, 5)
      const track = createTrack([clip])

      const result = validateEdit("trim", { clipId: "1", delta: 4.5, edge: "start" }, track)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toMatch(/less than minimum/)
    })

    it("должен обрабатывать несуществующий клип", () => {
      const track = createTrack([])

      const result = validateEdit("trim", { clipId: "1", delta: 5, edge: "start" }, track)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Clip not found")
    })
  })

  describe("ripple operation", () => {
    it("должен валидировать ripple с предупреждениями", () => {
      const clips = [createClip("1", 0, 10), createClip("2", 15, 10), createClip("3", 30, 10)]
      const track = createTrack(clips)

      const result = validateEdit("ripple", { clipId: "1", delta: 5 }, track)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain("Ripple will affect 2 downstream clips")
    })

    it("должен обрабатывать ripple без affected клипов", () => {
      const clip = createClip("1", 0, 10)
      const track = createTrack([clip])

      const result = validateEdit("ripple", { clipId: "1", delta: 5 }, track)
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe("unknown operation", () => {
    it("должен добавлять предупреждение для неизвестной операции", () => {
      const track = createTrack([])

      const result = validateEdit("unknown", { clipId: "1", delta: 5 }, track)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain("Unknown operation type: unknown")
    })
  })

  describe("common validations", () => {
    it("должен отклонять операции без track", () => {
      const result = validateEdit("trim", { clipId: "1", delta: 5 }, null as any)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Track not found")
    })

    it("должен работать с кастомными constraints", () => {
      const clip = createClip("1", 10, 20)
      const track = createTrack([clip])
      const constraints = { ...DEFAULT_EDIT_CONSTRAINTS, minClipDuration: 15 }

      const result = validateEdit("trim", { clipId: "1", delta: 10, edge: "start" }, track, constraints)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toMatch(/15 frames/)
    })
  })
})
