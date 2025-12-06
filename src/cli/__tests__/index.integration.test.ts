/**
 * Integration tests for CLI program
 */

import { Command } from "commander"
import { describe, expect, it } from "vitest"
import { infoCommand } from "../commands/info"
import { renderCommand } from "../commands/render"
import { transcribeCommand } from "../commands/transcribe"

describe("Timeline Studio CLI Integration", () => {
  describe("Program initialization", () => {
    it("should create and configure program", () => {
      const program = new Command()

      program
        .name("timeline-studio")
        .description("Timeline Studio CLI - инструменты для работы с медиа")
        .version("1.0.0")

      expect(program.name()).toBe("timeline-studio")
      expect(program.description()).toBe("Timeline Studio CLI - инструменты для работы с медиа")
      expect(program.version()).toBe("1.0.0")
    })

    it("should register all commands", () => {
      const program = new Command()

      program.name("timeline-studio").version("1.0.0")

      program.addCommand(infoCommand)
      program.addCommand(transcribeCommand)
      program.addCommand(renderCommand)

      const commands = program.commands
      expect(commands).toHaveLength(3)

      const commandNames = commands.map((cmd) => cmd.name())
      expect(commandNames).toContain("info")
      expect(commandNames).toContain("transcribe")
      expect(commandNames).toContain("render")
    })
  })

  describe("Command structure", () => {
    it("should have info command properly configured", () => {
      expect(infoCommand.name()).toBe("info")
      expect(infoCommand.description()).toBe("Получить информацию о медиафайле")

      const args = infoCommand.registeredArguments
      expect(args).toHaveLength(1)
      expect(args[0].name()).toBe("file")

      const options = infoCommand.options
      expect(options.some((opt) => opt.long === "--json")).toBe(true)
      expect(options.some((opt) => opt.long === "--thumbnail")).toBe(true)
    })

    it("should have transcribe command properly configured", () => {
      expect(transcribeCommand.name()).toBe("transcribe")
      expect(transcribeCommand.description()).toBe("Транскрибировать аудио или видео файл")

      const args = transcribeCommand.registeredArguments
      expect(args).toHaveLength(1)
      expect(args[0].name()).toBe("file")

      const options = transcribeCommand.options
      expect(options.some((opt) => opt.long === "--language")).toBe(true)
      expect(options.some((opt) => opt.long === "--model")).toBe(true)
      expect(options.some((opt) => opt.long === "--output")).toBe(true)
      expect(options.some((opt) => opt.long === "--format")).toBe(true)
      expect(options.some((opt) => opt.long === "--openai")).toBe(true)
    })

    it("should have render command properly configured", () => {
      expect(renderCommand.name()).toBe("render")
      expect(renderCommand.description()).toBe("Рендеринг проекта Timeline Studio в видео")

      const args = renderCommand.registeredArguments
      expect(args).toHaveLength(2)
      expect(args[0].name()).toBe("project")
      expect(args[1].name()).toBe("output")

      const options = renderCommand.options
      expect(options.some((opt) => opt.long === "--quality")).toBe(true)
      expect(options.some((opt) => opt.long === "--format")).toBe(true)
      expect(options.some((opt) => opt.long === "--width")).toBe(true)
      expect(options.some((opt) => opt.long === "--height")).toBe(true)
      expect(options.some((opt) => opt.long === "--fps")).toBe(true)
      expect(options.some((opt) => opt.long === "--no-audio")).toBe(true)
      expect(options.some((opt) => opt.long === "--verbose")).toBe(true)
    })
  })

  describe("Command options", () => {
    it("should have correct default values for info command", () => {
      const jsonOption = infoCommand.options.find((opt) => opt.long === "--json")
      const thumbnailOption = infoCommand.options.find((opt) => opt.long === "--thumbnail")

      expect(jsonOption).toBeDefined()
      expect(jsonOption?.short).toBe("-j")

      expect(thumbnailOption).toBeDefined()
      expect(thumbnailOption?.short).toBe("-t")
    })

    it("should have correct default values for transcribe command", () => {
      const modelOption = transcribeCommand.options.find((opt) => opt.long === "--model")
      const formatOption = transcribeCommand.options.find((opt) => opt.long === "--format")

      expect(modelOption?.defaultValue).toBe("base")
      expect(formatOption?.defaultValue).toBe("text")
    })

    it("should have correct default values for render command", () => {
      const qualityOption = renderCommand.options.find((opt) => opt.long === "--quality")
      const formatOption = renderCommand.options.find((opt) => opt.long === "--format")
      const widthOption = renderCommand.options.find((opt) => opt.long === "--width")
      const heightOption = renderCommand.options.find((opt) => opt.long === "--height")
      const fpsOption = renderCommand.options.find((opt) => opt.long === "--fps")

      expect(qualityOption?.defaultValue).toBe("high")
      expect(formatOption?.defaultValue).toBe("mp4")
      expect(widthOption?.defaultValue).toBe("1920")
      expect(heightOption?.defaultValue).toBe("1080")
      expect(fpsOption?.defaultValue).toBe("30")
    })
  })

  describe("Program usage", () => {
    it("should provide help text", () => {
      const program = new Command()

      program
        .name("timeline-studio")
        .description("Timeline Studio CLI - инструменты для работы с медиа")
        .version("1.0.0")

      program.addCommand(infoCommand)
      program.addCommand(transcribeCommand)
      program.addCommand(renderCommand)

      const helpText = program.helpInformation()

      expect(helpText).toContain("timeline-studio")
      expect(helpText).toContain("инструменты для работы с медиа")
      expect(helpText).toContain("Commands:")
    })

    it("should list all available commands in help", () => {
      const program = new Command()

      program.name("timeline-studio").version("1.0.0")

      program.addCommand(infoCommand)
      program.addCommand(transcribeCommand)
      program.addCommand(renderCommand)

      const helpText = program.helpInformation()

      expect(helpText).toContain("info")
      expect(helpText).toContain("transcribe")
      expect(helpText).toContain("render")
    })
  })

  describe("Version handling", () => {
    it("should display version", () => {
      const program = new Command()

      program.name("timeline-studio").version("1.0.0")

      expect(program.version()).toBe("1.0.0")
    })

    it("should have version option available", () => {
      const program = new Command()

      program.name("timeline-studio").version("1.0.0")

      const options = program.options
      const versionOption = options.find((opt) => opt.long === "--version")

      expect(versionOption).toBeDefined()
      expect(versionOption?.short).toBe("-V")
    })
  })

  describe("Error handling", () => {
    it("should handle unknown commands gracefully", () => {
      const program = new Command()

      program.name("timeline-studio").version("1.0.0").exitOverride()

      program.addCommand(infoCommand)
      program.addCommand(transcribeCommand)
      program.addCommand(renderCommand)

      // Test that program handles unknown commands
      expect(() => {
        program.parse(["node", "cli", "unknown-command"], { from: "node" })
      }).toThrow()
    })

    it("should handle missing required arguments", () => {
      const program = new Command()

      program.name("timeline-studio").version("1.0.0").exitOverride()

      program.addCommand(infoCommand)

      // Test that program handles missing arguments
      expect(() => {
        program.parse(["node", "cli", "info"], { from: "node" })
      }).toThrow()
    })
  })

  describe("Command chaining", () => {
    it("should allow multiple commands to be registered", () => {
      const program = new Command()

      program
        .name("timeline-studio")
        .description("Timeline Studio CLI - инструменты для работы с медиа")
        .version("1.0.0")
        .addCommand(infoCommand)
        .addCommand(transcribeCommand)
        .addCommand(renderCommand)

      expect(program.commands).toHaveLength(3)
    })
  })

  describe("Command execution context", () => {
    it("should maintain command names", () => {
      expect(infoCommand.name()).toBe("info")
      expect(transcribeCommand.name()).toBe("transcribe")
      expect(renderCommand.name()).toBe("render")
    })

    it("should maintain command descriptions", () => {
      expect(infoCommand.description()).toBeTruthy()
      expect(transcribeCommand.description()).toBeTruthy()
      expect(renderCommand.description()).toBeTruthy()
    })
  })
})
