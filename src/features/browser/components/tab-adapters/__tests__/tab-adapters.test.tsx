/**
 * Tests for tab adapter components
 * All adapters follow the same pattern: use adapter hook + render UniversalList
 *
 * Note: Full rendering tests require complex provider setup and are tested in E2E.
 * These tests verify component structure, exports, and patterns.
 */

import { describe, expect, it } from "vitest"
import { EffectsAdapterContent } from "../effects-adapter-content"
import { FiltersAdapterContent } from "../filters-adapter-content"
import { MediaAdapterContent } from "../media-adapter-content"
import { MusicAdapterContent } from "../music-adapter-content"
import { ProjectTemplatesAdapterContent } from "../project-templates-adapter-content"
import { ScenariosAdapterContent } from "../scenarios-adapter-content"
import { StyleTemplatesAdapterContent } from "../style-templates-adapter-content"
import { SubtitlesAdapterContent } from "../subtitles-adapter-content"
import { TemplatesAdapterContent } from "../templates-adapter-content"
import { TransitionsAdapterContent } from "../transitions-adapter-content"

describe("Tab Adapter Components", () => {
  describe("EffectsAdapterContent", () => {
    it("should be defined", () => {
      expect(EffectsAdapterContent).toBeDefined()
      expect(typeof EffectsAdapterContent).toBe("object")
    })

    it("should have correct displayName", () => {
      expect(EffectsAdapterContent.displayName).toBe("EffectsAdapterContent")
    })
  })

  describe("FiltersAdapterContent", () => {
    it("should be defined", () => {
      expect(FiltersAdapterContent).toBeDefined()
      expect(typeof FiltersAdapterContent).toBe("object")
    })

    it("should have correct displayName", () => {
      expect(FiltersAdapterContent.displayName).toBe("FiltersAdapterContent")
    })
  })

  describe("MediaAdapterContent", () => {
    it("should be defined", () => {
      expect(MediaAdapterContent).toBeDefined()
      expect(typeof MediaAdapterContent).toBe("object")
    })

    it("should have correct displayName", () => {
      expect(MediaAdapterContent.displayName).toBe("MediaAdapterContent")
    })
  })

  describe("MusicAdapterContent", () => {
    it("should be defined", () => {
      expect(MusicAdapterContent).toBeDefined()
      expect(typeof MusicAdapterContent).toBe("object")
    })

    it("should have correct displayName", () => {
      expect(MusicAdapterContent.displayName).toBe("MusicAdapterContent")
    })
  })

  describe("ProjectTemplatesAdapterContent", () => {
    it("should be defined", () => {
      expect(ProjectTemplatesAdapterContent).toBeDefined()
      expect(typeof ProjectTemplatesAdapterContent).toBe("object")
    })

    it("should have correct displayName", () => {
      expect(ProjectTemplatesAdapterContent.displayName).toBe("ProjectTemplatesAdapterContent")
    })
  })

  describe("ScenariosAdapterContent", () => {
    it("should be defined", () => {
      expect(ScenariosAdapterContent).toBeDefined()
      expect(typeof ScenariosAdapterContent).toBe("object")
    })

    it("should have correct displayName", () => {
      expect(ScenariosAdapterContent.displayName).toBe("ScenariosAdapterContent")
    })
  })

  describe("StyleTemplatesAdapterContent", () => {
    it("should be defined", () => {
      expect(StyleTemplatesAdapterContent).toBeDefined()
      expect(typeof StyleTemplatesAdapterContent).toBe("object")
    })

    it("should have correct displayName", () => {
      expect(StyleTemplatesAdapterContent.displayName).toBe("StyleTemplatesAdapterContent")
    })
  })

  describe("SubtitlesAdapterContent", () => {
    it("should be defined", () => {
      expect(SubtitlesAdapterContent).toBeDefined()
      expect(typeof SubtitlesAdapterContent).toBe("object")
    })

    it("should have correct displayName", () => {
      expect(SubtitlesAdapterContent.displayName).toBe("SubtitlesAdapterContent")
    })
  })

  describe("TemplatesAdapterContent", () => {
    it("should be defined", () => {
      expect(TemplatesAdapterContent).toBeDefined()
      expect(typeof TemplatesAdapterContent).toBe("object")
    })

    it("should have correct displayName", () => {
      expect(TemplatesAdapterContent.displayName).toBe("TemplatesAdapterContent")
    })
  })

  describe("TransitionsAdapterContent", () => {
    it("should be defined", () => {
      expect(TransitionsAdapterContent).toBeDefined()
      expect(typeof TransitionsAdapterContent).toBe("object")
    })

    it("should have correct displayName", () => {
      expect(TransitionsAdapterContent.displayName).toBe("TransitionsAdapterContent")
    })
  })
})

describe("Adapter Pattern Consistency", () => {
  it("all adapters should use memo", () => {
    const adapters = [
      EffectsAdapterContent,
      FiltersAdapterContent,
      MediaAdapterContent,
      MusicAdapterContent,
      ProjectTemplatesAdapterContent,
      ScenariosAdapterContent,
      StyleTemplatesAdapterContent,
      SubtitlesAdapterContent,
      TemplatesAdapterContent,
      TransitionsAdapterContent,
    ]

    adapters.forEach((Adapter) => {
      // memo components have $$typeof property
      expect(Adapter).toHaveProperty("$$typeof")
      expect(typeof Adapter).toBe("object")
    })
  })

  it("all adapters should have displayName", () => {
    const adapters = [
      { component: EffectsAdapterContent, name: "EffectsAdapterContent" },
      { component: FiltersAdapterContent, name: "FiltersAdapterContent" },
      { component: MediaAdapterContent, name: "MediaAdapterContent" },
      { component: MusicAdapterContent, name: "MusicAdapterContent" },
      {
        component: ProjectTemplatesAdapterContent,
        name: "ProjectTemplatesAdapterContent",
      },
      { component: ScenariosAdapterContent, name: "ScenariosAdapterContent" },
      {
        component: StyleTemplatesAdapterContent,
        name: "StyleTemplatesAdapterContent",
      },
      { component: SubtitlesAdapterContent, name: "SubtitlesAdapterContent" },
      { component: TemplatesAdapterContent, name: "TemplatesAdapterContent" },
      {
        component: TransitionsAdapterContent,
        name: "TransitionsAdapterContent",
      },
    ]

    adapters.forEach(({ component, name }) => {
      expect(component.displayName).toBe(name)
    })
  })

  it("all adapters should be React memo components", () => {
    const adapters = [
      EffectsAdapterContent,
      FiltersAdapterContent,
      MediaAdapterContent,
      MusicAdapterContent,
      ProjectTemplatesAdapterContent,
      ScenariosAdapterContent,
      StyleTemplatesAdapterContent,
      SubtitlesAdapterContent,
      TemplatesAdapterContent,
      TransitionsAdapterContent,
    ]

    adapters.forEach((Adapter) => {
      // Verify it's a valid React component (function or object)
      expect(["function", "object"]).toContain(typeof Adapter)
      // Verify displayName exists (set in source)
      expect(Adapter.displayName).toBeDefined()
      expect(typeof Adapter.displayName).toBe("string")
    })
  })
})
