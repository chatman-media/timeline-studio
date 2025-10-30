import { beforeEach, describe, expect, it } from "vitest"

import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { MediaFile } from "@/features/media/types/media"
import type { StyleTemplate } from "@/features/style-templates/types/style-template"
import type { MediaTemplate } from "@/features/templates/lib/templates"
import type { Transition } from "@/features/transitions/types/transitions"

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
      description: "",
      version: "0.0.1",
      createdAt: new Date(),
      modifiedAt: new Date(),
      framerate: 30,
      sections: [],
      globalTracks: [],
      duration: 0,
      width: 1920,
      height: 1080,
      resources: {
        media: [],
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        timelineTransitions: [],
      },
    }
  })

  describe("addEffectToResources", () => {
    const mockEffect: VideoEffect = {
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
      description: {
        en: "Test filter description",
      },
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
      parameters: [],
      complexity: "basic",
      tags: [],
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
      name: "Test Template",
      category: "grid",
      duration: 60,
      tracks: [],
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
        templates: [mockTemplate],
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
      format: "mp4",
      duration: 10,
      createdAt: new Date().toISOString(),
    }

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
      }

      const result = addMediaToResources(mockProject, mockMedia)

      expect(result.resources?.media).toHaveLength(1)
    })
  })

  describe("createAppliedEffect", () => {
    const mockEffect: VideoEffect = {
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
    }

    it("should create applied effect and add to resources", () => {
      const customParams = { intensity: 0.5 }
      const { project, appliedEffect } = createAppliedEffect(mockProject, mockEffect, customParams)

      expect(project.resources?.effects).toHaveLength(1)
      expect(project.resources?.effects[0]).toBe(mockEffect)

      expect(appliedEffect.effectId).toBe(mockEffect.id)
      expect(appliedEffect.customParams).toEqual(customParams)
      expect(appliedEffect.enabled).toBe(true)
      expect(appliedEffect.order).toBe(0)
      expect(appliedEffect.id).toMatch(/^applied-effect-1-\d+$/)
    })
  })

  describe("createAppliedFilter", () => {
    const mockFilter: VideoFilter = {
      id: "filter-1",
      name: "Test Filter",
      category: "color_correction",
      description: {
        en: "Test filter description",
      },
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
      parameters: [],
      complexity: "basic",
      tags: [],
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
      const usedEffect: VideoEffect = {
        id: "used-effect",
        name: {
          en: "Used Effect",
          ru: "Используемый эффект",
        },
        type: "sepia",
        category: "color_correction",
        description: {
          en: "Used",
          ru: "Используется",
        },
        parameters: [],
      }

      const unusedEffect: VideoEffect = {
        id: "unused-effect",
        name: {
          en: "Unused Effect",
          ru: "Неиспользуемый эффект",
        },
        type: "sepia",
        category: "color_correction",
        description: {
          en: "Unused",
          ru: "Не используется",
        },
        parameters: [],
      }

      const usedMedia: MediaFile = {
        id: "used-media",
        name: "used.mp4",
        path: "/path/to/used.mp4",
        size: 1000000,
        format: "mp4",
        duration: 10,
        createdAt: new Date().toISOString(),
      }

      const unusedMedia: MediaFile = {
        id: "unused-media",
        name: "unused.mp4",
        path: "/path/to/unused.mp4",
        size: 1000000,
        format: "mp4",
        duration: 10,
        createdAt: new Date().toISOString(),
      }

      mockProject.resources = {
        effects: [usedEffect, unusedEffect],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [usedMedia, unusedMedia],
      }

      mockProject.sections = [
        {
          id: "section-1",
          name: "Section 1",
          start: 0,
          duration: 10,
          tracks: [
            {
              id: "track-1",
              name: "Track 1",
              order: 0,
              height: 100,
              isLocked: false,
              clips: [
                {
                  id: "clip-1",
                  trackId: "track-1",
                  mediaId: "used-media",
                  duration: 5,
                  offset: 0,
                  effects: [
                    {
                      id: "applied-effect-1",
                      effectId: "used-effect",
                      enabled: true,
                      order: 0,
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
