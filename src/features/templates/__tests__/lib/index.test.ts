import { describe, expect, it, vi } from "vitest"

// Mock the lib modules to avoid dependency issues
vi.mock("../../lib/template-labels", () => ({
  getTemplateLabels: vi.fn(),
  getTemplateDescription: vi.fn(),
}))

vi.mock("../../lib/templates", () => ({
  TEMPLATE_MAP: { landscape: [], portrait: [], square: [] },
  createCellConfig: vi.fn(),
  createDividerConfig: vi.fn(),
  PRESET_STYLES: { cell: {}, divider: {}, layout: {} },
}))

describe("Lib Index Exports", () => {
  it("should export template labels utilities", async () => {
    const module = await import("../../lib/index")
    expect(module.getTemplateLabels).toBeDefined()
    expect(module.getTemplateDescription).toBeDefined()
  })

  it("should export template map and utilities", async () => {
    const module = await import("../../lib/index")
    expect(module.TEMPLATE_MAP).toBeDefined()
    expect(module.createCellConfig).toBeDefined()
    expect(module.createDividerConfig).toBeDefined()
    expect(module.PRESET_STYLES).toBeDefined()
  })

  it("should have all expected lib exports", async () => {
    const module = await import("../../lib/index")
    const exports = Object.keys(module)

    expect(exports).toContain("getTemplateLabels")
    expect(exports).toContain("getTemplateDescription")
    expect(exports).toContain("TEMPLATE_MAP")
    expect(exports).toContain("createCellConfig")
    expect(exports).toContain("createDividerConfig")
    expect(exports).toContain("PRESET_STYLES")
  })

  it("should export functions and objects", async () => {
    const module = await import("../../lib/index")

    // Functions
    expect(typeof module.getTemplateLabels).toBe("function")
    expect(typeof module.getTemplateDescription).toBe("function")
    expect(typeof module.createCellConfig).toBe("function")
    expect(typeof module.createDividerConfig).toBe("function")

    // Objects
    expect(typeof module.TEMPLATE_MAP).toBe("object")
    expect(typeof module.PRESET_STYLES).toBe("object")
  })

  it("should maintain proper lib export structure", async () => {
    const module = await import("../../lib/index")

    // All exports should be defined
    Object.entries(module).forEach(([key, value]) => {
      expect(value).toBeDefined()
      expect(key).toBeTruthy()
    })
  })

  it("should export utilities for template manipulation", async () => {
    const module = await import("../../lib/index")

    // Should have utility functions for creating configurations
    expect(module.createCellConfig).toBeDefined()
    expect(module.createDividerConfig).toBeDefined()

    // Should have preset styles for consistent theming
    expect(module.PRESET_STYLES).toBeDefined()

    // Should have template map for accessing templates
    expect(module.TEMPLATE_MAP).toBeDefined()
  })

  it("should export label utilities for internationalization", async () => {
    const module = await import("../../lib/index")

    // Should have functions for getting template labels and descriptions
    expect(module.getTemplateLabels).toBeDefined()
    expect(module.getTemplateDescription).toBeDefined()

    expect(typeof module.getTemplateLabels).toBe("function")
    expect(typeof module.getTemplateDescription).toBe("function")
  })
})
