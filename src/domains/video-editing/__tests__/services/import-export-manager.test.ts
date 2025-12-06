/**
 * Import/Export Manager Tests
 *
 * Tests for timeline import/export manager
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { ImportExportManager } from "../../services/import-export/import-export-manager"
import type { Exporter, Importer, ImportOptions } from "../../services/import-export/types"

// Mock Tauri file system
vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}))

// Mock importers/exporters
vi.mock("../../services/import-export/exporters/edl-exporter", () => ({
  EDLExporter: class {
    export = vi.fn().mockResolvedValue("EDL content")
  },
}))

vi.mock("../../services/import-export/exporters/fcpxml-exporter", () => ({
  FCPXMLExporter: class {
    export = vi.fn().mockResolvedValue("FCPXML content")
  },
}))

vi.mock("../../services/import-export/exporters/aaf-exporter", () => ({
  AAFExporter: class {
    export = vi.fn().mockResolvedValue("AAF content")
  },
}))

vi.mock("../../services/import-export/importers/edl-importer", () => ({
  EDLImporter: class {
    import = vi.fn().mockResolvedValue({
      success: true,
      timeline: {},
      mediaFiles: [],
      warnings: [],
      errors: [],
    })
  },
}))

vi.mock("../../services/import-export/importers/fcpxml-importer", () => ({
  FCPXMLImporter: class {
    import = vi.fn().mockResolvedValue({
      success: true,
      timeline: {},
      mediaFiles: [],
      warnings: [],
      errors: [],
    })
  },
}))

vi.mock("../../services/import-export/importers/aaf-importer", () => ({
  AAFImporter: class {
    import = vi.fn().mockResolvedValue({
      success: true,
      timeline: {},
      mediaFiles: [],
      warnings: [],
      errors: [],
    })
  },
}))

describe("ImportExportManager", () => {
  let manager: ImportExportManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new ImportExportManager()
  })

  describe("Initialization", () => {
    it("should initialize with default importers and exporters", () => {
      expect(manager).toBeDefined()
    })
  })

  describe("Import", () => {
    it("should import EDL format successfully", async () => {
      const options: ImportOptions = {
        format: "edl",
        preserveTimecode: true,
      }

      const result = await manager.import("EDL content", options)

      expect(result.success).toBe(true)
    })

    it("should import FCPXML format successfully", async () => {
      const options: ImportOptions = {
        format: "fcpxml",
      }

      const result = await manager.import("FCPXML content", options)

      expect(result.success).toBe(true)
    })

    it("should import AAF format successfully", async () => {
      const options: ImportOptions = {
        format: "aaf",
      }

      const result = await manager.import("AAF content", options)

      expect(result.success).toBe(true)
    })

    it("should return error for unsupported format", async () => {
      const options: ImportOptions = {
        format: "unsupported" as any,
      }

      const result = await manager.import("content", options)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe("UNSUPPORTED_FORMAT")
    })
  })

  describe("Register Custom Importers/Exporters", () => {
    it("should register custom importer", async () => {
      const mockImporter: Importer = {
        import: vi.fn().mockResolvedValue({
          success: true,
          timeline: {},
          mediaFiles: [],
          warnings: [],
          errors: [],
        }),
      }

      manager.registerImporter("edl", mockImporter)

      const result = await manager.import("test content", { format: "edl" })

      expect(result.success).toBe(true)
      expect(mockImporter.import).toHaveBeenCalled()
    })

    it("should register custom exporter", () => {
      const mockExporter: Exporter = {
        export: vi.fn().mockResolvedValue("exported content"),
      }

      manager.registerExporter("edl", mockExporter)

      expect(manager).toBeDefined()
    })
  })
})
