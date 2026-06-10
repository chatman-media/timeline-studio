import { vi } from "vitest"
import type { Section, Timeline } from "@timeline-studio/core/types/timeline"
import {
  createTimelineClip,
  createTimelineProject,
  createTimelineSection,
  createTimelineTrack,
} from "@/domains/video-editing/utils/timeline-factories"
import type { TimelineClip, TimelineTrack, TrackType } from "../types"

type EventListener = (...args: any[]) => void

export class MockTimelineService {
  private project: Timeline
  private listeners = new Map<string, Set<EventListener>>()

  constructor(initialProject?: Timeline) {
    this.project = initialProject || this.createDefaultProject()
  }

  private createDefaultProject(): Timeline {
    const project = createTimelineProject("Test Project")

    // Add default section with tracks
    const section = createTimelineSection("Main", 0, 0)
    section.tracks = [
      createTimelineTrack("Video 1", "video", section.id),
      createTimelineTrack("Audio 1", "audio", section.id),
    ]
    project.sections = [section]

    return project
  }

  // Project management
  createProject = vi.fn((name = "New Project") => {
    this.project = createTimelineProject(name)

    // Add default section
    const section = createTimelineSection("Main", 0, 0)
    section.tracks = [
      createTimelineTrack("Video 1", "video", section.id),
      createTimelineTrack("Audio 1", "audio", section.id),
    ]
    this.project.sections = [section]

    this.emit("projectCreated", this.project)
    return this.project
  })

  saveProject = vi.fn((project: Timeline) => {
    this.project = project
    this.emit("projectSaved", this.project)
    return Promise.resolve()
  })

  loadProject = vi.fn((_path: string) => {
    this.emit("projectLoaded", this.project)
    return Promise.resolve(this.project)
  })

  // Section management
  addSection = vi.fn((name: string, startTime: number, duration: number) => {
    const section = createTimelineSection(name, startTime, duration, undefined, this.project.sections.length)

    // Add default tracks to section
    section.tracks = [
      createTimelineTrack("Video 1", "video", section.id),
      createTimelineTrack("Audio 1", "audio", section.id),
    ]

    this.project.sections.push(section)
    this.updateProjectDuration()
    this.emit("sectionAdded", section)
    return section
  })

  // Track management
  addTrack = vi.fn((type: TrackType, sectionId?: string, index?: number) => {
    let targetTracks: TimelineTrack[]
    let section: Section | undefined

    if (sectionId) {
      section = this.project.sections.find((s) => s.id === sectionId)
      if (!section) {
        throw new Error(`Section ${sectionId} not found`)
      }
      targetTracks = section.tracks
    } else {
      targetTracks = this.project.globalTracks
    }

    const existingTracksOfType = targetTracks.filter((t) => t.type === type)
    const trackNumber = existingTracksOfType.length + 1
    const trackName = `${type === "video" ? "Video" : type === "audio" ? "Audio" : "Text"} ${trackNumber}`

    const track = createTimelineTrack(trackName, type, sectionId)
    track.order = index ?? targetTracks.length

    if (index !== undefined) {
      targetTracks.splice(index, 0, track)
      // Update order for tracks after insertion
      targetTracks.forEach((t, i) => {
        t.order = i
      })
    } else {
      targetTracks.push(track)
    }

    this.emit("trackAdded", { track, sectionId })
    return track
  })

  removeTrack = vi.fn((trackId: string) => {
    // Check sections
    for (const section of this.project.sections) {
      const index = section.tracks.findIndex((t) => t.id === trackId)
      if (index >= 0) {
        const [removed] = section.tracks.splice(index, 1)
        section.tracks.forEach((t, i) => {
          t.order = i
        })
        this.emit("trackRemoved", removed)
        return true
      }
    }

    // Check global tracks
    const globalIndex = this.project.globalTracks.findIndex((t) => t.id === trackId)
    if (globalIndex >= 0) {
      const [removed] = this.project.globalTracks.splice(globalIndex, 1)
      this.project.globalTracks.forEach((t, i) => {
        t.order = i
      })
      this.emit("trackRemoved", removed)
      return true
    }

    return false
  })

  // Clip management
  addClip = vi.fn((trackId: string, mediaFile: any, position?: number) => {
    const track = this.findTrackById(trackId)
    if (!track) {
      throw new Error(`Track ${trackId} not found`)
    }

    const clip = createTimelineClip(mediaFile.id, trackId, position ?? 0, mediaFile.duration ?? 10, 0)

    track.clips.push(clip)
    track.clips.sort((a, b) => a.startTime - b.startTime)

    this.updateProjectDuration()
    this.emit("clipAdded", { trackId, clip })
    return clip
  })

  removeClip = vi.fn((trackId: string, clipId: string) => {
    const track = this.findTrackById(trackId)
    if (!track) return false

    const index = track.clips.findIndex((c) => c.id === clipId)
    if (index >= 0) {
      const [removed] = track.clips.splice(index, 1)
      this.updateProjectDuration()
      this.emit("clipRemoved", { trackId, clip: removed })
      return true
    }
    return false
  })

  moveClip = vi.fn((trackId: string, clipId: string, newStartTime: number) => {
    const track = this.findTrackById(trackId)
    if (!track) return false

    const clip = track.clips.find((c) => c.id === clipId)
    if (!clip) return false

    clip.startTime = newStartTime

    track.clips.sort((a, b) => a.startTime - b.startTime)
    this.updateProjectDuration()
    this.emit("clipMoved", { trackId, clip })
    return true
  })

  // Utility methods
  getProject = vi.fn(() => this.project)

  getSection = vi.fn((sectionId: string) => this.project.sections.find((s) => s.id === sectionId))

  getTrack = vi.fn((trackId: string) => this.findTrackById(trackId))

  getClip = vi.fn((trackId: string, clipId: string) => {
    const track = this.findTrackById(trackId)
    return track?.clips.find((c) => c.id === clipId)
  })

  private findTrackById(trackId: string): TimelineTrack | undefined {
    // Search in sections
    for (const section of this.project.sections) {
      const track = section.tracks.find((t) => t.id === trackId)
      if (track) return track
    }

    // Search in global tracks
    return this.project.globalTracks.find((t) => t.id === trackId)
  }

  private updateProjectDuration() {
    let maxEndTime = 0

    // Check all sections
    for (const section of this.project.sections) {
      for (const track of section.tracks) {
        for (const clip of track.clips) {
          const clipEndTime = clip.startTime + clip.duration
          maxEndTime = Math.max(maxEndTime, clipEndTime)
        }
      }
      // Update section duration
      if (section.tracks.length > 0) {
        const sectionEnd = Math.max(
          ...section.tracks
            .flatMap((t) => t.clips.map((c) => c.startTime + c.duration))
            .filter((t) => !Number.isNaN(t)),
        )
        section.duration = Math.max(0, sectionEnd - section.startTime)
        section.endTime = section.startTime + section.duration
      }
    }

    // Check global tracks
    for (const track of this.project.globalTracks) {
      for (const clip of track.clips) {
        const clipEndTime = clip.startTime + clip.duration
        maxEndTime = Math.max(maxEndTime, clipEndTime)
      }
    }

    this.project.duration = maxEndTime
  }

  // Event emitter for testing
  on(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  off(event: string, listener: EventListener) {
    this.listeners.get(event)?.delete(listener)
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((listener) => listener(data))
  }

  // Test helpers
  reset() {
    this.project = this.createDefaultProject()
    this.listeners.clear()
    vi.clearAllMocks()
  }

  setProject(project: Timeline) {
    this.project = project
  }

  // Helper to get all tracks across sections and global
  getAllTracks(): TimelineTrack[] {
    const sectionTracks = this.project.sections.flatMap((s) => s.tracks)
    return [...sectionTracks, ...this.project.globalTracks]
  }

  // Helper to get all clips across all tracks
  getAllClips(): TimelineClip[] {
    return this.getAllTracks().flatMap((t) => t.clips)
  }
}

// Export singleton instance for easy use
export const mockTimelineService = new MockTimelineService()

// Export mock provider value
export const mockTimelineProvider = {
  service: mockTimelineService,
  project: mockTimelineService.getProject(),
  selection: {
    selectedClips: [] as string[],
    selectedTracks: [] as string[],
  },
  playhead: {
    position: 0,
    isPlaying: false,
  },
}
