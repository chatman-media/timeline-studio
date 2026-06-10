/**
 * Тесты для Clip Effects Service
 */

import type { BaseEffect } from "@timeline-studio/domains/video-editing/types"
import { describe, expect, it } from "vitest"
import type { TimelineClip, TimelineProject, TimelineSection, TimelineTrack } from "../../types"
import {
  applyEffectToClip,
  clearEffectsFromClip,
  copyEffects,
  removeEffectFromClip,
  toggleEffectOnClip,
  updateEffectOnClip,
} from "../clip-effects-service"

// Mock эффект
const mockEffect: BaseEffect = {
  id: "test-effect",
  name: { en: "Test Effect", ru: "Тестовый эффект" },
  category: "color_correction",
  scope: ["clip"],
  processingType: "realtime",
  version: "1.0.0",
  tags: ["test"],
  complexity: "low",
  gpuAccelerated: false,
  parameters: [],
  presets: [],
  processors: {
    css: {
      filter: () => "brightness(1.2)",
    },
  },
}

// Mock проект
function createMockProject(): TimelineProject {
  const mockClip: TimelineClip = {
    id: "clip-1",
    name: "Test Clip",
    mediaId: "media-1",
    trackId: "track-1",
    startTime: 0,
    duration: 10,
    sourceIn: 0,
    sourceOut: 10,
    mediaStartTime: 0,
    mediaEndTime: 10,
    offset: 0,
    volume: 1,
    speed: 1,
    playbackRate: 1,
    isReversed: false,
    isMuted: false,
    opacity: 1,
    position: {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    effects: [],
    filters: [],
    transitions: [],
    isSelected: false,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockTrack: TimelineTrack = {
    id: "track-1",
    name: "Video Track 1",
    type: "video",
    order: 0,
    clips: [mockClip],
    transitions: [],
    muted: false,
    solo: false,
    locked: false,
    isLocked: false,
    isMuted: false,
    isHidden: false,
    isSolo: false,
    volume: 1,
    pan: 0,
    height: 100,
    expanded: false,
    trackEffects: [],
    trackFilters: [],
  }

  const mockSection: TimelineSection = {
    id: "section-1",
    index: 0,
    name: "Section 1",
    startTime: 0,
    endTime: 100,
    duration: 100,
    tracks: [mockTrack],
    isCollapsed: false,
  }

  return {
    id: "project-1",
    name: "Test Project",
    duration: 100,
    fps: 30,
    sampleRate: 48000,
    sections: [mockSection],
    globalTracks: [],
    markers: [],
    resources: {
      effects: [],
      filters: [],
      transitions: [],
      timelineTransitions: [],
      templates: [],
      styleTemplates: [],
      subtitleStyles: [],
      music: [],
      media: [],
    },
    settings: {
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      aspectRatio: "16:9",
      sampleRate: 48000,
      channels: 2,
      bitDepth: 24,
      timeFormat: "timecode",
      snapToGrid: true,
      gridSize: 1,
      autoSave: true,
      autoSaveInterval: 300,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    version: "1.0.0",
  }
}

describe("ClipEffectsService", () => {
  describe("applyEffectToClip", () => {
    it("should apply effect to clip", () => {
      const project = createMockProject()

      const updatedProject = applyEffectToClip(project, "clip-1", {
        effectId: mockEffect.id,
        effect: mockEffect,
        customParams: { intensity: 1.5 },
      })

      const clip = updatedProject.sections[0].tracks[0].clips[0]
      expect(clip.effects).toHaveLength(1)
      expect(clip.effects[0].effectId).toBe(mockEffect.id)
      expect(clip.effects[0].parameters).toEqual({ intensity: 1.5 })
    })

    it("should add effect to resources", () => {
      const project = createMockProject()

      const updatedProject = applyEffectToClip(project, "clip-1", {
        effectId: mockEffect.id,
        effect: mockEffect,
      })

      expect(updatedProject.resources.effects).toHaveLength(1)
      expect(updatedProject.resources.effects[0].id).toBe(mockEffect.id)
    })

    it("should throw error for non-existent clip", () => {
      const project = createMockProject()

      expect(() => {
        applyEffectToClip(project, "non-existent-clip", {
          effectId: mockEffect.id,
          effect: mockEffect,
        })
      }).toThrow("Clip non-existent-clip not found")
    })
  })

  describe("removeEffectFromClip", () => {
    it("should remove effect from clip", () => {
      let project = createMockProject()

      // Сначала применяем эффект
      project = applyEffectToClip(project, "clip-1", {
        effectId: mockEffect.id,
        effect: mockEffect,
      })

      const appliedEffectId = project.sections[0].tracks[0].clips[0].effects[0].id

      // Затем удаляем
      const updatedProject = removeEffectFromClip(project, "clip-1", {
        appliedEffectId,
      })

      const clip = updatedProject.sections[0].tracks[0].clips[0]
      expect(clip.effects).toHaveLength(0)
    })
  })

  describe("updateEffectOnClip", () => {
    it("should update effect parameters", () => {
      let project = createMockProject()

      // Применяем эффект
      project = applyEffectToClip(project, "clip-1", {
        effectId: mockEffect.id,
        effect: mockEffect,
        customParams: { intensity: 1.0 },
      })

      const appliedEffectId = project.sections[0].tracks[0].clips[0].effects[0].id

      // Обновляем параметры
      const updatedProject = updateEffectOnClip(project, "clip-1", {
        appliedEffectId,
        parameters: { intensity: 2.0 },
      })

      const clip = updatedProject.sections[0].tracks[0].clips[0]
      expect(clip.effects[0].parameters).toEqual({ intensity: 2.0 })
    })

    it("should toggle effect enabled state", () => {
      let project = createMockProject()

      project = applyEffectToClip(project, "clip-1", {
        effectId: mockEffect.id,
        effect: mockEffect,
      })

      const appliedEffectId = project.sections[0].tracks[0].clips[0].effects[0].id

      const updatedProject = updateEffectOnClip(project, "clip-1", {
        appliedEffectId,
        enabled: false,
      })

      const clip = updatedProject.sections[0].tracks[0].clips[0]
      expect(clip.effects[0].enabled).toBe(false)
    })
  })

  describe("toggleEffectOnClip", () => {
    it("should toggle effect on/off", () => {
      let project = createMockProject()

      project = applyEffectToClip(project, "clip-1", {
        effectId: mockEffect.id,
        effect: mockEffect,
      })

      const appliedEffectId = project.sections[0].tracks[0].clips[0].effects[0].id

      // Начальное состояние enabled = true
      expect(project.sections[0].tracks[0].clips[0].effects[0].enabled).toBe(true)

      // Toggle off
      let updatedProject = toggleEffectOnClip(project, "clip-1", appliedEffectId)
      expect(updatedProject.sections[0].tracks[0].clips[0].effects[0].enabled).toBe(false)

      // Toggle on
      updatedProject = toggleEffectOnClip(updatedProject, "clip-1", appliedEffectId)
      expect(updatedProject.sections[0].tracks[0].clips[0].effects[0].enabled).toBe(true)
    })
  })

  describe("clearEffectsFromClip", () => {
    it("should remove all effects from clip", () => {
      let project = createMockProject()

      // Применяем несколько эффектов
      project = applyEffectToClip(project, "clip-1", {
        effectId: mockEffect.id,
        effect: mockEffect,
      })

      project = applyEffectToClip(project, "clip-1", {
        effectId: "effect-2",
        effect: { ...mockEffect, id: "effect-2" },
      })

      expect(project.sections[0].tracks[0].clips[0].effects).toHaveLength(2)

      // Очищаем все эффекты
      const updatedProject = clearEffectsFromClip(project, "clip-1")

      expect(updatedProject.sections[0].tracks[0].clips[0].effects).toHaveLength(0)
    })
  })

  describe("copyEffects", () => {
    it("should copy effects between clips", () => {
      let project = createMockProject()

      // Добавляем второй клип
      const clip2: TimelineClip = {
        ...project.sections[0].tracks[0].clips[0],
        id: "clip-2",
        name: "Test Clip 2",
        effects: [],
      }

      project.sections[0].tracks[0].clips.push(clip2)

      // Применяем эффект к первому клипу
      project = applyEffectToClip(project, "clip-1", {
        effectId: mockEffect.id,
        effect: mockEffect,
        customParams: { intensity: 1.5 },
      })

      // Копируем эффекты на второй клип
      const updatedProject = copyEffects(project, "clip-1", "clip-2")

      const targetClip = updatedProject.sections[0].tracks[0].clips.find((c) => c.id === "clip-2")

      expect(targetClip?.effects).toHaveLength(1)
      expect(targetClip?.effects[0].effectId).toBe(mockEffect.id)
      expect(targetClip?.effects[0].parameters).toEqual({ intensity: 1.5 })

      // ID должен быть новым
      const sourceEffectId = updatedProject.sections[0].tracks[0].clips[0].effects[0].id
      const targetEffectId = targetClip!.effects[0].id
      expect(targetEffectId).not.toBe(sourceEffectId)
    })
  })
})
