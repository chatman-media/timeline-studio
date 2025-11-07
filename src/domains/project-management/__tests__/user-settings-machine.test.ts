/**
 * User Settings Machine Tests
 *
 * Тесты для user settings machine
 */

import { createActor } from "xstate"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { userSettingsMachine } from "../machines/user-settings-machine"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  })),
}))

describe("User Settings Machine", () => {
  let actor: ReturnType<typeof createActor<typeof userSettingsMachine>>

  beforeEach(() => {
    actor = createActor(userSettingsMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
  })

  describe("Initial State", () => {
    it("should start in idle state", () => {
      expect(actor.getSnapshot().matches("idle")).toBe(true)
    })

    it("should have default context", () => {
      const context = actor.getSnapshot().context
      expect(context.layoutMode).toBe("default")
      expect(context.activeTab).toBe("media") // DEFAULT_TAB is "media"
      expect(context.playerVolume).toBe(100)
      expect(context.isLoaded).toBe(true)
    })
  })

  describe("Layout Mode", () => {
    it("should update layout mode", () => {
      actor.send({ type: "UPDATE_LAYOUT", layoutMode: "vertical" })
      expect(actor.getSnapshot().context.layoutMode).toBe("vertical")
    })

    it("should support all layout modes", () => {
      const layouts = ["default", "options", "vertical", "chat"] as const
      layouts.forEach((layout) => {
        actor.send({ type: "UPDATE_LAYOUT", layoutMode: layout })
        expect(actor.getSnapshot().context.layoutMode).toBe(layout)
      })
    })
  })

  describe("Active Tab", () => {
    it("should update active tab", () => {
      actor.send({ type: "UPDATE_ACTIVE_TAB", tab: "audio" })
      expect(actor.getSnapshot().context.activeTab).toBe("audio")
    })
  })

  describe("API Keys", () => {
    it("should update OpenAI API key", () => {
      actor.send({ type: "UPDATE_OPENAI_API_KEY", apiKey: "test-key" })
      expect(actor.getSnapshot().context.openAiApiKey).toBe("test-key")
    })

    it("should update Claude API key", () => {
      actor.send({ type: "UPDATE_CLAUDE_API_KEY", apiKey: "test-key" })
      expect(actor.getSnapshot().context.claudeApiKey).toBe("test-key")
    })

    it("should update YouTube credentials", () => {
      actor.send({
        type: "UPDATE_YOUTUBE_CREDENTIALS",
        clientId: "youtube-id",
        clientSecret: "youtube-secret",
      })
      expect(actor.getSnapshot().context.youtubeClientId).toBe("youtube-id")
      expect(actor.getSnapshot().context.youtubeClientSecret).toBe("youtube-secret")
    })

    it("should update API key status", () => {
      actor.send({
        type: "UPDATE_API_KEY_STATUS",
        service: "openai",
        status: "valid",
      })
      expect(actor.getSnapshot().context.apiKeysStatus.openai).toBe("valid")
    })
  })

  describe("Player Settings", () => {
    it("should update player volume", () => {
      actor.send({ type: "UPDATE_PLAYER_VOLUME", volume: 50 })
      expect(actor.getSnapshot().context.playerVolume).toBe(50)
    })

    it("should update player screenshots path", () => {
      actor.send({ type: "UPDATE_PLAYER_SCREENSHOTS_PATH", path: "/custom/path" })
      expect(actor.getSnapshot().context.playerScreenshotsPath).toBe("/custom/path")
    })
  })

  describe("GPU Settings", () => {
    it("should update GPU acceleration", () => {
      actor.send({ type: "UPDATE_GPU_ACCELERATION", enabled: false })
      expect(actor.getSnapshot().context.gpuAccelerationEnabled).toBe(false)
    })

    it("should update preferred GPU encoder", () => {
      actor.send({ type: "UPDATE_PREFERRED_GPU_ENCODER", encoder: "nvidia" })
      expect(actor.getSnapshot().context.preferredGpuEncoder).toBe("nvidia")
    })

    it("should update render quality", () => {
      actor.send({ type: "UPDATE_RENDER_QUALITY", quality: "ultra" })
      expect(actor.getSnapshot().context.renderQuality).toBe("ultra")
    })
  })

  describe("Auto-save Settings", () => {
    it("should update auto-save enabled", () => {
      actor.send({ type: "UPDATE_AUTO_SAVE_ENABLED", enabled: false })
      expect(actor.getSnapshot().context.autoSaveEnabled).toBe(false)
    })

    it("should update auto-save interval", () => {
      actor.send({ type: "UPDATE_AUTO_SAVE_INTERVAL", interval: 120 })
      expect(actor.getSnapshot().context.autoSaveInterval).toBe(120)
    })
  })

  describe("AI Analysis Settings", () => {
    it("should update AI analysis enabled", () => {
      actor.send({ type: "UPDATE_AI_ANALYSIS_ENABLED", enabled: true })
      expect(actor.getSnapshot().context.aiAnalysisEnabled).toBe(true)
    })

    it("should update AI analysis frame rate", () => {
      actor.send({ type: "UPDATE_AI_ANALYSIS_FRAME_RATE", frameRate: 5 })
      expect(actor.getSnapshot().context.aiAnalysisFrameRate).toBe(5)
    })

    it("should update AI content detection types", () => {
      actor.send({
        type: "UPDATE_AI_CONTENT_DETECTION_TYPES",
        types: ["objects", "faces"],
      })
      expect(actor.getSnapshot().context.aiContentDetectionTypes).toEqual(["objects", "faces"])
    })
  })

  describe("Vision Service Settings", () => {
    it("should update vision service enabled", () => {
      actor.send({ type: "UPDATE_VISION_SERVICE_ENABLED", enabled: true })
      expect(actor.getSnapshot().context.visionServiceEnabled).toBe(true)
    })

    it("should update vision thresholds", () => {
      actor.send({
        type: "UPDATE_VISION_THRESHOLD",
        thresholdType: "object",
        value: 0.8,
      })
      expect(actor.getSnapshot().context.visionObjectDetectionThreshold).toBe(0.8)

      actor.send({
        type: "UPDATE_VISION_THRESHOLD",
        thresholdType: "face",
        value: 0.7,
      })
      expect(actor.getSnapshot().context.visionFaceDetectionThreshold).toBe(0.7)
    })
  })

  describe("Language Settings", () => {
    it("should update preferred language", () => {
      actor.send({ type: "UPDATE_PREFERRED_LANGUAGE", language: "en" })
      expect(actor.getSnapshot().context.preferredLanguage).toBe("en")
    })

    it("should update date format", () => {
      actor.send({ type: "UPDATE_DATE_FORMAT", format: "MM/DD/YYYY" })
      expect(actor.getSnapshot().context.dateFormat).toBe("MM/DD/YYYY")
    })

    it("should update time format", () => {
      actor.send({ type: "UPDATE_TIME_FORMAT", format: "12h" })
      expect(actor.getSnapshot().context.timeFormat).toBe("12h")
    })
  })

  describe("Visibility Toggles", () => {
    it("should toggle browser visibility", () => {
      const initial = actor.getSnapshot().context.isBrowserVisible
      actor.send({ type: "TOGGLE_BROWSER_VISIBILITY" })
      expect(actor.getSnapshot().context.isBrowserVisible).toBe(!initial)
    })

    it("should toggle timeline visibility", () => {
      const initial = actor.getSnapshot().context.isTimelineVisible
      actor.send({ type: "TOGGLE_TIMELINE_VISIBILITY" })
      expect(actor.getSnapshot().context.isTimelineVisible).toBe(!initial)
    })

    it("should toggle options visibility", () => {
      const initial = actor.getSnapshot().context.isOptionsVisible
      actor.send({ type: "TOGGLE_OPTIONS_VISIBILITY" })
      expect(actor.getSnapshot().context.isOptionsVisible).toBe(!initial)
    })
  })

  describe("Bulk Updates", () => {
    it("should update multiple settings at once", () => {
      actor.send({
        type: "UPDATE_ALL",
        settings: {
          layoutMode: "chat",
          playerVolume: 75,
          autoSaveEnabled: false,
        },
      })

      const context = actor.getSnapshot().context
      expect(context.layoutMode).toBe("chat")
      expect(context.playerVolume).toBe(75)
      expect(context.autoSaveEnabled).toBe(false)
    })
  })
})
