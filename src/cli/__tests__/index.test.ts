/**
 * Tests for Timeline Studio CLI main program
 *
 * Note: The CLI index.ts file executes program.parse() on import,
 * so we test the program configuration independently here.
 */

import { Command } from "commander"
import { describe, expect, it } from "vitest"
import { infoCommand } from "../commands/info"
import { renderCommand } from "../commands/render"
import { transcribeCommand } from "../commands/transcribe"

describe("Timeline Studio CLI", () => {
  it("should create program with correct name", () => {
    const program = new Command()
    program.name("timeline-studio")

    expect(program.name()).toBe("timeline-studio")
  })

  it("should have description", () => {
    const program = new Command()
    program.description("Timeline Studio CLI - инструменты для работы с медиа")

    expect(program.description()).toBe("Timeline Studio CLI - инструменты для работы с медиа")
  })

  it("should have version", () => {
    const program = new Command()
    program.version("1.0.0")

    expect(program.version()).toBe("1.0.0")
  })

  describe("Command Registration", () => {
    it("should register info command", () => {
      expect(infoCommand).toBeDefined()
      expect(infoCommand.name()).toBe("info")
    })

    it("should register transcribe command", () => {
      expect(transcribeCommand).toBeDefined()
      expect(transcribeCommand.name()).toBe("transcribe")
    })

    it("should register render command", () => {
      expect(renderCommand).toBeDefined()
      expect(renderCommand.name()).toBe("render")
    })

    it("should add commands to program", () => {
      const program = new Command()
        .name("timeline-studio")
        .description("Timeline Studio CLI - инструменты для работы с медиа")
        .version("1.0.0")

      program.addCommand(infoCommand)
      program.addCommand(transcribeCommand)
      program.addCommand(renderCommand)

      const commands = program.commands
      expect(commands).toHaveLength(3)
      expect(commands.map((cmd) => cmd.name())).toContain("info")
      expect(commands.map((cmd) => cmd.name())).toContain("transcribe")
      expect(commands.map((cmd) => cmd.name())).toContain("render")
    })
  })

  describe("Program Structure", () => {
    it("should have correct program configuration", () => {
      const program = new Command()

      program
        .name("timeline-studio")
        .description("Timeline Studio CLI - инструменты для работы с медиа")
        .version("1.0.0")

      expect(program.name()).toBe("timeline-studio")
      expect(program.description()).toBe("Timeline Studio CLI - инструменты для работы с медиа")
      expect(program.version()).toBe("1.0.0")
    })
  })
})
