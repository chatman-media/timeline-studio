/**
 * Команда transcribe - транскрибация аудио/видео
 */

import fs from "node:fs/promises"
import path from "node:path"
import { Command } from "commander"

import { initNodeApp } from "@timeline-studio/adapters/node"
import type { TranscriptionResult } from "@timeline-studio/core/ports"

export const transcribeCommand = new Command("transcribe")
  .description("Транскрибировать аудио или видео файл")
  .argument("<file>", "Путь к аудио/видео файлу")
  .option("-l, --language <lang>", "Код языка (ru, en, etc.)")
  .option("-m, --model <model>", "Модель Whisper (tiny, base, small, medium, large)", "base")
  .option("-o, --output <path>", "Сохранить результат в файл")
  .option("-f, --format <format>", "Формат вывода (text, json, srt, vtt)", "text")
  .option("--openai", "Использовать OpenAI API вместо локального Whisper")
  .option("--api-key <key>", "API ключ OpenAI (или использовать OPENAI_API_KEY)")
  .action(
    async (
      file: string,
      options: {
        language?: string
        model?: string
        output?: string
        format?: string
        openai?: boolean
        apiKey?: string
      },
    ) => {
      try {
        const absolutePath = path.resolve(file)

        // Инициализация сервисов
        const apiKey = options.apiKey || process.env.OPENAI_API_KEY
        const services = await initNodeApp({
          autoConnect: false,
          ai: apiKey ? { openaiApiKey: apiKey } : undefined,
        })

        // Проверка существования файла
        const exists = await services.platform.exists(absolutePath)
        if (!exists) {
          console.error(`Ошибка: Файл не найден: ${absolutePath}`)
          process.exit(1)
        }

        console.log(`🎤 Транскрибация: ${path.basename(absolutePath)}`)
        console.log(`   Модель: ${options.model}`)
        if (options.language) {
          console.log(`   Язык: ${options.language}`)
        }
        console.log("")

        const startTime = Date.now()

        // Выбор метода транскрибации
        let result: TranscriptionResult
        if (options.openai) {
          if (!apiKey) {
            console.error("Ошибка: Для использования OpenAI API требуется API ключ")
            console.error("Укажите --api-key или установите OPENAI_API_KEY")
            process.exit(1)
          }
          console.log("⏳ Использую OpenAI Whisper API...")
          result = await services.ai.whisperTranscribeOpenAI(absolutePath, {
            language: options.language,
          })
        } else {
          console.log("⏳ Использую локальный Whisper...")
          result = await services.ai.whisperTranscribeLocal(absolutePath, {
            model: options.model as "tiny" | "base" | "small" | "medium" | "large",
            language: options.language,
          })
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`✅ Готово за ${elapsed}s\n`)

        // Форматирование вывода
        let output: string
        switch (options.format) {
          case "json":
            output = JSON.stringify(result, null, 2)
            break

          case "srt":
            output = formatSRT(result.segments || [])
            break

          case "vtt":
            output = formatVTT(result.segments || [])
            break

          default:
            output = result.text
            break
        }

        // Вывод или сохранение
        if (options.output) {
          const outputPath = path.resolve(options.output)
          await fs.writeFile(outputPath, output, "utf-8")
          console.log(`📄 Сохранено: ${outputPath}`)
        } else {
          console.log("─".repeat(40))
          console.log(output)
          console.log("─".repeat(40))
        }
      } catch (error) {
        console.error(`Ошибка: ${error instanceof Error ? error.message : error}`)
        process.exit(1)
      }
    },
  )

interface TranscriptSegment {
  start: number
  end: number
  text: string
}

function formatSRT(segments: TranscriptSegment[]): string {
  return segments
    .map((segment, index) => {
      const start = formatSRTTime(segment.start)
      const end = formatSRTTime(segment.end)
      return `${index + 1}\n${start} --> ${end}\n${segment.text.trim()}\n`
    })
    .join("\n")
}

function formatVTT(segments: TranscriptSegment[]): string {
  const lines = ["WEBVTT", ""]
  for (const segment of segments) {
    const start = formatVTTTime(segment.start)
    const end = formatVTTTime(segment.end)
    lines.push(`${start} --> ${end}`)
    lines.push(segment.text.trim())
    lines.push("")
  }
  return lines.join("\n")
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`
}

function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
}
