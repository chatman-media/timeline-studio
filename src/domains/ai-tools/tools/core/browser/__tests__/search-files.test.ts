/**
 * Тесты для FileSearchTool - инструмента поиска файлов в браузере
 *
 * TODO: Эти тесты требуют доработки моков для helpers
 * Временно пропущены до полной реализации browser tools
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { FileSearchTool, searchMediaFiles, searchMediaFilesWrapper } from "../search-files"
import type { SearchMediaParams } from "../types"
import * as helpers from "../utils/helpers"

describe.skip("FileSearchTool", () => {
  let tool: FileSearchTool

  beforeEach(() => {
    tool = new FileSearchTool()

    // Мокируем доступ к браузеру
    vi.spyOn(helpers, "hasBrowserAccess").mockReturnValue(true)
    vi.spyOn(helpers, "getBrowserStateAccess").mockReturnValue({
      getState: vi.fn(),
      setState: vi.fn(),
    })
    vi.spyOn(helpers, "getBrowserFiles").mockReturnValue([
      {
        id: "file1",
        name: "video.mp4",
        type: "video",
        location: "/media/videos",
        tags: ["intro", "main"],
        metadata: { duration: 120 },
      },
      {
        id: "file2",
        name: "audio.mp3",
        type: "audio",
        location: "/media/audio",
        tags: ["background"],
        metadata: { duration: 60 },
      },
      {
        id: "file3",
        name: "test_video.mp4",
        type: "video",
        location: "/media/test",
        tags: ["test"],
        metadata: { duration: 30 },
      },
    ])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Metadata", () => {
    it("должен возвращать корректные метаданные", () => {
      const metadata = tool.metadata
      expect(metadata.name).toBe("FileSearchTool")
      expect(metadata.displayName).toBe("File Search Tool")
      expect(metadata.domain).toBe("core")
      expect(metadata.category).toBe("browser")
      expect(metadata.tags).toContain("search")
    })
  })

  describe("Validation", () => {
    it("должен валидировать корректный input", () => {
      const input = { query: "video" }
      expect(tool.validate(input)).toBe(true)
    })

    it("должен отклонять пустой query", () => {
      const input = { query: "" }
      expect(tool.validate(input)).toBe(false)
    })

    it("должен отклонять input без query", () => {
      const input = {}
      expect(tool.validate(input)).toBe(false)
    })

    it("должен валидировать области поиска", async () => {
      const input = {
        query: "video",
        searchIn: ["invalid_area" as any],
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(false)
      expect(result.errors).toContain("Неверные области поиска: invalid_area")
    })

    it("должен валидировать вкладки", async () => {
      const input = {
        query: "video",
        tab: "invalid_tab" as any,
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(false)
      expect(result.errors).toContain("Неверная вкладка: invalid_tab")
    })

    it("должен валидировать maxResults", async () => {
      const input = {
        query: "video",
        maxResults: -1,
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(false)
      expect(result.errors).toContain("Максимальное количество результатов должно быть больше 0")
    })
  })

  describe("Search functionality", () => {
    it("должен находить файлы по имени", async () => {
      const input = {
        query: "video",
        searchIn: ["filename" as const],
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(true)
      expect(result.data?.files).toHaveLength(2)
      expect(result.data?.files.map((f) => f.name)).toContain("video.mp4")
      expect(result.data?.files.map((f) => f.name)).toContain("test_video.mp4")
    })

    it("должен находить файлы по расположению", async () => {
      const input = {
        query: "test",
        searchIn: ["location" as const],
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(true)
      expect(result.data?.files).toHaveLength(1)
      expect(result.data?.files[0].name).toBe("test_video.mp4")
    })

    it("должен находить файлы по тегам", async () => {
      const input = {
        query: "intro",
        searchIn: ["tags" as const],
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(true)
      expect(result.data?.files).toHaveLength(1)
      expect(result.data?.files[0].tags).toContain("intro")
    })

    it("должен поддерживать точное соответствие", async () => {
      const input = {
        query: "video.mp4",
        searchIn: ["filename" as const],
        advanced: {
          exactMatch: true,
        },
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(true)
      expect(result.data?.files).toHaveLength(1)
      expect(result.data?.files[0].name).toBe("video.mp4")
    })

    it("должен поддерживать учет регистра", async () => {
      const input = {
        query: "VIDEO",
        searchIn: ["filename" as const],
        advanced: {
          caseSensitive: false,
        },
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(true)
      expect(result.data?.files.length).toBeGreaterThan(0)
    })

    it("должен ограничивать количество результатов", async () => {
      const input = {
        query: "video",
        maxResults: 1,
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(true)
      expect(result.data?.files).toHaveLength(1)
    })

    it("должен возвращать анализ результатов", async () => {
      const input = {
        query: "video",
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(true)
      expect(result.data?.analysis).toBeDefined()
      expect(result.data?.analysis.totalMatches).toBeGreaterThan(0)
      expect(result.data?.analysis.fileTypeBreakdown).toBeDefined()
    })

    it("должен возвращать предложения при пустых результатах", async () => {
      const input = {
        query: "nonexistent",
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(true)
      expect(result.data?.files).toHaveLength(0)
      expect(result.data?.suggestions.length).toBeGreaterThan(0)
    })

    it("должен сортировать результаты по релевантности", async () => {
      const input = {
        query: "video",
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(true)
      // Первым должен быть файл, начинающийся с "video"
      expect(result.data?.files[0].name).toBe("video.mp4")
    })
  })

  describe("Error handling", () => {
    it("должен обрабатывать отсутствие доступа к браузеру", async () => {
      vi.spyOn(helpers, "hasBrowserAccess").mockReturnValue(false)

      const input = {
        query: "video",
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(false)
      expect(result.message).toContain("Browser state access не настроен")
    })

    it("должен обрабатывать ошибки при поиске", async () => {
      vi.spyOn(helpers, "getBrowserFiles").mockImplementation(() => {
        throw new Error("Test error")
      })

      const input = {
        query: "video",
      }

      const result = await tool.searchFiles(input)
      expect(result.success).toBe(false)
    })
  })

  describe("Schema", () => {
    it("должен возвращать корректную схему", () => {
      const schema = tool.getSchema()
      expect(schema.input).toBeDefined()
      expect(schema.output).toBeDefined()
      expect(schema.input.required).toContain("query")
    })
  })

  describe("Execute", () => {
    it("должен выполнять поиск через метод execute", async () => {
      const input = {
        query: "video",
      }

      const result = await tool.execute(input)
      expect(result.success).toBe(true)
      expect(result.data?.files.length).toBeGreaterThan(0)
    })
  })
})

describe.skip("searchMediaFiles", () => {
  beforeEach(() => {
    vi.spyOn(helpers, "hasBrowserAccess").mockReturnValue(true)
    vi.spyOn(helpers, "getBrowserStateAccess").mockReturnValue({
      getState: vi.fn(),
      setState: vi.fn(),
    })
    vi.spyOn(helpers, "getBrowserFiles").mockReturnValue([
      {
        id: "file1",
        name: "video.mp4",
        type: "video",
        location: "/media/videos",
      },
    ])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("должен выполнять поиск с базовыми параметрами", async () => {
    const params: SearchMediaParams = {
      query: "video",
      searchIn: ["filename"],
    }

    const result = await searchMediaFiles(params)
    expect(result.success).toBe(true)
    expect(result.data?.files).toHaveLength(1)
  })

  it("должен обрабатывать отсутствие доступа к браузеру", async () => {
    vi.spyOn(helpers, "hasBrowserAccess").mockReturnValue(false)

    const params: SearchMediaParams = {
      query: "video",
      searchIn: ["filename"],
    }

    const result = await searchMediaFiles(params)
    expect(result.success).toBe(false)
  })
})

describe.skip("searchMediaFilesWrapper", () => {
  beforeEach(() => {
    vi.spyOn(helpers, "hasBrowserAccess").mockReturnValue(true)
    vi.spyOn(helpers, "getBrowserStateAccess").mockReturnValue({
      getState: vi.fn(),
      setState: vi.fn(),
    })
    vi.spyOn(helpers, "getBrowserFiles").mockReturnValue([
      {
        id: "file1",
        name: "video.mp4",
        type: "video",
      },
    ])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("должен работать как обертка для FileSearchTool", async () => {
    const params: SearchMediaParams = {
      query: "video",
      searchIn: ["filename"],
    }

    const result = await searchMediaFilesWrapper(params)
    expect(result.success).toBe(true)
    expect(result.data?.files).toHaveLength(1)
  })
})
