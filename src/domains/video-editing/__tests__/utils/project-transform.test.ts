/**
 * Project Transform Tests
 *
 * Тесты для преобразования ProjectState (backend) в Timeline (frontend)
 */

import { describe, expect, it } from "vitest"
import type { ProjectState } from "@/types/generated/tauri-bindings"
import {
  createAddClipCommand,
  createMoveClipCommand,
  createProjectCommand,
  createSaveProjectCommand,
  createSelectClipsCommand,
  createTrimClipCommand,
  getTimelineSyncStats,
  isBackendSyncTimeline,
  isTimelineStale,
  transformProjectStateToTimeline,
} from "../../utils/project-transform"

describe("ProjectTransform", () => {
  describe("transformProjectStateToTimeline", () => {
    it("should return null for null project state", () => {
      const timeline = transformProjectStateToTimeline(null)
      expect(timeline).toBeNull()
    })

    it("should return null for project state without project", () => {
      const projectState: ProjectState = {
        project: null,
        ui_state: null,
        playback_state: null,
        version: 0,
      } as any

      const timeline = transformProjectStateToTimeline(projectState)
      expect(timeline).toBeNull()
    })

    it("should transform valid project state to timeline", () => {
      const projectState: ProjectState = {
        project: {
          id: "project-1",
          metadata: {
            name: "Test Project",
            description: "",
            created_at: "2025-01-01T00:00:00Z",
            modified_at: "2025-01-02T00:00:00Z",
            file_path: "/test/project.tlsp",
            is_dirty: false,
            version: "1.0.0",
          },
          timeline: {
            duration: 120,
            fps: 30,
            sample_rate: 48000,
            markers: [],
            tracks: [],
          },
          media_pool: {
            items: {},
          },
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
        ui_state: null,
        playback_state: null,
        version: 1,
      } as any

      const timeline = transformProjectStateToTimeline(projectState)

      expect(timeline).not.toBeNull()
      expect(timeline?.id).toBe("project-1")
      expect(timeline?.name).toBe("Test Project")
      expect(timeline?.duration).toBe(120)
      expect(timeline?.fps).toBe(30)
      expect(timeline?.sampleRate).toBe(48000)
      expect(timeline?.sections).toHaveLength(1)
      expect(timeline?.sections[0].name).toBe("Main")
      expect(timeline?.isBackendSync).toBe(true)
      expect(timeline?.stateVersion).toBe(1)
    })

    it("should transform tracks correctly", () => {
      const projectState: ProjectState = {
        project: {
          id: "project-1",
          metadata: {
            name: "Test Project",
            created_at: "2025-01-01T00:00:00Z",
            modified_at: "2025-01-02T00:00:00Z",
            file_path: null,
            is_dirty: false,
            version: "1.0.0",
            description: "",
          },
          timeline: {
            duration: 120,
            fps: 30,
            sample_rate: 48000,
            markers: [],
            tracks: [
              {
                id: "track-1",
                name: "Video Track 1",
                track_type: "Video",
                enabled: true,
                locked: false,
                height: 100,
                volume: 1.0,
                pan: 0,
                clips: [
                  {
                    id: "clip-1",
                    media_id: "media-1",
                    name: "Clip 1",
                    timeline_in: 0,
                    timeline_out: 10,
                    source_in: 0,
                    source_out: 10,
                    playback_rate: 1.0,
                    enabled: true,
                    effects: [],
                    transitions: [],
                  },
                ],
                effects: [],
              },
            ],
          },
          media_pool: {
            items: {
              "media-1": {
                id: "media-1",
                name: "test-video.mp4",
                path: "/test/video.mp4",
                media_type: "Video",
                duration: 60,
                size: 1024 * 1024,
              },
            },
          },
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
        ui_state: null,
        playback_state: null,
        version: 1,
      } as any

      const timeline = transformProjectStateToTimeline(projectState)

      expect(timeline).not.toBeNull()
      expect(timeline?.sections[0].tracks).toHaveLength(1)

      const track = timeline?.sections[0].tracks[0]
      expect(track?.id).toBe("track-1")
      expect(track?.name).toBe("Video Track 1")
      expect(track?.type).toBe("video")
      expect(track?.clips).toHaveLength(1)

      const clip = track?.clips[0]
      expect(clip?.id).toBe("clip-1")
      expect(clip?.mediaId).toBe("media-1")
      expect(clip?.startTime).toBe(0)
      expect(clip?.duration).toBe(10)
    })

    it("should include UI state", () => {
      const projectState: ProjectState = {
        project: {
          id: "project-1",
          metadata: {
            name: "Test",
            created_at: "2025-01-01T00:00:00Z",
            modified_at: "2025-01-01T00:00:00Z",
            file_path: null,
            is_dirty: false,
            version: "1.0.0",
            description: "",
          },
          timeline: {
            duration: 0,
            fps: 30,
            sample_rate: 48000,
            markers: [],
            tracks: [],
          },
          media_pool: { items: {} },
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
        ui_state: {
          selected_clips: ["clip-1", "clip-2"],
          selected_tracks: ["track-1"],
          timeline_zoom: 150,
          timeline_scroll: 100,
          active_tool: "select",
        },
        playback_state: null,
        version: 1,
      } as any

      const timeline = transformProjectStateToTimeline(projectState)

      expect(timeline?.uiState).toBeDefined()
      expect(timeline?.uiState?.selectedClipIds).toEqual(["clip-1", "clip-2"])
      expect(timeline?.uiState?.selectedTrackIds).toEqual(["track-1"])
      expect(timeline?.uiState?.zoom).toBe(150)
      expect(timeline?.uiState?.scroll).toBe(100)
    })

    it("should include playback state", () => {
      const projectState: ProjectState = {
        project: {
          id: "project-1",
          metadata: {
            name: "Test",
            created_at: "2025-01-01T00:00:00Z",
            modified_at: "2025-01-01T00:00:00Z",
            file_path: null,
            is_dirty: false,
            version: "1.0.0",
            description: "",
          },
          timeline: {
            duration: 120,
            fps: 30,
            sample_rate: 48000,
            markers: [],
            tracks: [],
          },
          media_pool: { items: {} },
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
        ui_state: null,
        playback_state: {
          is_playing: true,
          current_time: 45.5,
          playback_rate: 1.0,
          volume: 0.8,
        },
        version: 1,
      } as any

      const timeline = transformProjectStateToTimeline(projectState)

      expect(timeline?.playbackState).toBeDefined()
      expect(timeline?.playbackState?.isPlaying).toBe(true)
      expect(timeline?.playbackState?.currentTime).toBe(45.5)
      expect(timeline?.playbackState?.playbackRate).toBe(1.0)
      expect(timeline?.playbackState?.volume).toBe(0.8)
    })

    it("should calculate aspect ratio", () => {
      const projectState: ProjectState = {
        project: {
          id: "project-1",
          metadata: {
            name: "Test",
            created_at: "2025-01-01T00:00:00Z",
            modified_at: "2025-01-01T00:00:00Z",
            file_path: null,
            is_dirty: false,
            version: "1.0.0",
            description: "",
          },
          timeline: {
            duration: 0,
            fps: 30,
            sample_rate: 48000,
            markers: [],
            tracks: [],
          },
          media_pool: { items: {} },
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
        ui_state: null,
        playback_state: null,
        version: 1,
      } as any

      const timeline = transformProjectStateToTimeline(projectState)

      expect(timeline?.settings.aspectRatio).toBe("16:9")
    })

    it("should filter media pool to only used files", () => {
      const projectState: ProjectState = {
        project: {
          id: "project-1",
          metadata: {
            name: "Test",
            created_at: "2025-01-01T00:00:00Z",
            modified_at: "2025-01-01T00:00:00Z",
            file_path: null,
            is_dirty: false,
            version: "1.0.0",
            description: "",
          },
          timeline: {
            duration: 60,
            fps: 30,
            sample_rate: 48000,
            markers: [],
            tracks: [
              {
                id: "track-1",
                name: "Video",
                track_type: "Video",
                enabled: true,
                locked: false,
                height: 100,
                volume: 1,
                pan: 0,
                clips: [
                  {
                    id: "clip-1",
                    media_id: "media-1",
                    name: "Clip 1",
                    timeline_in: 0,
                    timeline_out: 10,
                    source_in: 0,
                    source_out: 10,
                    playback_rate: 1.0,
                    enabled: true,
                    effects: [],
                    transitions: [],
                  },
                ],
                effects: [],
              },
            ],
          },
          media_pool: {
            items: {
              "media-1": {
                id: "media-1",
                name: "used.mp4",
                path: "/test/used.mp4",
                media_type: "Video",
                duration: 60,
                size: 1024,
              },
              "media-2": {
                id: "media-2",
                name: "unused.mp4",
                path: "/test/unused.mp4",
                media_type: "Video",
                duration: 60,
                size: 1024,
              },
            },
          },
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
        ui_state: null,
        playback_state: null,
        version: 1,
      } as any

      const timeline = transformProjectStateToTimeline(projectState)

      expect(timeline?.resources.media).toHaveLength(1)
      expect(timeline?.resources.media[0].id).toBe("media-1")
    })
  })

  describe("Command Creation Helpers", () => {
    it("should create AddClip command", () => {
      const command = createAddClipCommand("track-1", "media-1", 10.5)

      expect(command.type).toBe("AddClip")
      if (command.type === "AddClip") {
        expect(command.params.track_id).toBe("track-1")
        expect(command.params.media_id).toBe("media-1")
        expect(command.params.time).toBe(10.5)
      }
    })

    it("should create MoveClip command", () => {
      const command = createMoveClipCommand("clip-1", "track-2", 15)

      expect(command.type).toBe("MoveClip")
      if (command.type === "MoveClip") {
        expect(command.params.clip_id).toBe("clip-1")
        expect(command.params.track_id).toBe("track-2")
        expect(command.params.time).toBe(15)
      }
    })

    it("should create TrimClip command", () => {
      const command = createTrimClipCommand("clip-1", 5, 20)

      expect(command.type).toBe("TrimClip")
      if (command.type === "TrimClip") {
        expect(command.params.clip_id).toBe("clip-1")
        expect(command.params.start).toBe(5)
        expect(command.params.end).toBe(20)
      }
    })

    it("should create SelectClips command without adding to selection", () => {
      const command = createSelectClipsCommand(["clip-1", "clip-2"], false)

      expect(command.type).toBe("SelectClips")
      if (command.type === "SelectClips") {
        expect(command.params.clip_ids).toEqual(["clip-1", "clip-2"])
        expect(command.params.add_to_selection).toBe(false)
      }
    })

    it("should create SelectClips command with adding to selection", () => {
      const command = createSelectClipsCommand(["clip-3"], true)

      expect(command.type).toBe("SelectClips")
      if (command.type === "SelectClips") {
        expect(command.params.clip_ids).toEqual(["clip-3"])
        expect(command.params.add_to_selection).toBe(true)
      }
    })

    it("should create CreateProject command", () => {
      const settings = {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
      }

      const command = createProjectCommand("New Project", settings)

      expect(command.type).toBe("CreateProject")
      if (command.type === "CreateProject") {
        expect(command.params.name).toBe("New Project")
        expect(command.params.settings).toEqual(settings)
      }
    })

    it("should create SaveProject command without path", () => {
      const command = createSaveProjectCommand()

      expect(command.type).toBe("SaveProject")
      if (command.type === "SaveProject") {
        expect(command.params.path).toBeNull()
      }
    })

    it("should create SaveProject command with path", () => {
      const command = createSaveProjectCommand("/test/project.tlsp")

      expect(command.type).toBe("SaveProject")
      if (command.type === "SaveProject") {
        expect(command.params.path).toBe("/test/project.tlsp")
      }
    })
  })

  describe("State Validation Helpers", () => {
    it("should identify backend sync timeline", () => {
      const timeline = {
        id: "timeline-1",
        name: "Test",
        duration: 0,
        fps: 30,
        sampleRate: 48000,
        sections: [],
        globalTracks: [],
        resources: {
          media: [],
          effects: [],
          filters: [],
          transitions: [],
          templates: [],
          subtitleStyles: [],
          music: [],
        },
        settings: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: "1.0.0",
        isBackendSync: true,
      }

      expect(isBackendSyncTimeline(timeline)).toBe(true)
    })

    it("should identify non-backend sync timeline", () => {
      const timeline = {
        id: "timeline-1",
        name: "Test",
        duration: 0,
        fps: 30,
        sampleRate: 48000,
        sections: [],
        globalTracks: [],
        resources: {
          media: [],
          effects: [],
          filters: [],
          transitions: [],
          templates: [],
          subtitleStyles: [],
          music: [],
        },
        settings: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: "1.0.0",
        isBackendSync: false,
      }

      expect(isBackendSyncTimeline(timeline)).toBe(false)
    })

    it("should detect stale timeline", () => {
      const timeline = {
        id: "timeline-1",
        name: "Test",
        duration: 0,
        fps: 30,
        sampleRate: 48000,
        sections: [],
        globalTracks: [],
        resources: {
          media: [],
          effects: [],
          filters: [],
          transitions: [],
          templates: [],
          subtitleStyles: [],
          music: [],
        },
        settings: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: "1.0.0",
        stateVersion: 5,
      }

      expect(isTimelineStale(timeline, 10)).toBe(true)
      expect(isTimelineStale(timeline, 5)).toBe(false)
    })

    it("should get timeline sync stats", () => {
      const timeline = {
        id: "timeline-1",
        name: "Test",
        duration: 0,
        fps: 30,
        sampleRate: 48000,
        sections: [],
        globalTracks: [],
        resources: {
          media: [],
          effects: [],
          filters: [],
          transitions: [],
          templates: [],
          subtitleStyles: [],
          music: [],
        },
        settings: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: "1.0.0",
        isBackendSync: true,
        stateVersion: 5,
      }

      const projectState: ProjectState = {
        project: {
          id: "project-1",
          metadata: {} as any,
          timeline: {} as any,
          media_pool: {} as any,
          settings: {} as any,
        },
        ui_state: null,
        playback_state: null,
        version: 10,
      } as any

      const stats = getTimelineSyncStats(timeline, projectState)

      expect(stats.isBackendSync).toBe(true)
      expect(stats.timelineVersion).toBe(5)
      expect(stats.backendVersion).toBe(10)
      expect(stats.isStale).toBe(true)
      expect(stats.hasProject).toBe(true)
    })

    it("should handle null project state in sync stats", () => {
      const timeline = {
        id: "timeline-1",
        name: "Test",
        duration: 0,
        fps: 30,
        sampleRate: 48000,
        sections: [],
        globalTracks: [],
        resources: {
          media: [],
          effects: [],
          filters: [],
          transitions: [],
          templates: [],
          subtitleStyles: [],
          music: [],
        },
        settings: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: "1.0.0",
        isBackendSync: true,
        stateVersion: 5,
      }

      const stats = getTimelineSyncStats(timeline, null)

      expect(stats.isStale).toBe(true)
      expect(stats.hasProject).toBe(false)
      expect(stats.backendVersion).toBe(0)
    })
  })
})
