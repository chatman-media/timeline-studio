import { describe, expect, it } from "vitest"
import {
  getMediaExtensions,
  getMusicExtensions,
  processBatch,
  validateEffect,
  validateFilter,
  validateStyleTemplate,
  validateSubtitleStyle,
  validateTransition,
} from "../validation"

describe("validation utils", () => {
  describe("validateEffect", () => {
    it("должен вернуть валидный эффект при корректных данных", () => {
      const validEffect = {
        id: "effect-1",
        name: "Test Effect",
        type: "transition",
        ffmpegCommand: "some command",
        duration: 1000,
        category: "test",
        complexity: "low",
      }

      const result = validateEffect(validEffect)
      expect(result).toEqual(validEffect)
    })

    it("должен вернуть null при null данных", () => {
      expect(validateEffect(null)).toBeNull()
    })

    it("должен вернуть null при undefined данных", () => {
      expect(validateEffect(undefined)).toBeNull()
    })

    it("должен вернуть null при некорректном типе данных", () => {
      expect(validateEffect("string")).toBeNull()
      expect(validateEffect(123)).toBeNull()
      expect(validateEffect([])).toBeNull()
    })

    it("должен вернуть null если отсутствует id", () => {
      const invalidEffect = {
        name: "Test Effect",
        type: "transition",
        ffmpegCommand: "some command",
      }
      expect(validateEffect(invalidEffect)).toBeNull()
    })

    it("должен вернуть null если отсутствует name", () => {
      const invalidEffect = {
        id: "effect-1",
        type: "transition",
        ffmpegCommand: "some command",
      }
      expect(validateEffect(invalidEffect)).toBeNull()
    })

    it("должен вернуть null если отсутствует type", () => {
      const invalidEffect = {
        id: "effect-1",
        name: "Test Effect",
        ffmpegCommand: "some command",
      }
      expect(validateEffect(invalidEffect)).toBeNull()
    })

    it("должен вернуть null если отсутствует ffmpegCommand", () => {
      const invalidEffect = {
        id: "effect-1",
        name: "Test Effect",
        type: "transition",
      }
      expect(validateEffect(invalidEffect)).toBeNull()
    })

    it("должен вернуть null если отсутствуют обязательные поля", () => {
      const invalidEffect = {
        id: "effect-1",
        name: "Test Effect",
        type: "transition",
        ffmpegCommand: "some command",
        // Отсутствуют duration, category, complexity
      }
      expect(validateEffect(invalidEffect)).toBeNull()
    })

    it("должен принимать дополнительные поля", () => {
      const effectWithExtraFields = {
        id: "effect-1",
        name: "Test Effect",
        type: "transition",
        ffmpegCommand: "some command",
        duration: 1000,
        category: "test",
        complexity: "low",
        extraField: "extra",
      }
      const result = validateEffect(effectWithExtraFields)
      expect(result).toEqual(effectWithExtraFields)
    })
  })

  describe("validateFilter", () => {
    it("должен вернуть валидный фильтр при корректных данных", () => {
      const validFilter = {
        id: "filter-1",
        name: "Test Filter",
        category: "color",
        complexity: "medium",
        params: { brightness: 50 },
      }

      const result = validateFilter(validFilter)
      expect(result).toEqual(validFilter)
    })

    it("должен вернуть null при некорректных данных", () => {
      expect(validateFilter(null)).toBeNull()
      expect(validateFilter(undefined)).toBeNull()
      expect(validateFilter("string")).toBeNull()
    })

    it("должен вернуть null если отсутствует id", () => {
      const invalidFilter = {
        name: "Test Filter",
        params: {},
      }
      expect(validateFilter(invalidFilter)).toBeNull()
    })

    it("должен вернуть null если отсутствует name", () => {
      const invalidFilter = {
        id: "filter-1",
        params: {},
      }
      expect(validateFilter(invalidFilter)).toBeNull()
    })

    it("должен вернуть null если отсутствует params", () => {
      const invalidFilter = {
        id: "filter-1",
        name: "Test Filter",
      }
      expect(validateFilter(invalidFilter)).toBeNull()
    })

    it("должен вернуть null если отсутствуют category или complexity", () => {
      const invalidFilter = {
        id: "filter-1",
        name: "Test Filter",
        params: {},
        // Отсутствуют category, complexity
      }
      expect(validateFilter(invalidFilter)).toBeNull()
    })
  })

  describe("validateTransition", () => {
    it("должен вернуть валидный переход при корректных данных", () => {
      const validTransition = {
        id: "transition-1",
        type: "fade",
        name: "Fade In",
        duration: { min: 100, max: 2000, default: 500 },
        category: "basic",
        complexity: "low",
        ffmpegCommand: "some command",
      }

      const result = validateTransition(validTransition)
      expect(result).toEqual(validTransition)
    })

    it("должен вернуть null при некорректных данных", () => {
      expect(validateTransition(null)).toBeNull()
      expect(validateTransition(undefined)).toBeNull()
    })

    it("должен вернуть null если отсутствует duration", () => {
      const invalidTransition = {
        id: "transition-1",
        type: "fade",
        name: "Fade In",
        category: "basic",
        complexity: "low",
        ffmpegCommand: "some command",
      }
      expect(validateTransition(invalidTransition)).toBeNull()
    })

    it("должен вернуть null если duration не объект", () => {
      const invalidTransition = {
        id: "transition-1",
        type: "fade",
        name: "Fade In",
        duration: "not an object",
        category: "basic",
        complexity: "low",
        ffmpegCommand: "some command",
      }
      expect(validateTransition(invalidTransition)).toBeNull()
    })

    it("должен вернуть null если duration не содержит min, max или default", () => {
      const invalidTransition1 = {
        id: "transition-1",
        type: "fade",
        name: "Fade In",
        duration: { max: 2000, default: 500 }, // Нет min
        category: "basic",
        complexity: "low",
        ffmpegCommand: "some command",
      }
      expect(validateTransition(invalidTransition1)).toBeNull()

      const invalidTransition2 = {
        id: "transition-1",
        type: "fade",
        name: "Fade In",
        duration: { min: 100, default: 500 }, // Нет max
        category: "basic",
        complexity: "low",
        ffmpegCommand: "some command",
      }
      expect(validateTransition(invalidTransition2)).toBeNull()

      const invalidTransition3 = {
        id: "transition-1",
        type: "fade",
        name: "Fade In",
        duration: { min: 100, max: 2000 }, // Нет default
        category: "basic",
        complexity: "low",
        ffmpegCommand: "some command",
      }
      expect(validateTransition(invalidTransition3)).toBeNull()
    })
  })

  describe("validateSubtitleStyle", () => {
    it("должен вернуть валидный стиль субтитров при корректных данных", () => {
      const validStyle = {
        id: "style-1",
        name: "Test Style",
        category: "modern",
        complexity: "low",
        style: {
          fontSize: "16px",
          color: "#ffffff",
        },
      }

      const result = validateSubtitleStyle(validStyle)
      expect(result).toEqual(validStyle)
    })

    it("должен вернуть null при некорректных данных", () => {
      expect(validateSubtitleStyle(null)).toBeNull()
      expect(validateSubtitleStyle(undefined)).toBeNull()
    })

    it("должен вернуть null если style не объект", () => {
      const invalidStyle = {
        id: "style-1",
        name: "Test Style",
        category: "modern",
        complexity: "low",
        style: "not an object",
      }
      expect(validateSubtitleStyle(invalidStyle)).toBeNull()
    })

    it("должен вернуть null если style это массив", () => {
      const invalidStyle = {
        id: "style-1",
        name: "Test Style",
        category: "modern",
        complexity: "low",
        style: [],
      }
      expect(validateSubtitleStyle(invalidStyle)).toBeNull()
    })

    it("должен вернуть null если отсутствуют обязательные поля", () => {
      const invalidStyle = {
        id: "style-1",
        name: "Test Style",
        style: {},
        // Отсутствуют category, complexity
      }
      expect(validateSubtitleStyle(invalidStyle)).toBeNull()
    })
  })

  describe("validateStyleTemplate", () => {
    it("должен вернуть валидный шаблон при корректных данных", () => {
      const validTemplate = {
        id: "template-1",
        name: "Test Template",
        category: "intro",
        style: {},
        aspectRatio: "16:9",
        duration: 5000,
        elements: [],
      }

      const result = validateStyleTemplate(validTemplate)
      expect(result).toEqual(validTemplate)
    })

    it("должен вернуть null при некорректных данных", () => {
      expect(validateStyleTemplate(null)).toBeNull()
      expect(validateStyleTemplate(undefined)).toBeNull()
    })

    it("должен вернуть null если elements не массив", () => {
      const invalidTemplate = {
        id: "template-1",
        name: "Test Template",
        category: "intro",
        style: {},
        aspectRatio: "16:9",
        duration: 5000,
        elements: "not an array",
      }
      expect(validateStyleTemplate(invalidTemplate)).toBeNull()
    })

    it("должен вернуть null если отсутствуют обязательные поля", () => {
      const invalidTemplate = {
        id: "template-1",
        name: "Test Template",
        elements: [],
        // Отсутствуют category, style, aspectRatio, duration
      }
      expect(validateStyleTemplate(invalidTemplate)).toBeNull()
    })

    it("должен принимать шаблон с элементами", () => {
      const templateWithElements = {
        id: "template-1",
        name: "Test Template",
        category: "intro",
        style: {},
        aspectRatio: "16:9",
        duration: 5000,
        elements: [
          { type: "text", content: "Hello" },
          { type: "image", src: "image.png" },
        ],
      }
      const result = validateStyleTemplate(templateWithElements)
      expect(result).toEqual(templateWithElements)
    })
  })

  describe("getMediaExtensions", () => {
    it("должен вернуть массив расширений медиа файлов", () => {
      const extensions = getMediaExtensions()
      expect(Array.isArray(extensions)).toBe(true)
      expect(extensions.length).toBeGreaterThan(0)
    })

    it("должен включать популярные видео форматы", () => {
      const extensions = getMediaExtensions()
      expect(extensions).toContain(".mp4")
      expect(extensions).toContain(".avi")
      expect(extensions).toContain(".mov")
      expect(extensions).toContain(".mkv")
    })

    it("должен включать популярные форматы изображений", () => {
      const extensions = getMediaExtensions()
      expect(extensions).toContain(".jpg")
      expect(extensions).toContain(".png")
      expect(extensions).toContain(".gif")
    })

    it("все расширения должны начинаться с точки", () => {
      const extensions = getMediaExtensions()
      extensions.forEach((ext) => {
        expect(ext.startsWith(".")).toBe(true)
      })
    })
  })

  describe("getMusicExtensions", () => {
    it("должен вернуть массив расширений музыкальных файлов", () => {
      const extensions = getMusicExtensions()
      expect(Array.isArray(extensions)).toBe(true)
      expect(extensions.length).toBeGreaterThan(0)
    })

    it("должен включать популярные аудио форматы", () => {
      const extensions = getMusicExtensions()
      expect(extensions).toContain(".mp3")
      expect(extensions).toContain(".wav")
      expect(extensions).toContain(".ogg")
      expect(extensions).toContain(".m4a")
    })

    it("все расширения должны начинаться с точки", () => {
      const extensions = getMusicExtensions()
      extensions.forEach((ext) => {
        expect(ext.startsWith(".")).toBe(true)
      })
    })

    it("не должен содержать видео форматы", () => {
      const extensions = getMusicExtensions()
      expect(extensions).not.toContain(".mp4")
      expect(extensions).not.toContain(".avi")
      expect(extensions).not.toContain(".mov")
    })
  })

  describe("processBatch", () => {
    it("должен обработать все элементы пакетами", async () => {
      const items = [1, 2, 3, 4, 5]
      const processor = async (item: number) => item * 2

      const results = await processBatch(items, 2, processor)

      expect(results).toEqual([2, 4, 6, 8, 10])
    })

    it("должен обработать пустой массив", async () => {
      const items: number[] = []
      const processor = async (item: number) => item * 2

      const results = await processBatch(items, 2, processor)

      expect(results).toEqual([])
    })

    it("должен обработать массив размером меньше batchSize", async () => {
      const items = [1, 2]
      const processor = async (item: number) => item * 2

      const results = await processBatch(items, 5, processor)

      expect(results).toEqual([2, 4])
    })

    it("должен правильно обрабатывать неравномерные пакеты", async () => {
      const items = [1, 2, 3, 4, 5, 6, 7]
      const processor = async (item: number) => item * 2

      const results = await processBatch(items, 3, processor)

      expect(results).toEqual([2, 4, 6, 8, 10, 12, 14])
    })

    it("должен обрабатывать асинхронные операции", async () => {
      const items = [100, 200, 300]
      const processor = async (item: number) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return item / 100
      }

      const results = await processBatch(items, 2, processor)

      expect(results).toEqual([1, 2, 3])
    })

    it("должен правильно обрабатывать различные типы данных", async () => {
      const items = ["a", "b", "c"]
      const processor = async (item: string) => item.toUpperCase()

      const results = await processBatch(items, 2, processor)

      expect(results).toEqual(["A", "B", "C"])
    })

    it("должен обрабатывать сложные объекты", async () => {
      const items = [
        { id: 1, name: "test1" },
        { id: 2, name: "test2" },
      ]
      const processor = async (item: { id: number; name: string }) => ({
        ...item,
        processed: true,
      })

      const results = await processBatch(items, 1, processor)

      expect(results).toEqual([
        { id: 1, name: "test1", processed: true },
        { id: 2, name: "test2", processed: true },
      ])
    })

    it("должен обрабатывать ошибки в процессоре", async () => {
      const items = [1, 2, 3]
      const processor = async (item: number) => {
        if (item === 2) {
          throw new Error("Error processing item 2")
        }
        return item * 2
      }

      await expect(processBatch(items, 2, processor)).rejects.toThrow("Error processing item 2")
    })

    it("должен сохранять порядок элементов", async () => {
      const items = Array.from({ length: 10 }, (_, i) => i)
      const processor = async (item: number) => {
        // Добавляем случайную задержку
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10))
        return item
      }

      const results = await processBatch(items, 3, processor)

      expect(results).toEqual(items)
    })
  })
})
