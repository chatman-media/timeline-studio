import { beforeEach, describe, expect, it } from "vitest"
import type { Transition, VideoFilter } from "@/domains/video-editing/types"
import type { MediaFile } from "@/domains/video-editing/types/media"
import type { BaseEffect } from "@/domains/video-editing/types/unified-effects"
import type { StyleTemplate } from "@/features/style-templates/types/style-template"
import type { MediaTemplate } from "@/features/templates/lib/template-config"

import {
  addEffectToResources,
  addFilterToResources,
  addMediaToResources,
  addStyleTemplateToResources,
  addTemplateToResources,
  addTransitionToResources,
  cleanupUnusedResources,
  createAppliedEffect,
  createAppliedFilter,
  createAppliedStyleTemplate,
  createAppliedTransition,
} from "../../services/resource-manager"
import type { TimelineProject } from "../../types/timeline"

describe("resource-manager", () => {
  let mockProject: TimelineProject

  beforeEach(() => {
    mockProject = {
      id: "test-project",
      name: "Test Project",
      version: "0.0.1",
      createdAt: new Date(),
      updatedAt: new Date(),
      fps: 30,
      sampleRate: 44100,
      sections: [],
      globalTracks: [],
      duration: 0,
      settings: {
        autoSave: true,
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        aspectRatio: "16:9",
        sampleRate: 44100,
        channels: 2,
        bitDepth: 16,
        timeFormat: "seconds",
        snapToGrid: true,
        gridSize: 1,
        autoSaveInterval: 60,
      },
      resources: {
        media: [],
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        timelineTransitions: [],
        subtitleStyles: [],
        music: [],
      },
    }
  })

  describe("addEffectToResources", () => {
    const mockEffect: BaseEffect = {
      id: "effect-1",
      name: {
        en: "Test Effect",
        ru: "Тестовый эффект",
      },
      category: "color_correction",
      description: {
        en: "Test effect description",
        ru: "Описание тестового эффекта",
      },
      parameters: [],
      scope: ["clip"],
      processingType: "realtime",
      version: "1.0.0",
      tags: [],
      complexity: "low",
      gpuAccelerated: false,
      presets: [],
      processors: {},
    }

    it("should create resources object if not exists", () => {
      const result = addEffectToResources(mockProject, mockEffect)

      expect(result.resources).toBeDefined()
      expect(result.resources?.effects).toHaveLength(1)
      expect(result.resources?.effects[0]).toBe(mockEffect)
    })

    it("should add effect to existing resources", () => {
      mockProject.resources = {
        media: [],
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        timelineTransitions: [],
        subtitleStyles: [],
        music: [],
      }

      const result = addEffectToResources(mockProject, mockEffect)

      expect(result.resources?.effects).toHaveLength(1)
      expect(result.resources?.effects[0]).toBe(mockEffect)
    })

    it("should not add duplicate effects", () => {
      mockProject.resources = {
        media: [],
        effects: [mockEffect],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        timelineTransitions: [],
        subtitleStyles: [],
        music: [],
      }

      const result = addEffectToResources(mockProject, mockEffect)

      expect(result.resources?.effects).toHaveLength(1)
    })
  })

  describe("addFilterToResources", () => {
    const mockFilter: VideoFilter = {
      id: "filter-1",
      name: "Test Filter",
      category: "color-correction",
      complexity: "basic",
      tags: [],
      description: {
        en: "Test filter description",
      },
      labels: {
        en: "Test Filter",
      },
      params: {},
    }

    it("should add filter to resources", () => {
      const result = addFilterToResources(mockProject, mockFilter)

      expect(result.resources?.filters).toHaveLength(1)
      expect(result.resources?.filters[0]).toBe(mockFilter)
    })

    it("should not add duplicate filters", () => {
      mockProject.resources = {
        effects: [],
        filters: [mockFilter],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
        timelineTransitions: [],
      }

      const result = addFilterToResources(mockProject, mockFilter)

      expect(result.resources?.filters).toHaveLength(1)
    })
  })

  describe("addTransitionToResources", () => {
    const mockTransition: Transition = {
      id: "transition-1",
      name: "Test Transition",
      type: "fade",
      category: "basic",
      description: {
        en: "Test transition description",
        ru: "Описание тестового перехода",
      },
      duration: {
        default: 1,
        min: 0.1,
        max: 5,
      },
      parameters: {},
      complexity: "basic",
      tags: [],
      labels: {
        en: "Test Transition",
        ru: "Тестовый переход",
      },
      ffmpegCommand: () => "fade",
    }

    it("should add transition to resources", () => {
      const result = addTransitionToResources(mockProject, mockTransition)

      expect(result.resources?.transitions).toHaveLength(1)
      expect(result.resources?.transitions[0]).toBe(mockTransition)
    })

    it("should not add duplicate transitions", () => {
      mockProject.resources = {
        effects: [],
        filters: [],
        transitions: [mockTransition],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
        timelineTransitions: [],
      }

      const result = addTransitionToResources(mockProject, mockTransition)

      expect(result.resources?.transitions).toHaveLength(1)
    })
  })

  describe("addTemplateToResources", () => {
    const mockTemplate: MediaTemplate = {
      id: "template-1",
      split: "grid",
      screens: 4,
      gridConfig: {
        columns: 2,
        rows: 2,
      },
      render: () => null as any,
    }

    it("should add template to resources", () => {
      const result = addTemplateToResources(mockProject, mockTemplate)

      expect(result.resources?.templates).toHaveLength(1)
      expect(result.resources?.templates[0]).toBe(mockTemplate)
    })

    it("should not add duplicate templates", () => {
      mockProject.resources = {
        effects: [],
        filters: [],
        transitions: [],
        templates: [mockTemplate as any],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
        timelineTransitions: [],
      }

      const result = addTemplateToResources(mockProject, mockTemplate)

      expect(result.resources?.templates).toHaveLength(1)
    })
  })

  describe("addStyleTemplateToResources", () => {
    const mockStyleTemplate: StyleTemplate = {
      id: "style-template-1",
      name: {
        en: "Test Style Template",
        ru: "Тестовый стиль шаблон",
      },
      category: "intro",
      description: {
        en: "Test style template",
        ru: "Тестовый стиль шаблон",
      },
      duration: 5,
      hasText: true,
      hasAnimation: true,
      style: "modern",
      aspectRatio: "16:9",
      elements: [],
    }

    it("should add style template to resources", () => {
      const result = addStyleTemplateToResources(mockProject, mockStyleTemplate)

      expect(result.resources?.styleTemplates).toHaveLength(1)
      expect(result.resources?.styleTemplates[0]).toBe(mockStyleTemplate)
    })

    it("should not add duplicate style templates", () => {
      mockProject.resources = {
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [mockStyleTemplate],
        subtitleStyles: [],
        music: [],
        media: [],
        timelineTransitions: [],
      }

      const result = addStyleTemplateToResources(mockProject, mockStyleTemplate)

      expect(result.resources?.styleTemplates).toHaveLength(1)
    })
  })

  describe("addMediaToResources", () => {
    const mockMedia: MediaFile = {
      id: "media-1",
      name: "test.mp4",
      path: "/path/to/test.mp4",
      size: 1000000,
      duration: 10,
      createdAt: new Date(),
    } as any

    it("should add media to resources", () => {
      const result = addMediaToResources(mockProject, mockMedia)

      expect(result.resources?.media).toHaveLength(1)
      expect(result.resources?.media[0]).toBe(mockMedia)
    })

    it("should not add duplicate media", () => {
      mockProject.resources = {
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [mockMedia],
        timelineTransitions: [],
      }

      const result = addMediaToResources(mockProject, mockMedia)

      expect(result.resources?.media).toHaveLength(1)
    })
  })

  describe("createAppliedEffect", () => {
    const mockEffect: BaseEffect = {
      id: "effect-1",
      name: {
        en: "Test Effect",
        ru: "Тестовый эффект",
      },
      category: "color_correction",
      description: {
        en: "Test effect description",
        ru: "Описание тестового эффекта",
      },
      parameters: [],
      scope: ["clip"],
      processingType: "realtime",
      version: "1.0.0",
      tags: [],
      complexity: "low",
      gpuAccelerated: false,
      presets: [],
      processors: {},
    }

    it("should create applied effect and add to resources", () => {
      const customParams = { intensity: 0.5 }
      const { project, appliedEffect } = createAppliedEffect(mockProject, mockEffect, customParams)

      expect(project.resources?.effects).toHaveLength(1)
      expect(project.resources?.effects[0]).toBe(mockEffect)

      expect(appliedEffect.effectId).toBe(mockEffect.id)
      expect(appliedEffect.parameters).toEqual(customParams)
      expect(appliedEffect.enabled).toBe(true)
      expect(appliedEffect.order).toBe(0)
      expect(appliedEffect.id).toMatch(/^applied-effect-1-\d+$/)
      expect(appliedEffect.keyframes).toEqual({})
      expect(appliedEffect.masks).toEqual([])
    })
  })

  describe("createAppliedFilter", () => {
    const mockFilter: VideoFilter = {
      id: "filter-1",
      name: "Test Filter",
      category: "color-correction",
      description: {
        en: "Test filter description",
      },
      complexity: "basic",
      tags: [],
      labels: {
        en: "Test Filter",
      },
      params: {},
    }

    it("should create applied filter and add to resources", () => {
      const customParams = { radius: 10 }
      const { project, appliedFilter } = createAppliedFilter(mockProject, mockFilter, customParams)

      expect(project.resources?.filters).toHaveLength(1)
      expect(project.resources?.filters[0]).toBe(mockFilter)

      expect(appliedFilter.filterId).toBe(mockFilter.id)
      expect(appliedFilter.customParams).toEqual(customParams)
      expect(appliedFilter.isEnabled).toBe(true)
      expect(appliedFilter.order).toBe(0)
      expect(appliedFilter.id).toMatch(/^applied-filter-1-\d+$/)
    })
  })

  describe("createAppliedTransition", () => {
    const mockTransition: Transition = {
      id: "transition-1",
      name: "Test Transition",
      type: "fade",
      category: "basic",
      description: {
        en: "Test transition description",
        ru: "Описание тестового перехода",
      },
      duration: {
        default: 1,
        min: 0.1,
        max: 5,
      },
      parameters: {},
      complexity: "basic",
      tags: [],
      labels: {
        en: "Test Transition",
        ru: "Тестовый переход",
      },
      ffmpegCommand: () => "fade",
    }

    it("should create applied transition and add to resources", () => {
      const customParams = { easing: "ease-in-out" }
      const { project, appliedTransition } = createAppliedTransition(
        mockProject,
        mockTransition,
        500,
        "in",
        customParams,
      )

      expect(project.resources?.transitions).toHaveLength(1)
      expect(project.resources?.transitions[0]).toBe(mockTransition)

      expect(appliedTransition.transitionId).toBe(mockTransition.id)
      expect(appliedTransition.duration).toBe(500)
      expect(appliedTransition.type).toBe("in")
      expect(appliedTransition.customParams).toEqual(customParams)
      expect(appliedTransition.isEnabled).toBe(true)
      expect(appliedTransition.id).toMatch(/^applied-transition-1-\d+$/)
    })
  })

  describe("createAppliedStyleTemplate", () => {
    const mockStyleTemplate: StyleTemplate = {
      id: "style-template-1",
      name: {
        en: "Test Style Template",
        ru: "Тестовый стиль шаблон",
      },
      category: "intro",
      description: {
        en: "Test style template",
        ru: "Тестовый стиль шаблон",
      },
      duration: 5,
      hasText: true,
      hasAnimation: true,
      style: "modern",
      aspectRatio: "16:9",
      elements: [],
    }

    it("should create applied style template and add to resources", () => {
      const customizations = {
        text: { title: "Custom Title" },
        colors: { primary: "#ff0000" },
      }
      const { project, appliedStyleTemplate } = createAppliedStyleTemplate(
        mockProject,
        mockStyleTemplate,
        customizations,
      )

      expect(project.resources?.styleTemplates).toHaveLength(1)
      expect(project.resources?.styleTemplates[0]).toBe(mockStyleTemplate)

      expect(appliedStyleTemplate.styleTemplateId).toBe(mockStyleTemplate.id)
      expect(appliedStyleTemplate.customizations).toEqual(customizations)
      expect(appliedStyleTemplate.isEnabled).toBe(true)
      expect(appliedStyleTemplate.id).toMatch(/^applied-style-template-1-\d+$/)
    })
  })

  describe("cleanupUnusedResources", () => {
    it("should remove unused resources from project", () => {
      const usedEffect: BaseEffect = {
        id: "used-effect",
        name: {
          en: "Used Effect",
          ru: "Используемый эффект",
        },
        category: "color_correction",
        description: {
          en: "Used",
          ru: "Используется",
        },
        parameters: [],
        scope: ["clip"],
        processingType: "realtime",
        version: "1.0.0",
        tags: [],
        complexity: "low",
        gpuAccelerated: false,
        presets: [],
        processors: {},
      }

      const unusedEffect: BaseEffect = {
        id: "unused-effect",
        name: {
          en: "Unused Effect",
          ru: "Неиспользуемый эффект",
        },
        category: "color_correction",
        description: {
          en: "Unused",
          ru: "Не используется",
        },
        parameters: [],
        scope: ["clip"],
        processingType: "realtime",
        version: "1.0.0",
        tags: [],
        complexity: "low",
        gpuAccelerated: false,
        presets: [],
        processors: {},
      }

      const usedMedia: MediaFile = {
        id: "used-media",
        name: "used.mp4",
        path: "/path/to/used.mp4",
        size: 1000000,
        duration: 10,
        createdAt: new Date(),
      } as any

      const unusedMedia: MediaFile = {
        id: "unused-media",
        name: "unused.mp4",
        path: "/path/to/unused.mp4",
        size: 1000000,
        duration: 10,
        createdAt: new Date(),
      } as any

      mockProject.resources = {
        effects: [usedEffect, unusedEffect],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [usedMedia, unusedMedia],
        timelineTransitions: [],
      }

      mockProject.sections = [
        {
          id: "section-1",
          name: "Section 1",
          duration: 10,
          index: 0,
          startTime: 0,
          endTime: 10,
          isCollapsed: false,
          tracks: [
            {
              id: "track-1",
              name: "Track 1",
              type: "video",
              order: 0,
              height: 100,
              isLocked: false,
              transitions: [],
              isMuted: false,
              isHidden: false,
              isSolo: false,
              volume: 1,
              color: "#ffffff",
              pan: 0,
              trackEffects: [],
              trackFilters: [],
              clips: [
                {
                  id: "clip-1",
                  name: "Test Clip",
                  trackId: "track-1",
                  mediaId: "used-media",
                  startTime: 0,
                  duration: 5,
                  offset: 0,
                  mediaStartTime: 0,
                  mediaEndTime: 5,
                  volume: 1,
                  opacity: 1,
                  speed: 1,
                  playbackRate: 1,
                  isLocked: false,
                  fadeIn: { duration: 0 },
                  fadeOut: { duration: 0 },
                  isReversed: false,
                  filters: [],
                  transitions: [],
                  isSelected: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  effects: [
                    {
                      id: "applied-effect-1",
                      effectId: "used-effect",
                      enabled: true,
                      order: 0,
                      startTime: 0,
                      parameters: {},
                      keyframes: {},
                      masks: [],
                      blendMode: "normal",
                      opacity: 100,
                      effectVersion: "1.0.0",
                      createdAt: new Date(),
                      modifiedAt: new Date(),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]

      const result = cleanupUnusedResources(mockProject)

      expect(result.resources?.effects).toHaveLength(1)
      expect(result.resources?.effects[0].id).toBe("used-effect")
      expect(result.resources?.media).toHaveLength(1)
      expect(result.resources?.media[0].id).toBe("used-media")
    })

    it("should handle project without resources", () => {
      const result = cleanupUnusedResources(mockProject)
      expect(result).toEqual(mockProject)
    })

    it("should handle global tracks", () => {
      const usedFilter: VideoFilter = {
        id: "used-filter",
        name: "Used Filter",
        category: "color-correction",
        complexity: "basic",
        tags: [],
        description: {
          en: "Used",
        },
        labels: {
          en: "Used Filter",
        },
        params: {},
      }

      mockProject.resources = {
        effects: [],
        filters: [usedFilter],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
        timelineTransitions: [],
      }

      mockProject.globalTracks = [
        {
          id: "global-track-1",
          name: "Global Track 1",
          type: "audio",
          order: 0,
          height: 100,
          isLocked: false,
          clips: [],
          transitions: [],
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          color: "#ffffff",
          pan: 0,
          trackEffects: [],
          trackFilters: [
            {
              id: "applied-filter-1",
              filterId: "used-filter",
              isEnabled: true,
              order: 0,
            },
          ],
        },
      ]

      const result = cleanupUnusedResources(mockProject)

      expect(result.resources?.filters).toHaveLength(1)
      expect(result.resources?.filters[0].id).toBe("used-filter")
    })
  })
})
