/**
 * Command parsing tests for transcribe command - tests argument and option parsing
 */

import { Command } from "commander"
import { beforeEach, describe, expect, it } from "vitest"

describe("transcribe command parsing", () => {
  let program: Command

  beforeEach(() => {
    // Create fresh command instance for each test
    program = new Command()
    program
      .name("transcribe")
      .description("Транскрибировать аудио или видео файл")
      .argument("<file>", "Путь к аудио/видео файлу")
      .option("-l, --language <lang>", "Язык аудио (en, ru, etc.)")
      .option("-m, --model <model>", "Модель Whisper (tiny/base/small/medium/large)", "base")
      .option("-o, --output <file>", "Сохранить результат в файл")
      .option("-f, --format <format>", "Формат вывода (text/json/srt/vtt)", "text")
      .option("--openai", "Использовать OpenAI API вместо локальной модели")

    program.exitOverride()
  })

  describe("Argument parsing", () => {
    it("should parse file argument", () => {
      program.parse(["node", "test", "audio.mp3"])
      const args = program.args
      expect(args).toHaveLength(1)
      expect(args[0]).toBe("audio.mp3")
    })

    it("should parse file path with spaces", () => {
      program.parse(["node", "test", "my audio file.mp3"])
      const args = program.args
      expect(args[0]).toBe("my audio file.mp3")
    })

    it("should fail when file argument is missing", () => {
      expect(() => {
        program.parse(["node", "test"])
      }).toThrow()
    })
  })

  describe("Language option", () => {
    it("should parse --language option", () => {
      program.parse(["node", "test", "audio.mp3", "--language", "ru"])
      const opts = program.opts()
      expect(opts.language).toBe("ru")
    })

    it("should parse -l short option", () => {
      program.parse(["node", "test", "audio.mp3", "-l", "en"])
      const opts = program.opts()
      expect(opts.language).toBe("en")
    })

    it("should accept various language codes", () => {
      const languages = ["en", "ru", "es", "fr", "de", "zh"]
      for (const lang of languages) {
        const cmd = new Command()
        cmd.name("transcribe").argument("<file>").option("-l, --language <lang>").exitOverride()

        cmd.parse(["node", "test", "audio.mp3", "--language", lang])
        expect(cmd.opts().language).toBe(lang)
      }
    })
  })

  describe("Model option", () => {
    it("should use default base model", () => {
      program.parse(["node", "test", "audio.mp3"])
      const opts = program.opts()
      expect(opts.model).toBe("base")
    })

    it("should parse --model option", () => {
      program.parse(["node", "test", "audio.mp3", "--model", "tiny"])
      const opts = program.opts()
      expect(opts.model).toBe("tiny")
    })

    it("should parse -m short option", () => {
      program.parse(["node", "test", "audio.mp3", "-m", "large"])
      const opts = program.opts()
      expect(opts.model).toBe("large")
    })

    it("should accept all model sizes", () => {
      const models = ["tiny", "base", "small", "medium", "large"]
      for (const model of models) {
        const cmd = new Command()
        cmd.name("transcribe").argument("<file>").option("-m, --model <model>", "", "base").exitOverride()

        cmd.parse(["node", "test", "audio.mp3", "--model", model])
        expect(cmd.opts().model).toBe(model)
      }
    })
  })

  describe("Output option", () => {
    it("should parse --output option", () => {
      program.parse(["node", "test", "audio.mp3", "--output", "result.txt"])
      const opts = program.opts()
      expect(opts.output).toBe("result.txt")
    })

    it("should parse -o short option", () => {
      program.parse(["node", "test", "audio.mp3", "-o", "transcript.json"])
      const opts = program.opts()
      expect(opts.output).toBe("transcript.json")
    })

    it("should be undefined when not provided", () => {
      program.parse(["node", "test", "audio.mp3"])
      const opts = program.opts()
      expect(opts.output).toBeUndefined()
    })
  })

  describe("Format option", () => {
    it("should use default text format", () => {
      program.parse(["node", "test", "audio.mp3"])
      const opts = program.opts()
      expect(opts.format).toBe("text")
    })

    it("should parse --format option", () => {
      program.parse(["node", "test", "audio.mp3", "--format", "json"])
      const opts = program.opts()
      expect(opts.format).toBe("json")
    })

    it("should parse -f short option", () => {
      program.parse(["node", "test", "audio.mp3", "-f", "srt"])
      const opts = program.opts()
      expect(opts.format).toBe("srt")
    })

    it("should accept all formats", () => {
      const formats = ["text", "json", "srt", "vtt"]
      for (const format of formats) {
        const cmd = new Command()
        cmd.name("transcribe").argument("<file>").option("-f, --format <format>", "", "text").exitOverride()

        cmd.parse(["node", "test", "audio.mp3", "--format", format])
        expect(cmd.opts().format).toBe(format)
      }
    })
  })

  describe("OpenAI flag", () => {
    it("should parse --openai flag", () => {
      program.parse(["node", "test", "audio.mp3", "--openai"])
      const opts = program.opts()
      expect(opts.openai).toBe(true)
    })

    it("should be undefined when not provided", () => {
      program.parse(["node", "test", "audio.mp3"])
      const opts = program.opts()
      expect(opts.openai).toBeUndefined()
    })
  })

  describe("Combined options", () => {
    it("should parse multiple options together", () => {
      program.parse([
        "node",
        "test",
        "audio.mp3",
        "--language",
        "ru",
        "--model",
        "small",
        "--format",
        "json",
        "--output",
        "result.json",
      ])
      const opts = program.opts()
      expect(opts.language).toBe("ru")
      expect(opts.model).toBe("small")
      expect(opts.format).toBe("json")
      expect(opts.output).toBe("result.json")
    })

    it("should parse options with OpenAI flag", () => {
      program.parse(["node", "test", "audio.mp3", "--openai", "--language", "en", "--format", "srt"])
      const opts = program.opts()
      expect(opts.openai).toBe(true)
      expect(opts.language).toBe("en")
      expect(opts.format).toBe("srt")
    })
  })

  describe("Command metadata", () => {
    it("should have correct name", () => {
      expect(program.name()).toBe("transcribe")
    })

    it("should have description", () => {
      expect(program.description()).toBe("Транскрибировать аудио или видео файл")
    })

    it("should have required file argument", () => {
      const args = program.registeredArguments
      expect(args).toHaveLength(1)
      expect(args[0].name()).toBe("file")
      expect(args[0].required).toBe(true)
    })

    it("should have all expected options", () => {
      const options = program.options
      const optionNames = options.map((opt) => opt.long)

      expect(optionNames).toContain("--language")
      expect(optionNames).toContain("--model")
      expect(optionNames).toContain("--output")
      expect(optionNames).toContain("--format")
      expect(optionNames).toContain("--openai")
    })
  })
})
