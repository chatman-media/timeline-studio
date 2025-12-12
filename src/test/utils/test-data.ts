import type { TimelineClip, TimelineTrack } from "@/features/timeline/types"

// Test data constants and utilities
export const TEST_MEDIA_FILES = {
  video: {
    id: "test-video-1",
    name: "test-video.mp4",
    path: "/test/videos/test-video.mp4",
    type: "video" as const,
    duration: 120,
    size: 50000000,
    width: 1920,
    height: 1080,
    frameRate: 30,
    createdAt: "2023-01-01T00:00:00.000Z",
    lastModified: 1672531200000,
    metadata: {
      format: "mp4",
      codec: "h264",
      bitrate: 5000000,
      channels: 2,
      sampleRate: 48000,
    },
  },

  audio: {
    id: "test-audio-1",
    name: "test-audio.mp3",
    path: "/test/audio/test-audio.mp3",
    type: "audio" as const,
    duration: 180,
    size: 5000000,
    createdAt: "2023-01-01T00:00:00.000Z",
    lastModified: 1672531200000,
    metadata: {
      format: "mp3",
      codec: "mp3",
      bitrate: 320000,
      channels: 2,
      sampleRate: 44100,
    },
  },

  image: {
    id: "test-image-1",
    name: "test-image.jpg",
    path: "/test/images/test-image.jpg",
    type: "image" as const,
    size: 2000000,
    width: 1920,
    height: 1080,
    createdAt: "2023-01-01T00:00:00.000Z",
    lastModified: 1672531200000,
    metadata: {
      format: "jpeg",
      codec: "jpeg",
      bitrate: 0,
    },
  },
}

export const TEST_TIMELINE_DATA = {
  project: {
    id: "test-project-1",
    name: "Test Project",
    sections: [],
    globalTracks: [] as TimelineTrack[],
    duration: 0,
    currentTime: 0,
    settings: {
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      aspectRatio: "16:9",
      sampleRate: 48000,
      channels: 2,
    },
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },

  track: {
    id: "test-track-1",
    type: "video" as const,
    name: "Video Track 1",
    order: 0,
    clips: [] as TimelineClip[],
    isLocked: false,
    isMuted: false,
    isHidden: false,
    isSolo: false,
    volume: 1,
    pan: 0,
    height: 60,
    trackEffects: [],
    trackFilters: [],
    transitions: [],
  } as TimelineTrack,

  clip: {
    id: "test-clip-1",
    name: "Test Clip 1",
    trackId: "test-track-1",
    mediaId: "test-video-1",
    startTime: 0,
    duration: 10,
    mediaStartTime: 0,
    mediaEndTime: 10,
    offset: 0,
    effects: [],
    transitions: [],
    filters: [],
    volume: 1,
    opacity: 1,
    speed: 1,
    isReversed: false,
    isSelected: false,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as TimelineClip,
}

export const TEST_USER_SETTINGS = {
  theme: "light",
  language: "en",
  autoSave: true,
  backupInterval: 300,
  previewQuality: "medium",
  keyboardShortcuts: "default",
  workspacePath: "/test/workspace",
}

export const TEST_PROJECT_SETTINGS = {
  videoSettings: {
    fps: 30,
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    quality: "high",
    codec: "h264",
  },
  audioSettings: {
    sampleRate: 48000,
    channels: 2,
    bitrate: 320,
    codec: "aac",
  },
  exportSettings: {
    format: "mp4",
    quality: "high",
    outputPath: "/test/exports",
  },
}

export const TEST_EFFECTS = {
  colorEffect: {
    id: "color-effect-1",
    name: "Brightness/Contrast",
    category: "color",
    type: "filter",
    parameters: {
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
      hue: 0,
    },
  },

  blurEffect: {
    id: "blur-effect-1",
    name: "Gaussian Blur",
    category: "artistic",
    type: "filter",
    parameters: {
      radius: 5,
      quality: "medium",
    },
  },
}

export const TEST_TRANSITIONS = {
  fadeTransition: {
    id: "fade-transition-1",
    name: "Fade",
    category: "dissolve",
    duration: 1.0,
    parameters: {
      easing: "ease-in-out",
    },
  },

  slideTransition: {
    id: "slide-transition-1",
    name: "Slide Left",
    category: "slide",
    duration: 0.5,
    parameters: {
      direction: "left",
      easing: "ease-out",
    },
  },
}

// Utility functions for test data manipulation
export const testUtils = {
  // Create media file variations
  createMediaVariations: (base: typeof TEST_MEDIA_FILES.video, count = 5) =>
    Array.from({ length: count }, (_, i) => ({
      ...base,
      id: `${base.id}-${i + 1}`,
      name: `${base.name.split(".")[0]}-${i + 1}.${base.name.split(".")[1]}`,
      path: base.path.replace(base.name, `${base.name.split(".")[0]}-${i + 1}.${base.name.split(".")[1]}`),
    })),

  // Create timeline with multiple tracks
  createMultiTrackTimeline: (trackCount = 3) => ({
    ...TEST_TIMELINE_DATA.project,
    globalTracks: Array.from(
      { length: trackCount },
      (_, i): TimelineTrack => ({
        ...TEST_TIMELINE_DATA.track,
        id: `test-track-${i + 1}`,
        name: `Track ${i + 1}`,
        order: i,
        type: i % 2 === 0 ? "video" : "audio",
        clips: [],
      }),
    ),
  }),

  // Create clips for a track
  createClipsForTrack: (trackId: string, clipCount = 3): TimelineClip[] =>
    Array.from({ length: clipCount }, (_, i) => ({
      ...TEST_TIMELINE_DATA.clip,
      id: `test-clip-${i + 1}`,
      name: `Test Clip ${i + 1}`,
      trackId,
      startTime: i * 10,
      duration: 10,
      mediaId: `test-media-${i + 1}`,
      offset: 0,
    })),

  // Create project with content
  createPopulatedProject: () => {
    const tracks = testUtils.createMultiTrackTimeline(4).globalTracks
    tracks.forEach((track, index) => {
      track.clips = testUtils.createClipsForTrack(track.id, 2 + index)
    })

    return {
      ...TEST_TIMELINE_DATA.project,
      globalTracks: tracks,
      duration: 60,
    }
  },

  // Create effect chain
  createEffectChain: (effectCount = 3) =>
    Array.from({ length: effectCount }, (_, i) => ({
      ...TEST_EFFECTS.colorEffect,
      id: `effect-${i + 1}`,
      name: `Effect ${i + 1}`,
      order: i,
    })),

  // Generate file paths for different platforms
  generatePaths: (baseName: string) => ({
    unix: `/home/user/videos/${baseName}`,
    windows: `C:\\Users\\User\\Videos\\${baseName}`,
    mac: `/Users/user/Movies/${baseName}`,
  }),

  // Create timestamp variations
  createTimestamps: () => {
    const now = Date.now()
    return {
      now: new Date(now).toISOString(),
      hourAgo: new Date(now - 60 * 60 * 1000).toISOString(),
      dayAgo: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      weekAgo: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  },
}

// Export commonly used test data collections
export const TEST_COLLECTIONS = {
  mediaFiles: [
    TEST_MEDIA_FILES.video,
    TEST_MEDIA_FILES.audio,
    TEST_MEDIA_FILES.image,
    ...testUtils.createMediaVariations(TEST_MEDIA_FILES.video, 3),
  ],

  effects: [TEST_EFFECTS.colorEffect, TEST_EFFECTS.blurEffect],

  transitions: [TEST_TRANSITIONS.fadeTransition, TEST_TRANSITIONS.slideTransition],
}

// Type guards for test data
export const isTestVideo = (file: any): file is typeof TEST_MEDIA_FILES.video => file && file.type === "video"

export const isTestAudio = (file: any): file is typeof TEST_MEDIA_FILES.audio => file && file.type === "audio"

export const isTestImage = (file: any): file is typeof TEST_MEDIA_FILES.image => file && file.type === "image"
