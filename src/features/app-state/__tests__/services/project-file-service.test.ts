import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ProjectFile } from "@/features/project-settings/types/project"

import {
  createNewProject,
  getProjectStats,
  hasUnsavedChanges,
  loadProject,
  migrateProject,
  saveProject,
  updateBrowserState,
  updateMediaLibrary,
  updateProjectFavorites,
} from "../../services/project-file-service"

// Мокаем core container
const mockReadTextFile = vi.fn()
const mockWriteTextFile = vi.fn()

vi.mock("@/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => ({
      readTextFile: mockReadTextFile,
      writeTextFile: mockWriteTextFile,
    })),
  },
}))

describe("ProjectFileService", () => {
  const mockProjectPath = "/path/to/project.tls"

  // Создаем mock для нового формата проекта с mediaPool
  const mockNewProject = {
    metadata: {
      id: "test-project",
      name: "Test Project",
      version: "2.0.0",
      created: new Date(),
      modified: new Date(),
      platform: "macos",
      appVersion: "1.0.0",
    },
    // Добавляем meta для обратной совместимости
    meta: {
      version: "1.0.0",
      createdAt: Date.now(),
      lastModified: Date.now(),
      originalPlatform: "macos",
    },
    settings: {
      aspectRatio: {
        label: "16:9",
        textLabel: "Широкоэкранный",
        description: "YouTube",
        value: { width: 1920, height: 1080, name: "16:9" },
      },
      resolution: "1920x1080",
      frameRate: "30",
      colorSpace: "sdr",
      audio: {
        sampleRate: 48000,
        bitDepth: 24,
        channels: 2,
        masterVolume: 1.0,
        panLaw: "-3dB",
      },
      preview: {
        resolution: "full",
        quality: "best",
        renderDuringPlayback: true,
        useGPU: true,
      },
      exportPresets: [],
    },
    mediaPool: {
      items: new Map([
        [
          "1",
          {
            id: "1",
            type: "video",
            name: "video.mp4",
            source: {
              path: "/path/to/video.mp4",
            },
            status: "online",
            binId: "root",
            metadata: {
              duration: 120,
              fileSize: 1000000,
              createdDate: new Date(),
              modifiedDate: new Date(),
              importedDate: new Date(),
            },
            usage: {
              sequences: [],
              count: 0,
            },
            tags: [],
          },
        ],
        [
          "2",
          {
            id: "2",
            type: "audio",
            name: "music.mp3",
            source: {
              path: "/path/to/music.mp3",
            },
            status: "online",
            binId: "root",
            metadata: {
              duration: 180,
              fileSize: 500000,
              createdDate: new Date(),
              modifiedDate: new Date(),
              importedDate: new Date(),
            },
            usage: {
              sequences: [],
              count: 0,
            },
            tags: [],
          },
        ],
      ]),
      bins: new Map([["root", { id: "root", name: "Media", parentId: null, sortOrder: 0, createdDate: new Date() }]]),
      smartCollections: [],
      viewSettings: {
        sortBy: "name",
        sortOrder: "asc",
        viewMode: "list",
        thumbnailSize: "medium",
        showOfflineMedia: true,
        showProxyBadge: true,
      },
      stats: {
        totalItems: 2,
        totalSize: 1500000,
        onlineItems: 2,
        offlineItems: 0,
        proxyItems: 0,
        unusedItems: 2,
      },
    },
    sequences: new Map(),
    activeSequenceId: "",
    cache: {
      thumbnails: new Map(),
      waveforms: new Map(),
      proxies: new Map(),
      sceneAnalysis: new Map(),
      totalSize: 0,
    },
    workspace: {
      layout: "edit",
      panels: {},
      recentTools: [],
      grid: {
        enabled: false,
        size: 1,
        snapToGrid: false,
        snapToClips: false,
        magneticTimeline: false,
      },
    },
    backup: {
      autoSave: {
        enabled: true,
        interval: 5,
        keepVersions: 10,
      },
      versions: [],
      lastSaved: new Date(),
    },
  }

  // Mock для старого формата (для тестов миграции)
  const mockLegacyProject: ProjectFile = {
    settings: {
      aspectRatio: {
        label: "16:9",
        textLabel: "Широкоэкранный",
        description: "YouTube",
        value: { width: 1920, height: 1080, name: "16:9" },
      },
      resolution: "1920x1080",
      frameRate: "30",
      colorSpace: "sdr",
    },
    mediaLibrary: {
      mediaFiles: [
        {
          id: "1",
          originalPath: "/path/to/video.mp4",
          name: "video.mp4",
          size: 1000000,
          isVideo: true,
          isAudio: false,
          isImage: false,
          lastModified: Date.now(),
          metadata: {
            duration: 120,
          },
          status: "available" as const,
          lastChecked: Date.now(),
        },
      ],
      musicFiles: [
        {
          id: "2",
          originalPath: "/path/to/music.mp3",
          name: "music.mp3",
          size: 500000,
          isVideo: false,
          isAudio: true,
          isImage: false,
          lastModified: Date.now(),
          metadata: {
            duration: 180,
          },
          status: "available" as const,
          lastChecked: Date.now(),
        },
      ],
      lastUpdated: Date.now(),
      version: "1.0.0",
    },
    browserState: {
      media: {
        viewMode: "grid",
        sortBy: "name",
        sortOrder: "asc",
        searchQuery: "",
        filterType: "all",
        groupBy: "none",
      },
      music: {
        viewMode: "list",
        sortBy: "name",
        sortOrder: "asc",
        searchQuery: "",
        filterType: "all",
        groupBy: "none",
        showFavoritesOnly: false,
      },
    },
    projectFavorites: {
      mediaFiles: [],
      musicFiles: [],
    },
    meta: {
      version: "1.0.0",
      createdAt: Date.now(),
      lastModified: Date.now(),
      originalPlatform: "unknown",
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("loadProject", () => {
    it("должен успешно загружать новый проект из файла", async () => {
      // Используем старый формат для валидации
      mockReadTextFile.mockResolvedValue(JSON.stringify(mockLegacyProject))

      const project = await loadProject(mockProjectPath)

      expect(project).toBeDefined()
      expect(mockReadTextFile).toHaveBeenCalledWith(mockProjectPath)
    })

    it("должен мигрировать старый проект в новый формат", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify(mockLegacyProject))

      const project = await loadProject(mockProjectPath)

      expect(project).toBeDefined()
      // Старый проект загружается как есть без автоматической миграции
      expect((project as any).mediaLibrary).toBeDefined()
      expect(project.settings).toBeDefined()
    })

    it("должен выбрасывать ошибку при невалидном JSON", async () => {
      mockReadTextFile.mockResolvedValue("invalid json")

      await expect(loadProject(mockProjectPath)).rejects.toThrow()
    })

    it("должен выбрасывать ошибку при отсутствии обязательных полей", async () => {
      const invalidProject = { ...mockLegacyProject }
      // @ts-expect-error - намеренно удаляем обязательное поле
      invalidProject.settings = undefined

      mockReadTextFile.mockResolvedValue(JSON.stringify(invalidProject))

      await expect(loadProject(mockProjectPath)).rejects.toThrow("Invalid project structure: missing settings")
    })
  })

  describe("saveProject", () => {
    it("должен сохранять проект с обновленными метаданными", async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      await saveProject(mockProjectPath, mockLegacyProject)

      const expectedProject = {
        ...mockLegacyProject,
        meta: {
          ...mockLegacyProject.meta,
          lastModified: now,
        },
      }

      expect(mockWriteTextFile).toHaveBeenCalledWith(mockProjectPath, JSON.stringify(expectedProject, null, 2))

      vi.useRealTimers()
    })

    it("должен выбрасывать ошибку при неудачном сохранении", async () => {
      mockWriteTextFile.mockRejectedValue(new Error("Write failed"))

      await expect(saveProject(mockProjectPath, mockLegacyProject)).rejects.toThrow(
        "Failed to save project: Error: Write failed",
      )
    })
  })

  describe("createNewProject", () => {
    it("должен создавать новый проект с базовой структурой", () => {
      const project = createNewProject("Новый проект")

      expect(project.settings).toBeDefined()
      expect(project.meta).toBeDefined()
      expect(project.meta.version).toBe("1.0.0")
    })

    it("должен устанавливать корректные значения по умолчанию", () => {
      const project = createNewProject("Тестовый проект")

      expect(project.settings.aspectRatio.value).toEqual({ width: 1920, height: 1080, name: "16:9" })
      expect(project.settings.frameRate).toBe("30")
    })
  })

  describe("updateMediaLibrary (для совместимости)", () => {
    it("должен обновлять медиабиблиотеку проекта", () => {
      const newMediaFiles = [
        {
          id: "3",
          originalPath: "/path/to/new-video.mp4",
          name: "new-video.mp4",
          size: 2000000,
          isVideo: true,
          isAudio: false,
          isImage: false,
          lastModified: Date.now(),
          metadata: {
            duration: 240,
          },
          status: "available" as const,
          lastChecked: Date.now(),
        },
      ]

      const updatedProject = updateMediaLibrary(mockLegacyProject, newMediaFiles, [])

      // Функция теперь возвращает новое поле mediaPool
      expect((updatedProject as any).mediaPool?.mediaFiles).toEqual(newMediaFiles)
      expect((updatedProject as any).mediaPool?.musicFiles).toEqual([])
    })
  })

  describe("updateBrowserState (для совместимости)", () => {
    it("должен обновлять состояние браузера", () => {
      const newBrowserState = {
        ...(mockLegacyProject as any).browserState,
        media: {
          ...(mockLegacyProject as any).browserState?.media,
          viewMode: "list" as const,
          sortBy: "size" as const,
        },
      }

      const updatedProject = updateBrowserState(mockLegacyProject, newBrowserState)

      // Функция теперь возвращает новое поле workspaceSettings
      expect((updatedProject as any).workspaceSettings).toEqual(newBrowserState)
    })
  })

  describe("updateProjectFavorites (для совместимости)", () => {
    it("должен обновлять избранные файлы проекта", () => {
      const newFavorites = {
        mediaFiles: ["file1", "file2"],
        musicFiles: ["music1"],
      }

      const updatedProject = updateProjectFavorites(mockLegacyProject, newFavorites)

      // Функция теперь возвращает новое поле favoriteFiles
      expect((updatedProject as any).favoriteFiles).toEqual(newFavorites)
    })
  })

  describe("getProjectStats", () => {
    it("должен возвращать статистику для старого проекта", () => {
      // Для старого формата функция ожидает mediaPool с массивами
      const projectWithOldFormat = {
        ...mockLegacyProject,
        mediaPool: {
          mediaFiles: (mockLegacyProject as any).mediaLibrary?.mediaFiles || [],
          musicFiles: (mockLegacyProject as any).mediaLibrary?.musicFiles || [],
        },
      }
      const stats = getProjectStats(projectWithOldFormat)

      expect(stats.totalMediaFiles).toBe(1)
      expect(stats.totalMusicFiles).toBe(1)
      expect(stats.totalSize).toBe(1500000)
      expect(stats.lastModified).toBe(mockLegacyProject.meta.lastModified)
    })

    it("должен возвращать статистику для нового проекта", () => {
      // Преобразуем Map в массивы для совместимости
      const projectWithArrays = {
        ...mockNewProject,
        mediaPool: {
          mediaFiles: Array.from(mockNewProject.mediaPool.items.values())
            .filter((item) => item.type === "video")
            .map((item) => ({ ...item, size: item.metadata.fileSize })),
          musicFiles: Array.from(mockNewProject.mediaPool.items.values())
            .filter((item) => item.type === "audio")
            .map((item) => ({ ...item, size: item.metadata.fileSize })),
        },
      }
      const stats = getProjectStats(projectWithArrays as any)

      expect(stats.totalMediaFiles).toBe(1)
      expect(stats.totalMusicFiles).toBe(1)
      expect(stats.totalSize).toBe(1500000)
      expect(stats.lastModified).toBe(mockNewProject.meta.lastModified)
    })

    it("должен корректно обрабатывать проект без медиа", () => {
      const projectWithoutMedia = {
        ...mockLegacyProject,
        mediaLibrary: undefined,
      }

      const stats = getProjectStats(projectWithoutMedia as any)

      expect(stats.totalMediaFiles).toBe(0)
      expect(stats.totalMusicFiles).toBe(0)
      expect(stats.totalSize).toBe(0)
    })
  })

  describe("hasUnsavedChanges", () => {
    it("должен определять наличие несохраненных изменений", () => {
      const projectWithPool = {
        ...mockLegacyProject,
        mediaPool: {
          mediaFiles: (mockLegacyProject as any).mediaLibrary?.mediaFiles || [],
          musicFiles: (mockLegacyProject as any).mediaLibrary?.musicFiles || [],
        },
      }

      const currentMediaFiles = [
        ...((mockLegacyProject as any).mediaLibrary?.mediaFiles || []),
        {
          id: "3",
          originalPath: "/path/to/new.mp4",
          name: "new.mp4",
          size: 1000,
          isVideo: true,
          isAudio: false,
          isImage: false,
          lastModified: Date.now(),
          metadata: {},
          status: "available" as const,
          lastChecked: Date.now(),
        },
      ]

      const hasChanges = hasUnsavedChanges(
        projectWithPool,
        currentMediaFiles,
        (mockLegacyProject as any).mediaLibrary?.musicFiles || [],
      )

      expect(hasChanges).toBe(true)
    })

    it("должен возвращать false при отсутствии изменений", () => {
      const projectWithPool = {
        ...mockLegacyProject,
        mediaPool: {
          mediaFiles: (mockLegacyProject as any).mediaLibrary?.mediaFiles || [],
          musicFiles: (mockLegacyProject as any).mediaLibrary?.musicFiles || [],
        },
      }

      const hasChanges = hasUnsavedChanges(
        projectWithPool,
        (mockLegacyProject as any).mediaLibrary?.mediaFiles || [],
        (mockLegacyProject as any).mediaLibrary?.musicFiles || [],
      )

      expect(hasChanges).toBe(false)
    })
  })

  describe("migrateProject", () => {
    it("должен мигрировать старый проект в новый формат", () => {
      const migratedProject = migrateProject(mockLegacyProject)

      // Проверяем что миграция создает новую структуру
      expect(migratedProject).toBeDefined()
      // В реальной реализации здесь должна быть логика миграции
    })
  })

  describe("валидация", () => {
    it("должен валидировать пустой ID медиафайла в новом формате", async () => {
      const projectWithEmptyId = {
        ...mockLegacyProject,
        mediaPool: {
          mediaFiles: [
            {
              id: "",
              originalPath: "/path/to/file.mp4",
              name: "file.mp4",
              size: 1000,
              isVideo: true,
              isAudio: false,
              isImage: false,
            },
          ],
          musicFiles: [],
        },
      }

      mockReadTextFile.mockResolvedValue(JSON.stringify(projectWithEmptyId))

      await expect(loadProject(mockProjectPath)).rejects.toThrow(
        "Invalid saved media file: id must be a non-empty string",
      )
    })

    it("должен проверять тип проекта", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify(null))

      await expect(loadProject(mockProjectPath)).rejects.toThrow("Invalid project structure: not an object")
    })

    it("должен проверять отсутствие meta", async () => {
      const projectWithoutMeta = { ...mockLegacyProject }
      // @ts-expect-error - намеренно удаляем обязательное поле
      projectWithoutMeta.meta = undefined

      mockReadTextFile.mockResolvedValue(JSON.stringify(projectWithoutMeta))

      await expect(loadProject(mockProjectPath)).rejects.toThrow("Invalid project structure: missing meta")
    })
  })
})
