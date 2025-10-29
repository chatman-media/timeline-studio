import { describe, expect, it } from "vitest"
import type { PlaybackState, Project, ProjectState, UiState } from "@/types/generated/tauri-bindings"
import { transformProjectStateToTimeline } from "../project-transform"

describe("project-transform", () => {
  it("should transform backend project to timeline structure", () => {
    const backendProject: Project = {
      id: "test-project",
      metadata: {
        name: "Test Project",
        description: null,
        created_at: "2024-01-01T00:00:00Z",
        modified_at: "2024-01-01T00:00:00Z",
        file_path: null,
        is_dirty: false,
        version: "1.0.0",
      },
      timeline: {
        duration: 120,
        fps: 30,
        sample_rate: 48000,
        tracks: [
          {
            id: "track-1",
            name: "Video 1",
            track_type: "Video",
            enabled: true,
            locked: false,
            height: 100,
            clips: [
              {
                id: "clip-1",
                media_id: "media-1",
                name: "Clip 1",
                timeline_in: 0,
                timeline_out: 10,
                source_in: 0,
                source_out: 10,
                playback_rate: 1,
                enabled: true,
                effects: [],
                transitions: [],
              },
            ],
            effects: [],
            volume: 1,
            pan: 0,
          },
        ],
        markers: [],
      },
      media_pool: {
        items: {
          "media-1": {
            id: "media-1",
            path: "/path/to/video.mp4",
            name: "video.mp4",
            media_type: "Video",
            duration: 30,
            metadata: {
              format: "mp4",
              codec: "h264",
              resolution: { width: 1920, height: 1080 },
              frame_rate: 30,
              bitrate: 5000000,
              audio_channels: 2,
              sample_rate: 48000,
            },
            thumbnail: null,
            usage_count: 1,
          },
        },
      },
      settings: {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        audio_sample_rate: 48000,
        audio_channels: 2,
      },
    }

    const timeline = transformProjectStateToTimeline({
      project: backendProject,
      ui: {} as UiState,
      playback: {} as PlaybackState,
    })

    expect(timeline).toBeTruthy()
    expect(timeline?.id).toBe("test-project")
    expect(timeline?.name).toBe("Test Project")
    expect(timeline?.duration).toBe(120)
    expect(timeline?.fps).toBe(30)
    expect(timeline?.sampleRate).toBe(48000)

    // Should have one main section
    expect(timeline?.sections).toHaveLength(1)
    expect(timeline?.sections[0].id).toBe("main-section")
    expect(timeline?.sections[0].name).toBe("Main")
    expect(timeline?.sections[0].tracks).toHaveLength(1)

    // Check track transformation
    const track = timeline?.sections[0].tracks[0]
    expect(track?.id).toBe("track-1")
    expect(track?.name).toBe("Video 1")
    expect(track?.type).toBe("video")
    expect(track?.clips).toHaveLength(1)

    // Check clip transformation
    const clip = track?.clips[0]
    expect(clip?.id).toBe("clip-1")
    expect(clip?.mediaId).toBe("media-1")
    expect(clip?.startTime).toBe(0)
    expect(clip?.duration).toBe(10)

    // Check resources
    expect(timeline?.resources.media).toHaveLength(1)
    expect(timeline?.resources.media[0].id).toBe("media-1")
  })

  it("should handle null/undefined backend project", () => {
    expect(transformProjectStateToTimeline(null)).toBeNull()
    expect(transformProjectStateToTimeline(undefined)).toBeNull()
  })

  it("should handle project without timeline", () => {
    const projectWithoutTimeline = {
      id: "test",
      metadata: {} as any,
      media_pool: { items: {} },
      settings: {} as any,
    } as Project

    // @ts-expect-error - testing invalid project
    expect(
      transformProjectStateToTimeline({
        project: projectWithoutTimeline,
        ui: {} as UiState,
        playback: {} as PlaybackState,
      }),
    ).toBeNull()
  })
})
