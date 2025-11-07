import { createElement } from "react"
import { describe, expect, it } from "vitest"

import {
  type CellConfiguration,
  createCellConfig,
  createDividerConfig,
  type DividerConfig,
  type MediaTemplate,
  type MediaTemplateConfig,
  PRESET_STYLES,
} from "../../lib/template-config"

describe("Template Configuration Types", () => {
  describe("CellConfiguration", () => {
    it("should allow all optional properties", () => {
      const config: CellConfiguration = {
        fitMode: "contain",
        alignX: "center",
        alignY: "center",
        initialScale: 1.0,
        initialPosition: { x: 50, y: 50 },
        title: {
          show: true,
          text: "Cell 1",
          position: "center",
          style: {
            fontSize: "16px",
            color: "#ffffff",
          },
        },
        background: {
          color: "#000000",
          opacity: 0.8,
        },
        border: {
          width: "2px",
          color: "#ffffff",
          style: "solid",
        },
      }

      expect(config.fitMode).toBe("contain")
      expect(config.title?.show).toBe(true)
      expect(config.background?.color).toBe("#000000")
    })
  })

  describe("DividerConfig", () => {
    it("should support all divider properties", () => {
      const config: DividerConfig = {
        show: true,
        width: "2px",
        color: "#ff0000",
        style: "dashed",
        opacity: 0.5,
        shadow: true,
      }

      expect(config.show).toBe(true)
      expect(config.style).toBe("dashed")
      expect(config.shadow).toBe(true)
    })
  })

  describe("MediaTemplateConfig", () => {
    it("should create a valid template config", () => {
      const config: MediaTemplateConfig = {
        id: "test-template",
        split: "vertical",
        screens: 2,
        resizable: true,
        splitPosition: 50,
        cells: [{ background: { color: "#ff0000" } }, { background: { color: "#00ff00" } }],
        gridConfig: {
          columns: 2,
          rows: 1,
        },
      }

      expect(config.id).toBe("test-template")
      expect(config.screens).toBe(2)
      expect(config.cells).toHaveLength(2)
    })

    it("should support grid configuration", () => {
      const config: MediaTemplateConfig = {
        id: "grid-template",
        split: "grid",
        screens: 9,
        gridConfig: {
          columns: 3,
          rows: 3,
          columnGap: "2px",
          rowGap: "2px",
        },
      }

      expect(config.gridConfig?.columns).toBe(3)
      expect(config.gridConfig?.rows).toBe(3)
    })
  })

  describe("MediaTemplate (with render function)", () => {
    it("should support render function for backward compatibility", () => {
      const template: MediaTemplate = {
        id: "legacy-template",
        split: "horizontal",
        screens: 2,
        render: () => createElement("div", null, "Test"),
      }

      expect(template.render).toBeDefined()
      expect(typeof template.render).toBe("function")
    })
  })
})

describe("PRESET_STYLES", () => {
  describe("cell presets", () => {
    it("should have default cell style", () => {
      const defaultStyle = PRESET_STYLES.cell.default

      expect(defaultStyle.background?.color).toBe("#23262b")
      expect(defaultStyle.border?.width).toBe("1px")
      expect(defaultStyle.title?.show).toBe(true)
      expect(defaultStyle.title?.position).toBe("center")
    })

    it("should have alternate cell style", () => {
      const alternateStyle = PRESET_STYLES.cell.alternate

      expect(alternateStyle.background?.color).toBe("#2a2e36")
      expect(alternateStyle.border?.width).toBe("1px")
      expect(alternateStyle.title?.show).toBe(true)
    })
  })

  describe("divider presets", () => {
    it("should have default divider style", () => {
      const defaultStyle = PRESET_STYLES.divider.default

      expect(defaultStyle.show).toBe(true)
      expect(defaultStyle.width).toBe("1px")
      expect(defaultStyle.color).toBe("#4b5563")
      expect(defaultStyle.style).toBe("solid")
    })

    it("should have dashed divider style", () => {
      const dashedStyle = PRESET_STYLES.divider.dashed

      expect(dashedStyle.style).toBe("dashed")
      expect(dashedStyle.dashArray).toBe("5,5")
    })

    it("should have thick divider style", () => {
      const thickStyle = PRESET_STYLES.divider.thick

      expect(thickStyle.width).toBe("2px")
      expect(thickStyle.color).toBe("#374151")
    })
  })

  describe("layout presets", () => {
    it("should have default layout style", () => {
      const defaultStyle = PRESET_STYLES.layout.default

      expect(defaultStyle.backgroundColor).toBe("transparent")
    })

    it("should have withGap layout style", () => {
      const withGapStyle = PRESET_STYLES.layout.withGap

      expect(withGapStyle.gap).toBe("2px")
      expect(withGapStyle.backgroundColor).toBe("#1f2937")
    })
  })
})

describe("createCellConfig", () => {
  it("should create default cell config for even index", () => {
    const config = createCellConfig(0)

    expect(config.background?.color).toBe("#23262b")
    expect(config.title?.text).toBe("1")
    expect(config.title?.show).toBe(true)
  })

  it("should create alternate cell config for odd index", () => {
    const config = createCellConfig(1)

    expect(config.background?.color).toBe("#2a2e36")
    expect(config.title?.text).toBe("2")
    expect(config.title?.show).toBe(true)
  })

  it("should merge custom config with preset", () => {
    const customConfig: Partial<CellConfiguration> = {
      background: { color: "#ff0000" },
      title: {
        show: false,
        text: "Custom",
      },
    }

    const config = createCellConfig(0, customConfig)

    expect(config.background?.color).toBe("#ff0000")
    expect(config.title?.show).toBe(false)
    expect(config.title?.text).toBe("Custom")
    expect(config.border?.width).toBe("1px") // Should preserve preset values
  })

  it("should handle deep merge of title styles", () => {
    const customConfig: Partial<CellConfiguration> = {
      title: {
        show: true,
        style: {
          fontSize: "24px",
          color: "#00ff00",
        },
      },
    }

    const config = createCellConfig(0, customConfig)

    expect(config.title?.style?.fontSize).toBe("24px")
    expect(config.title?.style?.color).toBe("#00ff00")
    expect(config.title?.style?.fontWeight).toBe("normal") // Preserved from preset
  })

  it("should generate correct cell numbers", () => {
    const configs = [0, 1, 2, 3, 4].map((i) => createCellConfig(i))

    expect(configs[0].title?.text).toBe("1")
    expect(configs[1].title?.text).toBe("2")
    expect(configs[2].title?.text).toBe("3")
    expect(configs[3].title?.text).toBe("4")
    expect(configs[4].title?.text).toBe("5")
  })
})

describe("createDividerConfig", () => {
  it("should create default divider config", () => {
    const config = createDividerConfig()

    expect(config.show).toBe(true)
    expect(config.width).toBe("1px")
    expect(config.color).toBe("#4b5563")
    expect(config.style).toBe("solid")
  })

  it("should create dashed divider config", () => {
    const config = createDividerConfig("dashed")

    expect(config.style).toBe("dashed")
    expect(config.dashArray).toBe("5,5")
  })

  it("should create thick divider config", () => {
    const config = createDividerConfig("thick")

    expect(config.width).toBe("2px")
    expect(config.color).toBe("#374151")
  })

  it("should merge custom config with preset", () => {
    const customConfig: Partial<DividerConfig> = {
      color: "#ff0000",
      opacity: 0.5,
    }

    const config = createDividerConfig("default", customConfig)

    expect(config.color).toBe("#ff0000")
    expect(config.opacity).toBe(0.5)
    expect(config.width).toBe("1px") // Preserved from preset
    expect(config.style).toBe("solid") // Preserved from preset
  })

  it("should handle all preset types", () => {
    const defaultConfig = createDividerConfig("default")
    const dashedConfig = createDividerConfig("dashed")
    const thickConfig = createDividerConfig("thick")

    expect(defaultConfig.style).toBe("solid")
    expect(dashedConfig.style).toBe("dashed")
    expect(thickConfig.width).toBe("2px")
  })
})

describe("Type compatibility", () => {
  it("should allow MediaTemplate to extend MediaTemplateConfig", () => {
    const config: MediaTemplateConfig = {
      id: "test",
      split: "vertical",
      screens: 2,
    }

    const template: MediaTemplate = {
      ...config,
      render: () => createElement("div", null, "Test"),
    }

    expect(template.id).toBe("test")
    expect(template.render).toBeDefined()
  })

  it("should support all split types", () => {
    const splitTypes: Array<MediaTemplateConfig["split"]> = ["vertical", "horizontal", "diagonal", "custom", "grid"]

    splitTypes.forEach((splitType) => {
      const config: MediaTemplateConfig = {
        id: `test-${splitType}`,
        split: splitType,
        screens: 2,
      }

      expect(config.split).toBe(splitType)
    })
  })

  it("should support all cell fit modes", () => {
    const fitModes: Array<CellConfiguration["fitMode"]> = ["contain", "cover", "fill"]

    fitModes.forEach((fitMode) => {
      const config: CellConfiguration = {
        fitMode,
      }

      expect(config.fitMode).toBe(fitMode)
    })
  })
})
