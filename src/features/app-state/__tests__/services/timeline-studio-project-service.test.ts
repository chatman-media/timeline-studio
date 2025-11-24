/**
 * Тесты для TimelineStudioProjectService
 */

import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_PROJECT_SETTINGS } from "@/features/project-settings/types/project"
import type { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"

import { TimelineStudioProjectService } from "../../services/timeline-studio-project-service"

// Мокаем Tauri API
vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}))

// Мокаем nanoid
vi.mock("nanoid", () => ({
  nanoid: () => `test-id-${Math.random().toString(36).substring(2, 11)}`,
}))

const mockReadTextFile = vi.mocked(readTextFile)
const mockWriteTextFile = vi.mocked(writeTextFile)

describe("TimelineStudioProjectService", () => {
  let service: TimelineStudioProjectService

  beforeEach(() => {
    vi.clearAllMocks()
    service = TimelineStudioProjectService.getInstance()
  })

  describe("getInstance", () => {
    it("должен возвращать singleton экземпляр", () => {
      const instance1 = TimelineStudioProjectService.getInstance()
      const instance2 = TimelineStudioProjectService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe("createProject", () => {
    it("должен создавать новый проект с настройками по умолчанию", async () => {
      const project = await service.createProject("My Project")

      expect(project.metadata.name).toBe("My Project")
      expect(project.metadata.version).toBe("2.0.0")
      expect(project.metadata.id).toBeTruthy()
      expect(project.metadata.created).toBeInstanceOf(Date)
      expect(project.metadata.modified).toBeInstanceOf(Date)

      // Проверяем настройки
      expect(project.settings.resolution).toBe(DEFAULT_PROJECT_SETTINGS.resolution)
      expect(project.settings.frameRate).toBe(DEFAULT_PROJECT_SETTINGS.frameRate)
      expect(project.settings.audio.sampleRate).toBe(48000)
      expect(project.settings.audio.bitDepth).toBe(24)
      expect(project.settings.preview.resolution).toBe("1/2")
      expect(project.settings.preview.useGPU).toBe(true)
    })

    it("должен создавать проект с кастомными настройками", async () => {
      const customSettings = {
        resolution: "3840x2160",
        frameRate: "60" as const,
      }

      const project = await service.createProject("4K Project", customSettings)

      expect(project.settings.resolution).toBe("3840x2160")
      expect(project.settings.frameRate).toBe("60")
    })

    it("должен создавать первую секвенцию автоматически", async () => {
      const project = await service.createProject("Test Project")

      expect(project.sequences.size).toBe(1)

      const mainSequence = project.sequences.get(project.activeSequenceId)
      expect(mainSequence).toBeTruthy()
      expect(mainSequence?.name).toBe("Test Project - Sequence 1")
      expect(mainSequence?.type).toBe("main")
      expect(mainSequence?.settings.resolution).toEqual({ width: 1920, height: 1080 })
      expect(mainSequence?.settings.frameRate).toBe(30)
    })

    it("должен инициализировать пустой Media Pool", async () => {
      const project = await service.createProject("Test")

      expect(project.mediaPool.items.size).toBe(0)
      expect(project.mediaPool.bins.size).toBe(1) // Только root bin
      expect(project.mediaPool.bins.has("root")).toBe(true)
      expect(project.mediaPool.stats.totalItems).toBe(0)
    })

    it("должен устанавливать правильную платформу", async () => {
      const project = await service.createProject("Test")

      // Платформа зависит от окружения тестов
      expect(["windows", "macos", "linux"]).toContain(project.metadata.platform)
    })

    it("должен настраивать автосохранение", async () => {
      const project = await service.createProject("Test")

      expect(project.backup.autoSave.enabled).toBe(true)
      expect(project.backup.autoSave.interval).toBe(5)
      expect(project.backup.autoSave.keepVersions).toBe(10)
      expect(project.backup.versions).toEqual([])
      expect(project.backup.lastSaved).toBeInstanceOf(Date)
    })
  })

  describe("openProject", () => {
    it("должен открывать проект нового формата", async () => {
      const mockProjectData: TimelineStudioProject = {
        metadata: {
          id: "test-id",
          name: "Saved Project",
          version: "2.0.0",
          created: new Date().toISOString() as any,
          modified: new Date().toISOString() as any,
          platform: "macos",
          appVersion: "1.0.0",
        },
        settings: {} as any,
        mediaPool: {
          items: {},
          bins: { root: { id: "root", name: "Media Pool" } },
          smartCollections: [],
          viewSettings: {} as any,
          stats: {} as any,
        } as any,
        sequences: new Map([["seq-1", { id: "seq-1", name: "Sequence 1" } as any]]),
        activeSequenceId: "seq-1",
        cache: {
          thumbnails: {},
          waveforms: {},
          proxies: {},
          sceneAnalysis: {},
        } as any,
        workspace: {} as any,
        backup: {
          autoSave: { enabled: true, interval: 5, keepVersions: 10 },
          versions: [],
          lastSaved: new Date().toISOString() as any,
        },
      }

      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(mockProjectData))

      const project = await service.openProject("/path/to/project.tlsp")

      expect(mockReadTextFile).toHaveBeenCalledWith("/path/to/project.tlsp")
      expect(project.metadata.name).toBe("Saved Project")
      expect(project.metadata.version).toBe("2.0.0")
      expect(project.sequences).toBeInstanceOf(Map)
      expect(project.mediaPool.items).toBeInstanceOf(Map)
    })

    it("должен выбрасывать ошибку для старого формата", async () => {
      const oldFormatData = {
        meta: { version: "1.0.0" },
        settings: {},
      }

      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(oldFormatData))

      await expect(service.openProject("/path/to/old.tls")).rejects.toThrow("Old project format detected")
    })

    it("должен выбрасывать ошибку для неизвестного формата", async () => {
      mockReadTextFile.mockResolvedValueOnce(JSON.stringify({ unknown: "format" }))

      await expect(service.openProject("/path/to/unknown.file")).rejects.toThrow("Unknown project format")
    })

    it("должен обрабатывать ошибки чтения файла", async () => {
      mockReadTextFile.mockRejectedValueOnce(new Error("File not found"))

      await expect(service.openProject("/nonexistent.tlsp")).rejects.toThrow("Failed to open project")
    })
  })

  describe("saveProject", () => {
    it("должен сохранять проект и обновлять метаданные", async () => {
      const project = await service.createProject("Test")
      const originalModified = project.metadata.modified
      const originalLastSaved = project.backup.lastSaved

      // Ждем немного, чтобы время изменилось
      await new Promise((resolve) => setTimeout(resolve, 10))

      await service.saveProject(project, "/path/to/save.tlsp")

      expect(project.metadata.modified.getTime()).toBeGreaterThan(originalModified.getTime())
      expect(project.backup.lastSaved.getTime()).toBeGreaterThan(originalLastSaved.getTime())

      expect(mockWriteTextFile).toHaveBeenCalledWith("/path/to/save.tlsp", expect.any(String))
    })

    it("должен сериализовать Map структуры в объекты", async () => {
      const project = await service.createProject("Test")
      project.mediaPool.items.set("item-1", { id: "item-1" } as any)

      await service.saveProject(project, "/test.tlsp")

      const savedContent = JSON.parse(mockWriteTextFile.mock.calls[0][1])

      expect(savedContent.mediaPool.items).toEqual({ "item-1": { id: "item-1" } })
      expect(typeof savedContent.sequences).toBe("object")
      expect(savedContent.sequences).not.toBeInstanceOf(Map)

      // Проверяем, что есть хотя бы одна секвенция (автоматически созданная)
      const sequenceIds = Object.keys(savedContent.sequences)
      expect(sequenceIds.length).toBeGreaterThan(0)
    })

    it("должен обрабатывать ошибки записи", async () => {
      const project = await service.createProject("Test")
      mockWriteTextFile.mockRejectedValueOnce(new Error("Write failed"))

      await expect(service.saveProject(project, "/readonly.tlsp")).rejects.toThrow("Failed to save project")
    })
  })

  describe("optimizeProject", () => {
    it("должен удалять неиспользуемые медиа элементы", async () => {
      const project = await service.createProject("Test")

      // Добавляем медиа элементы
      project.mediaPool.items.set("used-1", {
        id: "used-1",
        metadata: { fileSize: 1000000 },
      } as any)
      project.mediaPool.items.set("unused-1", {
        id: "unused-1",
        metadata: { fileSize: 2000000 },
      } as any)

      // Добавляем клип, использующий медиа
      const sequence = project.sequences.values().next().value
      if (sequence) {
        sequence.composition.tracks.push({
          id: "track-1",
          clips: [{ mediaId: "used-1" }],
        } as any)
      }

      const result = service.optimizeProject(project)

      expect(result.removedItems).toBe(1)
      expect(result.freedSpace).toBe(2000000)
      expect(result.optimizedCaches).toBe(true)
      expect(project.mediaPool.items.has("used-1")).toBe(true)
      expect(project.mediaPool.items.has("unused-1")).toBe(false)
    })

    it("должен очищать кэш для удаленных элементов", async () => {
      const project = await service.createProject("Test")

      // Добавляем элемент и его кэш
      project.mediaPool.items.set("item-1", {
        id: "item-1",
        metadata: { fileSize: 1000000 },
      } as any)
      project.cache.thumbnails.set("item-1", {} as any)
      project.cache.waveforms.set("item-1", {} as any)
      project.cache.proxies.set("item-1", {} as any)

      const result = service.optimizeProject(project)

      expect(project.cache.thumbnails.has("item-1")).toBe(false)
      expect(project.cache.waveforms.has("item-1")).toBe(false)
      expect(project.cache.proxies.has("item-1")).toBe(false)
    })
  })

  describe("validateProject", () => {
    it("должен валидировать корректный проект", async () => {
      const project = await service.createProject("Valid Project")

      const result = service.validateProject(project)

      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
      expect(result.missingMedia).toHaveLength(0)
      expect(result.corruptedSequences).toHaveLength(0)
    })

    it("должен находить проблемы с метаданными", async () => {
      const project = await service.createProject("Test")
      project.metadata.id = ""

      const result = service.validateProject(project)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain("Project metadata is incomplete")
    })

    it("должен находить отсутствующие медиа файлы", async () => {
      const project = await service.createProject("Test")
      project.mediaPool.items.set("missing-1", {
        id: "missing-1",
        status: "missing",
        source: { path: "/missing/file.mp4" },
      } as any)

      const result = service.validateProject(project)

      expect(result.isValid).toBe(false)
      expect(result.missingMedia).toContain("/missing/file.mp4")
    })

    it("должен проверять наличие секвенций", async () => {
      const project = await service.createProject("Test")
      project.sequences.clear()

      const result = service.validateProject(project)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain("Project has no sequences")
    })

    it("должен проверять активную секвенцию", async () => {
      const project = await service.createProject("Test")
      project.activeSequenceId = "non-existent"

      const result = service.validateProject(project)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain("Active sequence not found")
    })
  })

  describe("createBackup", () => {
    it("должен создавать резервную копию проекта", async () => {
      const project = await service.createProject("Test")
      const originalVersionsCount = project.backup.versions.length

      const backupPath = await service.createBackup(project)

      expect(backupPath).toMatch(/Test_backup_.*\.tlsp/)
      expect(project.backup.versions).toHaveLength(originalVersionsCount + 1)

      const lastVersion = project.backup.versions[project.backup.versions.length - 1]
      expect(lastVersion.path).toBe(backupPath)
      expect(lastVersion.timestamp).toBeInstanceOf(Date)
    })

    it("должен ограничивать количество версий", async () => {
      const project = await service.createProject("Test")
      project.backup.autoSave.keepVersions = 3

      // Добавляем несколько версий
      for (let i = 0; i < 5; i++) {
        await service.createBackup(project)
      }

      expect(project.backup.versions).toHaveLength(3)
    })
  })

  describe("Export/Import Stubs", () => {
    it("должен выбрасывать ошибку для неимплементированного экспорта", async () => {
      const project = await service.createProject("Test")

      expect(() => service.exportForExchange(project, "xml")).toThrow("not implemented")
      expect(() => service.exportForExchange(project, "aaf")).toThrow("not implemented")
      expect(() => service.exportForExchange(project, "edl")).toThrow("not implemented")
    })

    it("должен выбрасывать ошибку для неимплементированного импорта", () => {
      expect(() => service.importFromFormat("<xml/>", "xml")).toThrow("not implemented")
      expect(() => service.importFromFormat("data", "aaf")).toThrow("not implemented")
      expect(() => service.importFromFormat("data", "edl")).toThrow("not implemented")
    })
  })
})
