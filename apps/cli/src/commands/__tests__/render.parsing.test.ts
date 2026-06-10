/**
 * Command parsing tests for render command - tests argument and option parsing
 */

import { Command } from "commander"
import { beforeEach, describe, expect, it } from "vitest"

describe("render command parsing", () => {
  let program: Command

  beforeEach(() => {
    // Create fresh command instance for each test
    program = new Command()
    program
      .name("render")
      .description("Рендеринг проекта Timeline Studio в видео")
      .argument("<project>", "Путь к файлу проекта (.json)")
      .argument("<output>", "Путь для сохранения видео")
      .option("-q, --quality <level>", "Качество (low/medium/high/ultra)", "high")
      .option("-f, --format <format>", "Формат видео (mp4/webm/mov)", "mp4")
      .option("-w, --width <pixels>", "Ширина видео", "1920")
      .option("-h, --height <pixels>", "Высота видео", "1080")
      .option("--fps <fps>", "Частота кадров", "30")
      .option("--no-audio", "Отключить аудио")
      .option("-v, --verbose", "Подробный вывод")

    program.exitOverride()
  })

  describe("Argument parsing", () => {
    it("should parse both project and output arguments", () => {
      program.parse(["node", "test", "project.json", "output.mp4"])
      const args = program.args
      expect(args).toHaveLength(2)
      expect(args[0]).toBe("project.json")
      expect(args[1]).toBe("output.mp4")
    })

    it("should parse paths with spaces", () => {
      program.parse(["node", "test", "my project.json", "my output.mp4"])
      const args = program.args
      expect(args[0]).toBe("my project.json")
      expect(args[1]).toBe("my output.mp4")
    })

    it("should fail when project argument is missing", () => {
      expect(() => {
        program.parse(["node", "test"])
      }).toThrow()
    })

    it("should fail when output argument is missing", () => {
      expect(() => {
        program.parse(["node", "test", "project.json"])
      }).toThrow()
    })
  })

  describe("Quality option", () => {
    it("should use default high quality", () => {
      program.parse(["node", "test", "project.json", "output.mp4"])
      const opts = program.opts()
      expect(opts.quality).toBe("high")
    })

    it("should parse --quality option", () => {
      program.parse(["node", "test", "project.json", "output.mp4", "--quality", "ultra"])
      const opts = program.opts()
      expect(opts.quality).toBe("ultra")
    })

    it("should parse -q short option", () => {
      program.parse(["node", "test", "project.json", "output.mp4", "-q", "low"])
      const opts = program.opts()
      expect(opts.quality).toBe("low")
    })

    it("should accept all quality levels", () => {
      const qualities = ["low", "medium", "high", "ultra"]
      for (const quality of qualities) {
        const cmd = new Command()
        cmd
          .name("render")
          .argument("<project>")
          .argument("<output>")
          .option("-q, --quality <level>", "", "high")
          .exitOverride()

        cmd.parse(["node", "test", "project.json", "output.mp4", "--quality", quality])
        expect(cmd.opts().quality).toBe(quality)
      }
    })
  })

  describe("Format option", () => {
    it("should use default mp4 format", () => {
      program.parse(["node", "test", "project.json", "output.mp4"])
      const opts = program.opts()
      expect(opts.format).toBe("mp4")
    })

    it("should parse --format option", () => {
      program.parse(["node", "test", "project.json", "output.webm", "--format", "webm"])
      const opts = program.opts()
      expect(opts.format).toBe("webm")
    })

    it("should parse -f short option", () => {
      program.parse(["node", "test", "project.json", "output.mov", "-f", "mov"])
      const opts = program.opts()
      expect(opts.format).toBe("mov")
    })

    it("should accept all formats", () => {
      const formats = ["mp4", "webm", "mov"]
      for (const format of formats) {
        const cmd = new Command()
        cmd
          .name("render")
          .argument("<project>")
          .argument("<output>")
          .option("-f, --format <format>", "", "mp4")
          .exitOverride()

        cmd.parse(["node", "test", "project.json", `output.${format}`, "--format", format])
        expect(cmd.opts().format).toBe(format)
      }
    })
  })

  describe("Resolution options", () => {
    it("should use default 1920x1080 resolution", () => {
      program.parse(["node", "test", "project.json", "output.mp4"])
      const opts = program.opts()
      expect(opts.width).toBe("1920")
      expect(opts.height).toBe("1080")
    })

    it("should parse --width option", () => {
      program.parse(["node", "test", "project.json", "output.mp4", "--width", "3840"])
      const opts = program.opts()
      expect(opts.width).toBe("3840")
    })

    it("should parse -w short option", () => {
      program.parse(["node", "test", "project.json", "output.mp4", "-w", "1280"])
      const opts = program.opts()
      expect(opts.width).toBe("1280")
    })

    it("should parse --height option", () => {
      program.parse(["node", "test", "project.json", "output.mp4", "--height", "2160"])
      const opts = program.opts()
      expect(opts.height).toBe("2160")
    })

    it("should parse -h short option", () => {
      program.parse(["node", "test", "project.json", "output.mp4", "-h", "720"])
      const opts = program.opts()
      expect(opts.height).toBe("720")
    })

    it("should parse custom resolution", () => {
      program.parse(["node", "test", "project.json", "output.mp4", "--width", "3840", "--height", "2160"])
      const opts = program.opts()
      expect(opts.width).toBe("3840")
      expect(opts.height).toBe("2160")
    })
  })

  describe("FPS option", () => {
    it("should use default 30 fps", () => {
      program.parse(["node", "test", "project.json", "output.mp4"])
      const opts = program.opts()
      expect(opts.fps).toBe("30")
    })

    it("should parse --fps option", () => {
      program.parse(["node", "test", "project.json", "output.mp4", "--fps", "60"])
      const opts = program.opts()
      expect(opts.fps).toBe("60")
    })

    it("should accept common fps values", () => {
      const fpsValues = ["24", "25", "30", "50", "60", "120"]
      for (const fps of fpsValues) {
        const cmd = new Command()
        cmd.name("render").argument("<project>").argument("<output>").option("--fps <fps>", "", "30").exitOverride()

        cmd.parse(["node", "test", "project.json", "output.mp4", "--fps", fps])
        expect(cmd.opts().fps).toBe(fps)
      }
    })
  })

  describe("Audio option", () => {
    it("should have audio enabled by default", () => {
      program.parse(["node", "test", "project.json", "output.mp4"])
      const opts = program.opts()
      // When --no-audio is not provided, audio should be true
      expect(opts.audio).not.toBe(false)
    })

    it("should parse --no-audio flag", () => {
      program.parse(["node", "test", "project.json", "output.mp4", "--no-audio"])
      const opts = program.opts()
      expect(opts.audio).toBe(false)
    })
  })

  describe("Verbose option", () => {
    it("should parse --verbose flag", () => {
      program.parse(["node", "test", "project.json", "output.mp4", "--verbose"])
      const opts = program.opts()
      expect(opts.verbose).toBe(true)
    })

    it("should parse -v short flag", () => {
      program.parse(["node", "test", "project.json", "output.mp4", "-v"])
      const opts = program.opts()
      expect(opts.verbose).toBe(true)
    })

    it("should be undefined when not provided", () => {
      program.parse(["node", "test", "project.json", "output.mp4"])
      const opts = program.opts()
      expect(opts.verbose).toBeUndefined()
    })
  })

  describe("Combined options", () => {
    it("should parse multiple options together", () => {
      program.parse([
        "node",
        "test",
        "project.json",
        "output.mp4",
        "--quality",
        "ultra",
        "--width",
        "3840",
        "--height",
        "2160",
        "--fps",
        "60",
      ])
      const opts = program.opts()
      expect(opts.quality).toBe("ultra")
      expect(opts.width).toBe("3840")
      expect(opts.height).toBe("2160")
      expect(opts.fps).toBe("60")
    })

    it("should parse all options with flags", () => {
      program.parse([
        "node",
        "test",
        "project.json",
        "output.mp4",
        "-q",
        "high",
        "-f",
        "webm",
        "-w",
        "1920",
        "-h",
        "1080",
        "--fps",
        "30",
        "--no-audio",
        "-v",
      ])
      const opts = program.opts()
      expect(opts.quality).toBe("high")
      expect(opts.format).toBe("webm")
      expect(opts.width).toBe("1920")
      expect(opts.height).toBe("1080")
      expect(opts.fps).toBe("30")
      expect(opts.audio).toBe(false)
      expect(opts.verbose).toBe(true)
    })
  })

  describe("Command metadata", () => {
    it("should have correct name", () => {
      expect(program.name()).toBe("render")
    })

    it("should have description", () => {
      expect(program.description()).toBe("Рендеринг проекта Timeline Studio в видео")
    })

    it("should have two required arguments", () => {
      const args = program.registeredArguments
      expect(args).toHaveLength(2)
      expect(args[0].name()).toBe("project")
      expect(args[0].required).toBe(true)
      expect(args[1].name()).toBe("output")
      expect(args[1].required).toBe(true)
    })

    it("should have all expected options", () => {
      const options = program.options
      const optionNames = options.map((opt) => opt.long)

      expect(optionNames).toContain("--quality")
      expect(optionNames).toContain("--format")
      expect(optionNames).toContain("--width")
      expect(optionNames).toContain("--height")
      expect(optionNames).toContain("--fps")
      expect(optionNames).toContain("--no-audio")
      expect(optionNames).toContain("--verbose")
    })
  })
})
