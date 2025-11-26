import { beforeEach, describe, expect, it } from "vitest"
import { SceneContextService } from "@/domains/ai-services/services/recognition"
import { createMockDetection, createMockVideo } from "../../__mocks__"

describe("SceneContextService", () => {
  let service: SceneContextService

  const mockVideoInfo = createMockVideo()

  const mockDetections = [
    createMockDetection({ class: "person", confidence: 0.95 }),
    createMockDetection({
      class: "car",
      confidence: 0.87,
      bbox: { x: 0.5, y: 0.4, width: 0.2, height: 0.3 },
    }),
    createMockDetection({
      class: "person",
      confidence: 0.92,
      bbox: { x: 0.7, y: 0.1, width: 0.25, height: 0.5 },
    }),
  ]

  beforeEach(() => {
    service = new SceneContextService()
  })

  describe("createSceneContext", () => {
    it("should create correct scene context", () => {
      const context = service.createSceneContext(mockVideoInfo, mockDetections, 5.5)

      expect(context.currentVideo).toEqual({
        id: "test-video",
        name: "test.mp4",
        timestamp: 5.5,
      })

      expect(context.detectedObjects).toHaveLength(3)
      expect(context.objectCounts).toEqual({
        person: 2,
        car: 1,
      })

      expect(context.dominantObjects).toContain("person") // 2/3 > 20%
      expect(context.sceneDescription).toContain("В кадре обнаружено")
    })

    it("should handle empty detections", () => {
      const context = service.createSceneContext(mockVideoInfo, [], 0)

      expect(context.detectedObjects).toHaveLength(0)
      expect(context.objectCounts).toEqual({})
      expect(context.dominantObjects).toHaveLength(0)
      expect(context.sceneDescription).toBe("В кадре не обнаружено объектов.")
    })

    it("should calculate correct positions", () => {
      const context = service.createSceneContext(mockVideoInfo, mockDetections, 0)

      const firstPerson = context.detectedObjects[0]
      expect(firstPerson.position).toContain("середине")
      expect(firstPerson.position).toContain("слева")

      const car = context.detectedObjects[1]
      expect(car.position).toContain("середине")
      expect(car.position).toContain("центре")
    })

    it("should calculate correct sizes", () => {
      const context = service.createSceneContext(mockVideoInfo, mockDetections, 0)

      const firstPerson = context.detectedObjects[0]
      // 0.3 * 0.6 = 0.18 > 0.15, поэтому "большой"
      expect(firstPerson.size).toBe("большой")

      const car = context.detectedObjects[1]
      // 0.2 * 0.3 = 0.06 > 0.05, поэтому "средний"
      expect(car.size).toBe("средний")
    })
  })

  describe("calculatePosition", () => {
    it("should calculate top-left position", () => {
      const detection = {
        class: "person",
        confidence: 0.95,
        bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      }

      const position = (service as any).calculatePosition(detection)
      expect(position).toBe("вверху слева кадра")
    })

    it("should calculate bottom-right position", () => {
      const detection = {
        class: "person",
        confidence: 0.95,
        bbox: { x: 0.7, y: 0.7, width: 0.2, height: 0.2 },
      }

      const position = (service as any).calculatePosition(detection)
      expect(position).toBe("внизу справа кадра")
    })

    it("should calculate center position", () => {
      const detection = {
        class: "person",
        confidence: 0.95,
        bbox: { x: 0.4, y: 0.4, width: 0.2, height: 0.2 },
      }

      const position = (service as any).calculatePosition(detection)
      expect(position).toBe("в середине в центре кадра")
    })
  })

  describe("calculateSize", () => {
    it("should calculate small size", () => {
      const detection = {
        class: "person",
        confidence: 0.95,
        bbox: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 }, // 0.02 area
      }

      const size = (service as any).calculateSize(detection)
      expect(size).toBe("маленький")
    })

    it("should calculate medium size", () => {
      const detection = {
        class: "person",
        confidence: 0.95,
        bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.3 }, // 0.06 area
      }

      const size = (service as any).calculateSize(detection)
      expect(size).toBe("средний")
    })

    it("should calculate large size", () => {
      const detection = {
        class: "person",
        confidence: 0.95,
        bbox: { x: 0.1, y: 0.1, width: 0.4, height: 0.5 }, // 0.2 area
      }

      const size = (service as any).calculateSize(detection)
      expect(size).toBe("большой")
    })

    it("should calculate very large size", () => {
      const detection = {
        class: "person",
        confidence: 0.95,
        bbox: { x: 0.1, y: 0.1, width: 0.7, height: 0.8 }, // 0.56 area
      }

      const size = (service as any).calculateSize(detection)
      expect(size).toBe("очень большой")
    })
  })

  describe("generateObjectDescription", () => {
    it("should generate correct object description", () => {
      const detection = {
        class: "person",
        confidence: 0.95,
        bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
      }

      const description = (service as any).generateObjectDescription(detection)
      expect(description).toContain("большой person")
      expect(description).toContain("(уверенность: 95%)")
    })
  })

  describe("generateSceneDescription", () => {
    it("should generate description for single objects", () => {
      const detectedObjects = [
        {
          class: "person",
          position: "в середине слева кадра",
          size: "большой",
        },
      ]

      const objectCounts = { person: 1 }

      const description = (service as any).generateSceneDescription(detectedObjects, objectCounts)

      expect(description).toBe("В кадре обнаружено: большой person в середине слева кадра.")
    })

    it("should generate description for multiple objects of same class", () => {
      const detectedObjects = [
        {
          class: "person",
          position: "в середине слева кадра",
          size: "большой",
        },
        {
          class: "person",
          position: "в середине справа кадра",
          size: "средний",
        },
      ]

      const objectCounts = { person: 2 }

      const description = (service as any).generateSceneDescription(detectedObjects, objectCounts)

      expect(description).toContain("2 person(ов)")
    })

    it("should handle empty objects", () => {
      const description = (service as any).generateSceneDescription([], {})
      expect(description).toBe("В кадре не обнаружено объектов.")
    })
  })

  describe("createChatDescription", () => {
    it("should create chat description", () => {
      const context = service.createSceneContext(mockVideoInfo, mockDetections, 5)
      const chatDescription = service.createChatDescription(context)

      expect(chatDescription).toContain("Сцена содержит 3 объект(ов)")
      expect(chatDescription).toContain("2 типа(ов)")
      expect(chatDescription).toContain("2 person(ов)")
      expect(chatDescription).toContain("car")
      expect(chatDescription).toContain("Основные объекты: person")
    })

    it("should handle empty scene", () => {
      const context = service.createSceneContext(mockVideoInfo, [], 0)
      const chatDescription = service.createChatDescription(context)

      expect(chatDescription).toBe("Пустая сцена без объектов.")
    })
  })

  describe("createDetailedDescription", () => {
    it("should create detailed description", () => {
      const context = service.createSceneContext(mockVideoInfo, mockDetections, 5.5)
      const detailedDescription = service.createDetailedDescription(context)

      expect(detailedDescription).toContain('Анализ видео "test.mp4"')
      expect(detailedDescription).toContain("на временной метке 5.5 секунд")
      expect(detailedDescription).toContain("Детальная информация об объектах:")
      expect(detailedDescription).toContain("1.")
      expect(detailedDescription).toContain("2.")
      expect(detailedDescription).toContain("3.")
    })
  })

  describe("exportToJSON", () => {
    it("should export context to JSON", () => {
      const context = service.createSceneContext(mockVideoInfo, mockDetections, 5)
      const json = service.exportToJSON(context)

      const parsed = JSON.parse(json)
      expect(parsed.currentVideo).toEqual(context.currentVideo)
      expect(parsed.detectedObjects).toEqual(context.detectedObjects)
      expect(parsed.sceneDescription).toEqual(context.sceneDescription)
    })
  })

  describe("filterByClass", () => {
    it("should filter context by class", () => {
      const context = service.createSceneContext(mockVideoInfo, mockDetections, 5)
      const filteredContext = service.filterByClass(context, "person")

      expect(filteredContext.detectedObjects).toHaveLength(2)
      expect(filteredContext.detectedObjects.every((obj) => obj.class === "person")).toBe(true)
      expect(filteredContext.objectCounts).toEqual({ person: 2 })
      expect(filteredContext.dominantObjects).toEqual(["person"])
    })

    it("should handle non-existent class", () => {
      const context = service.createSceneContext(mockVideoInfo, mockDetections, 5)
      const filteredContext = service.filterByClass(context, "dog")

      expect(filteredContext.detectedObjects).toHaveLength(0)
      expect(filteredContext.objectCounts).toEqual({ dog: 0 })
      expect(filteredContext.dominantObjects).toEqual([])
    })
  })
})
