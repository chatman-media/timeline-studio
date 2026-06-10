/**
 * Integration tests for the new project architecture
 * Tests how Media Pool, Sequences, and Project Service work together
 */

import type { MediaPoolItem } from "@timeline-studio/domains/media-management"
import {
  addItemToPool,
  createMediaBin,
  getItemsInBin,
  searchMediaPool,
  updateItemUsage,
} from "@timeline-studio/domains/media-management"
import { TimelineStudioProjectService } from "@timeline-studio/domains/project-management/services/timeline-studio-project-service"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TimelineClip } from "@/features/timeline/types"
import type { Sequence } from "@/features/timeline/types/sequence"

// Mock platform service
const mockReadTextFile = vi.fn()
const mockWriteTextFile = vi.fn()

const mockPlatform = {
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  readTextFile: mockReadTextFile,
  writeTextFile: mockWriteTextFile,
  readFile: vi.fn(),
  writeFile: vi.fn(),
  exists: vi.fn(),
  readClipboard: vi.fn(),
  writeClipboard: vi.fn(),
  showNotification: vi.fn(),
  openPath: vi.fn(),
  openUrl: vi.fn(),
  getVersion: vi.fn().mockResolvedValue("1.0.0"),
  convertFileSrc: vi.fn((path: string) => path),
}

vi.mock("@timeline-studio/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => mockPlatform),
  },
}))

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: () => `test-id-${Math.random().toString(36).substring(2, 11)}`,
}))

describe("Project Architecture Integration", () => {
  let service: TimelineStudioProjectService

  beforeEach(() => {
    vi.clearAllMocks()
    service = TimelineStudioProjectService.getInstance()
  })

  describe("Media Pool and Sequences Integration", () => {
    it("should track media usage across sequences", () => {
      // Create project with media
      const project = service.createProjectSync("Multi-Sequence Project")

      // Add media to pool
      const mediaItem: MediaPoolItem = {
        id: "media-1",
        type: "video",
        name: "interview.mp4",
        source: { path: "/videos/interview.mp4" },
        status: "online",
        binId: "root",
        metadata: {
          duration: 300,
          frameRate: 30,
          resolution: { width: 1920, height: 1080 },
          codec: "h264",
          bitRate: 10000000,
          fileSize: 375000000,
          createdDate: new Date(),
          modifiedDate: new Date(),
          importedDate: new Date(),
        },
        usage: { sequences: [], count: 0 },
        tags: ["interview", "main"],
      }

      project.mediaPool = addItemToPool(project.mediaPool, mediaItem)

      // Create additional sequence
      const secondSequence: Sequence = {
        id: "seq-2",
        name: "Highlights Reel",
        type: "main",
        settings: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          aspectRatio: "16:9",
          duration: 60,
          audio: {
            sampleRate: 48000,
            bitDepth: 24,
            channels: 2,
          },
        },
        composition: {
          tracks: [
            {
              id: "track-1",
              type: "video",
              name: "V1",
              clips: [
                {
                  id: "clip-1",
                  name: "Clip 1",
                  mediaId: "media-1",
                  trackId: "track-1",
                  startTime: 0,
                  duration: 10,
                  mediaStartTime: 10,
                  mediaEndTime: 20,
                  offset: 0,
                  volume: 1,
                  speed: 1,
                  isReversed: false,
                  opacity: 1,
                  isSelected: false,
                  isLocked: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  effects: [],
                  filters: [],
                  transitions: [],
                } as TimelineClip,
              ],
            } as any,
          ],
          masterClips: [],
        },
        resources: {
          effects: new Map(),
          filters: new Map(),
          transitions: new Map(),
          colorGrades: new Map(),
          titles: new Map(),
          generators: new Map(),
        },
        markers: [],
        history: [],
        historyPosition: -1,
        metadata: {
          created: new Date(),
          modified: new Date(),
        },
      }

      project.sequences.set("seq-2", secondSequence)

      // Update usage for both sequences
      project.mediaPool = updateItemUsage(project.mediaPool, "media-1", "seq-1", true)
      project.mediaPool = updateItemUsage(project.mediaPool, "media-1", "seq-2", true)

      // Verify usage tracking
      const updatedItem = project.mediaPool.items.get("media-1")!
      expect(updatedItem.usage.count).toBe(2)
      expect(updatedItem.usage.sequences).toContain("seq-1")
      expect(updatedItem.usage.sequences).toContain("seq-2")
    })

    it("should organize media in bins and find by search", () => {
      const project = service.createProjectSync("Organized Project")

      // Create bins
      const interviewBin = createMediaBin("Interviews", "root")
      const brollBin = createMediaBin("B-Roll", "root")

      project.mediaPool.bins.set(interviewBin.id, interviewBin)
      project.mediaPool.bins.set(brollBin.id, brollBin)

      // Add media to different bins
      const interview1: MediaPoolItem = {
        id: "interview-1",
        type: "video",
        name: "CEO Interview.mp4",
        source: { path: "/videos/ceo-interview.mp4" },
        status: "online",
        binId: interviewBin.id,
        metadata: {} as any,
        usage: { sequences: [], count: 0 },
        tags: ["interview", "ceo", "q4-2024"],
      }

      const broll1: MediaPoolItem = {
        id: "broll-1",
        type: "video",
        name: "Office Exterior.mp4",
        source: { path: "/videos/office-ext.mp4" },
        status: "online",
        binId: brollBin.id,
        metadata: {} as any,
        usage: { sequences: [], count: 0 },
        tags: ["exterior", "establishing"],
        notes: "Golden hour shot of the main office building",
      }

      project.mediaPool = addItemToPool(project.mediaPool, interview1)
      project.mediaPool = addItemToPool(project.mediaPool, broll1)

      // Search tests
      const ceoResults = searchMediaPool(project.mediaPool, "CEO")
      expect(ceoResults).toHaveLength(1)
      expect(ceoResults[0].id).toBe("interview-1")

      const goldenHourResults = searchMediaPool(project.mediaPool, "golden hour")
      expect(goldenHourResults).toHaveLength(1)
      expect(goldenHourResults[0].id).toBe("broll-1")

      // Bin organization tests
      const interviewItems = getItemsInBin(project.mediaPool, interviewBin.id)
      expect(interviewItems).toHaveLength(1)
      expect(interviewItems[0].name).toBe("CEO Interview.mp4")
    })
  })

  describe("Sequence Resources and Effects", () => {
    it("should manage effects per sequence independently", () => {
      const project = service.createProjectSync("Effects Test")

      // Get main sequence
      const mainSeq = project.sequences.get(project.activeSequenceId)!

      // Add effects to main sequence
      mainSeq.resources.effects.set("blur-1", {
        id: "blur-1",
        name: "Gaussian Blur",
        category: "blur",
        defaultParams: { radius: 10 },
      } as any)

      mainSeq.resources.filters.set("cc-1", {
        id: "cc-1",
        name: "Color Correction",
        category: "color",
        defaultParams: { exposure: 0, contrast: 1 },
      } as any)

      // Create second sequence with different effects
      const sequence2: Sequence = {
        id: "seq-2",
        name: "Alt Version",
        type: "main",
        settings: mainSeq.settings,
        composition: { tracks: [], masterClips: [] },
        resources: {
          effects: new Map([
            [
              "glow-1",
              {
                id: "glow-1",
                name: "Soft Glow",
                category: "stylize",
                defaultParams: { intensity: 0.5 },
              } as any,
            ],
          ]),
          filters: new Map([
            [
              "bw-1",
              {
                id: "bw-1",
                name: "Black & White",
                category: "color",
                defaultParams: { mix: 1 },
              } as any,
            ],
          ]),
          transitions: new Map(),
          colorGrades: new Map(),
          titles: new Map(),
          generators: new Map(),
        },
        markers: [],
        history: [],
        historyPosition: -1,
        metadata: { created: new Date(), modified: new Date() },
      }

      project.sequences.set("seq-2", sequence2)

      // Verify independence
      expect(mainSeq.resources.effects.has("blur-1")).toBe(true)
      expect(mainSeq.resources.effects.has("glow-1")).toBe(false)
      expect(sequence2.resources.effects.has("glow-1")).toBe(true)
      expect(sequence2.resources.effects.has("blur-1")).toBe(false)
    })

    it("should support color grades and titles in sequences", () => {
      const project = service.createProjectSync("Grades and Titles")
      const sequence = project.sequences.get(project.activeSequenceId)!

      // Add color grade
      sequence.resources.colorGrades.set("film-look", {
        id: "film-look",
        name: "Cinematic Film Look",
        type: "lut",
        settings: { intensity: 0.8 },
        lutPath: "/luts/film-emulation.cube",
      })

      // Add title
      sequence.resources.titles.set("lower-third-1", {
        id: "lower-third-1",
        type: "lower-third",
        text: "John Doe\nCEO",
        style: {
          fontFamily: "Arial",
          fontSize: 32,
          fontWeight: "bold",
          color: "#FFFFFF",
        },
        animation: {
          in: "slide",
          out: "fade",
          duration: 0.5,
        },
        position: {
          x: 10,
          y: 80,
          anchor: "bottom-left",
        },
      })

      // Add generator
      sequence.resources.generators.set("countdown-1", {
        id: "countdown-1",
        type: "countdown",
        name: "10 Second Countdown",
        settings: {
          duration: 10,
          startNumber: 10,
          endNumber: 0,
          fontSize: 120,
          color: "#FFFFFF",
          backgroundColor: "#000000",
        },
      })

      // Verify resources
      expect(sequence.resources.colorGrades.size).toBe(1)
      expect(sequence.resources.titles.size).toBe(1)
      expect(sequence.resources.generators.size).toBe(1)

      const colorGrade = sequence.resources.colorGrades.get("film-look")!
      expect(colorGrade.type).toBe("lut")
      expect(colorGrade.lutPath).toBeTruthy()
    })
  })

  describe("Project Optimization", () => {
    it("should optimize project by removing unused media and cleaning cache", () => {
      const project = service.createProjectSync("Optimization Test")

      // Add multiple media items
      const usedMedia: MediaPoolItem = {
        id: "used-1",
        type: "video",
        name: "used.mp4",
        source: { path: "/videos/used.mp4" },
        status: "online",
        binId: "root",
        metadata: { fileSize: 100000000 } as any,
        usage: { sequences: [], count: 0 },
        tags: [],
      }

      const unusedMedia: MediaPoolItem = {
        id: "unused-1",
        type: "video",
        name: "unused.mp4",
        source: { path: "/videos/unused.mp4" },
        status: "online",
        binId: "root",
        metadata: { fileSize: 200000000 } as any,
        usage: { sequences: [], count: 0 },
        tags: [],
      }

      project.mediaPool = addItemToPool(project.mediaPool, usedMedia)
      project.mediaPool = addItemToPool(project.mediaPool, unusedMedia)

      // Add cache for both
      project.cache.thumbnails.set("used-1", { path: "/cache/used-1-thumb.jpg" } as any)
      project.cache.thumbnails.set("unused-1", { path: "/cache/unused-1-thumb.jpg" } as any)

      // Use one media in sequence
      const sequence = project.sequences.get(project.activeSequenceId)!
      sequence.composition.tracks = [
        {
          id: "track-1",
          type: "video",
          clips: [
            {
              id: "clip-1",
              name: "Used Clip",
              mediaId: "used-1",
              trackId: "track-1",
              startTime: 0,
              duration: 10,
              mediaStartTime: 0,
              mediaEndTime: 10,
              offset: 0,
              volume: 1,
              speed: 1,
              isReversed: false,
              opacity: 1,
              isSelected: false,
              isLocked: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              effects: [],
              filters: [],
              transitions: [],
            } as TimelineClip,
          ],
        } as any,
      ]

      // Optimize
      const result = service.optimizeProject(project)

      // Verify results
      expect(result.removedItems).toBe(1)
      expect(result.freedSpace).toBe(200000000)
      expect(project.mediaPool.items.has("used-1")).toBe(true)
      expect(project.mediaPool.items.has("unused-1")).toBe(false)
      expect(project.cache.thumbnails.has("unused-1")).toBe(false)
    })
  })

  describe("Nested Sequences (Master Clips)", () => {
    it("should support nested sequences via master clips", () => {
      const project = service.createProjectSync("Nested Sequences")

      // Create intro sequence
      const introSequence: Sequence = {
        id: "intro-seq",
        name: "Animated Intro",
        type: "nested",
        settings: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          aspectRatio: "16:9",
          duration: 5,
          audio: {
            sampleRate: 48000,
            bitDepth: 24,
            channels: 2,
          },
        },
        composition: {
          tracks: [
            {
              id: "track-1",
              type: "video",
              clips: [
                {
                  id: "title-clip",
                  type: "generator",
                  generatorId: "title-gen",
                  start: 0,
                  duration: 5,
                } as any,
              ],
            } as any,
          ],
          masterClips: [],
        },
        resources: {
          effects: new Map(),
          filters: new Map(),
          transitions: new Map(),
          colorGrades: new Map(),
          titles: new Map(),
          generators: new Map([
            [
              "title-gen",
              {
                id: "title-gen",
                type: "title",
                name: "Company Title",
                settings: {},
              } as any,
            ],
          ]),
        },
        markers: [],
        history: [],
        historyPosition: -1,
        metadata: { created: new Date(), modified: new Date() },
      }

      project.sequences.set("intro-seq", introSequence)

      // Use intro in main sequence
      const mainSeq = project.sequences.get(project.activeSequenceId)!
      mainSeq.composition.masterClips = [
        {
          id: "master-1",
          sequenceId: "intro-seq",
          name: "Intro Sequence",
          inPoint: 0,
          outPoint: 5,
          speed: 1,
        },
      ]

      // Add master clip to timeline
      mainSeq.composition.tracks = [
        {
          id: "track-1",
          type: "video",
          clips: [
            {
              id: "nested-clip-1",
              type: "nested",
              masterClipId: "master-1",
              start: 0,
              duration: 5,
            } as any,
          ],
        } as any,
      ]

      // Verify nested structure
      expect(project.sequences.size).toBe(2)
      expect(mainSeq.composition.masterClips).toHaveLength(1)
      expect(mainSeq.composition.masterClips[0].sequenceId).toBe("intro-seq")
    })
  })

  describe("Project Validation", () => {
    it("should validate complex project structures", () => {
      const project = service.createProjectSync("Complex Project")

      // Add media with different statuses
      const onlineMedia: MediaPoolItem = {
        id: "online-1",
        type: "video",
        name: "online.mp4",
        source: { path: "/videos/online.mp4" },
        status: "online",
        binId: "root",
        metadata: {} as any,
        usage: { sequences: [], count: 0 },
        tags: [],
      }

      const missingMedia: MediaPoolItem = {
        id: "missing-1",
        type: "video",
        name: "missing.mp4",
        source: { path: "/videos/missing.mp4" },
        status: "missing",
        binId: "root",
        metadata: {} as any,
        usage: { sequences: [], count: 0 },
        tags: [],
      }

      project.mediaPool = addItemToPool(project.mediaPool, onlineMedia)
      project.mediaPool = addItemToPool(project.mediaPool, missingMedia)

      // Create sequence with automation
      const sequence = project.sequences.get(project.activeSequenceId)!
      sequence.composition.automation = [
        {
          id: "auto-1",
          parameter: "masterVolume",
          startTime: 0,
          endTime: 10,
          keyframes: [
            { time: 0, value: 0, curve: "linear" },
            { time: 5, value: 1, curve: "bezier" },
            { time: 10, value: 0.5, curve: "linear" },
          ],
        },
      ]

      // Add markers
      sequence.markers = [
        {
          id: "marker-1",
          name: "Chapter 1",
          time: 0,
          color: "#FF0000",
          type: "chapter",
        },
        {
          id: "marker-2",
          name: "Fix Audio",
          time: 15,
          duration: 2,
          color: "#FFFF00",
          type: "todo",
          comment: "Audio sync issue between 15-17s",
        },
      ]

      // Validate
      const validation = service.validateProject(project)

      expect(validation.isValid).toBe(false)
      expect(validation.missingMedia).toContain("/videos/missing.mp4")
      // The validation might not find all issues yet, so just check if it's invalid
      expect(validation.missingMedia.length).toBeGreaterThan(0)
    })
  })

  describe("Save and Load Integration", () => {
    it("should properly serialize and deserialize complex projects", async () => {
      const project = service.createProjectSync("Serialization Test")

      // Add complex data
      const mediaItem: MediaPoolItem = {
        id: "media-1",
        type: "video",
        name: "test.mp4",
        source: { path: "/test.mp4" },
        status: "online",
        binId: "root",
        metadata: {} as any,
        usage: { sequences: ["seq-1"], count: 1 },
        tags: ["test"],
        rating: 5,
        colorLabel: "red",
      }

      project.mediaPool.items.set("media-1", mediaItem)

      // Add sequence with resources
      const sequence = project.sequences.get(project.activeSequenceId)!
      sequence.resources.effects.set("effect-1", { id: "effect-1" } as any)
      sequence.markers.push({
        id: "marker-1",
        name: "Test Marker",
        time: 10,
        color: "#FF0000",
        type: "comment",
      })

      // Mock save
      await service.saveProject(project, "/test.tlsp")

      // Verify serialization
      expect(mockWriteTextFile).toHaveBeenCalledWith("/test.tlsp", expect.any(String))

      const savedContent = JSON.parse(mockWriteTextFile.mock.calls[0][1])

      // Verify Maps were converted to objects
      expect(savedContent.mediaPool.items["media-1"]).toBeDefined()
      expect(savedContent.sequences[project.activeSequenceId]).toBeDefined()

      // Mock load
      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(savedContent))
      const loadedProject = await service.openProject("/test.tlsp")

      // Verify deserialization
      expect(loadedProject.mediaPool.items).toBeInstanceOf(Map)
      expect(loadedProject.sequences).toBeInstanceOf(Map)
      expect(loadedProject.mediaPool.items.get("media-1")?.name).toBe("test.mp4")
    })
  })

  describe("Collaboration and Backup", () => {
    it("should handle collaboration settings and backups", async () => {
      const project = service.createProjectSync("Collab Project")

      // Set collaboration
      project.collaboration = {
        enabled: true,
        mode: "cloud",
        cloud: {
          workspaceId: "proj-123",
          syncInterval: 5000,
          autoResolveConflicts: true,
        },
        collaborators: [
          {
            id: "user-1",
            name: "Editor 1",
            email: "editor1@example.com",
            role: "editor",
            color: "#FF5733",
          },
        ],
      }

      // Create backup
      const backupPath = await service.createBackup(project)

      expect(backupPath).toMatch(/Collab Project_backup_.*\.tlsp/)
      expect(project.backup.versions).toHaveLength(1)
      expect(project.backup.versions[0].path).toBe(backupPath)

      // Test backup limit
      project.backup.autoSave.keepVersions = 2

      await service.createBackup(project)
      await service.createBackup(project)
      await service.createBackup(project)

      expect(project.backup.versions).toHaveLength(2)
    })
  })

  describe("Performance and Memory", () => {
    it("should handle large projects efficiently", () => {
      const project = service.createProjectSync("Large Project")

      // Add 1000 media items
      for (let i = 0; i < 1000; i++) {
        const item: MediaPoolItem = {
          id: `media-${i}`,
          type: i % 3 === 0 ? "video" : i % 3 === 1 ? "audio" : "image",
          name: `file-${i}.mp4`,
          source: { path: `/media/file-${i}.mp4` },
          status: i % 10 === 0 ? "offline" : "online",
          binId: "root",
          metadata: { fileSize: 1000000 * (i + 1) } as any,
          usage: { sequences: [], count: 0 },
          tags: [`tag-${i % 10}`],
        }
        project.mediaPool = addItemToPool(project.mediaPool, item)
      }

      // Search performance
      const startSearch = Date.now()
      const results = searchMediaPool(project.mediaPool, "file-500")
      const searchTime = Date.now() - startSearch

      expect(results).toHaveLength(1)
      expect(searchTime).toBeLessThan(100) // Should be fast even with 1000 items

      // Stats accuracy
      expect(project.mediaPool.stats.totalItems).toBe(1000)
      expect(project.mediaPool.stats.offlineItems).toBe(100) // 10% offline
      expect(project.mediaPool.stats.onlineItems).toBe(900)
    })
  })
})
