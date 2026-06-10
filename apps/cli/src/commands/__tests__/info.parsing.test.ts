/**
 * Command parsing tests for info command - tests argument and option parsing
 */

import { Command } from "commander"
import { beforeEach, describe, expect, it } from "vitest"

describe("info command parsing", () => {
  let program: Command

  beforeEach(() => {
    // Create fresh command instance for each test
    program = new Command()
    program
      .name("info")
      .description("Получить информацию о медиафайле")
      .argument("<file>", "Путь к медиафайлу")
      .option("-j, --json", "Вывод в формате JSON")
      .option("-t, --thumbnail <path>", "Сохранить превью в указанный путь")

    // exitOverride to prevent process.exit in tests
    program.exitOverride()
  })

  describe("Argument parsing", () => {
    it("should parse file argument", () => {
      program.parse(["node", "test", "video.mp4"])
      const args = program.args
      expect(args).toHaveLength(1)
      expect(args[0]).toBe("video.mp4")
    })

    it("should parse file path with spaces", () => {
      program.parse(["node", "test", "my video.mp4"])
      const args = program.args
      expect(args[0]).toBe("my video.mp4")
    })

    it("should fail when file argument is missing", () => {
      expect(() => {
        program.parse(["node", "test"])
      }).toThrow()
    })
  })

  describe("Option parsing", () => {
    it("should parse --json option", () => {
      program.parse(["node", "test", "video.mp4", "--json"])
      const opts = program.opts()
      expect(opts.json).toBe(true)
    })

    it("should parse -j short option", () => {
      program.parse(["node", "test", "video.mp4", "-j"])
      const opts = program.opts()
      expect(opts.json).toBe(true)
    })

    it("should parse --thumbnail option with path", () => {
      program.parse(["node", "test", "video.mp4", "--thumbnail", "thumb.jpg"])
      const opts = program.opts()
      expect(opts.thumbnail).toBe("thumb.jpg")
    })

    it("should parse -t short option with path", () => {
      program.parse(["node", "test", "video.mp4", "-t", "preview.png"])
      const opts = program.opts()
      expect(opts.thumbnail).toBe("preview.png")
    })

    it("should parse multiple options together", () => {
      program.parse(["node", "test", "video.mp4", "--json", "--thumbnail", "thumb.jpg"])
      const opts = program.opts()
      expect(opts.json).toBe(true)
      expect(opts.thumbnail).toBe("thumb.jpg")
    })

    it("should have default values when options not provided", () => {
      program.parse(["node", "test", "video.mp4"])
      const opts = program.opts()
      expect(opts.json).toBeUndefined()
      expect(opts.thumbnail).toBeUndefined()
    })
  })

  describe("Error handling", () => {
    it("should reject unknown options", () => {
      program.configureOutput({
        writeOut: () => {},
        writeErr: () => {},
      })

      expect(() => {
        program.parse(["node", "test", "video.mp4", "--unknown"])
      }).toThrow()
    })

    it("should reject option without required value", () => {
      program.configureOutput({
        writeOut: () => {},
        writeErr: () => {},
      })

      expect(() => {
        program.parse(["node", "test", "video.mp4", "--thumbnail"])
      }).toThrow()
    })
  })

  describe("Command metadata", () => {
    it("should have correct name", () => {
      expect(program.name()).toBe("info")
    })

    it("should have description", () => {
      expect(program.description()).toBe("Получить информацию о медиафайле")
    })

    it("should have required file argument", () => {
      const args = program.registeredArguments
      expect(args).toHaveLength(1)
      expect(args[0].name()).toBe("file")
      expect(args[0].required).toBe(true)
    })

    it("should have json option", () => {
      const options = program.options
      const jsonOption = options.find((opt) => opt.long === "--json")
      expect(jsonOption).toBeDefined()
      expect(jsonOption?.short).toBe("-j")
    })

    it("should have thumbnail option", () => {
      const options = program.options
      const thumbOption = options.find((opt) => opt.long === "--thumbnail")
      expect(thumbOption).toBeDefined()
      expect(thumbOption?.short).toBe("-t")
    })
  })
})
