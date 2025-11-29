/**
 * Команда render - рендеринг проекта в видео
 */

import fs from "node:fs/promises"
import path from "node:path"
import { Command } from "commander"

import { initNodeApp } from "@/adapters/node"

export const renderCommand = new Command("render")
  .description("Рендеринг проекта Timeline Studio в видео")
  .argument("<project>", "Путь к файлу проекта (.json)")
  .argument("<output>", "Путь для выходного видео")
  .option("-q, --quality <quality>", "Качество (low, medium, high, ultra)", "high")
  .option("-f, --format <format>", "Формат видео (mp4, webm, mov)", "mp4")
  .option("--width <width>", "Ширина видео", "1920")
  .option("--height <height>", "Высота видео", "1080")
  .option("--fps <fps>", "Частота кадров", "30")
  .option("--no-audio", "Отключить аудио")
  .option("-v, --verbose", "Подробный вывод")
  .action(
    async (
      projectFile: string,
      outputFile: string,
      options: {
        quality: string
        format: string
        width: string
        height: string
        fps: string
        audio: boolean
        verbose?: boolean
      },
    ) => {
      try {
        const projectPath = path.resolve(projectFile)
        const outputPath = path.resolve(outputFile)

        // Инициализация сервисов
        const services = await initNodeApp({ autoConnect: false })

        // Проверка существования файла проекта
        const exists = await services.platform.exists(projectPath)
        if (!exists) {
          console.error(`Ошибка: Файл проекта не найден: ${projectPath}`)
          process.exit(1)
        }

        // Чтение и парсинг проекта
        console.log(`📂 Загрузка проекта: ${path.basename(projectPath)}`)
        const projectContent = await fs.readFile(projectPath, "utf-8")
        let projectSchema: unknown

        try {
          projectSchema = JSON.parse(projectContent)
        } catch {
          console.error("Ошибка: Некорректный JSON в файле проекта")
          process.exit(1)
        }

        // Настройки рендеринга
        const width = Number.parseInt(options.width, 10)
        const height = Number.parseInt(options.height, 10)
        const fps = Number.parseInt(options.fps, 10)

        console.log("\n🎬 Параметры рендеринга:")
        console.log(`   Разрешение: ${width}x${height}`)
        console.log(`   Частота:    ${fps} fps`)
        console.log(`   Качество:   ${options.quality}`)
        console.log(`   Формат:     ${options.format}`)
        console.log(`   Аудио:      ${options.audio ? "да" : "нет"}`)
        console.log(`   Выход:      ${outputPath}`)
        console.log("")

        // Запуск рендеринга
        console.log("⏳ Запуск рендеринга...")
        const startTime = Date.now()

        const jobId = await services.video.renderProject(projectSchema, outputPath)

        if (options.verbose) {
          console.log(`   Job ID: ${jobId}`)
        }

        // Мониторинг прогресса
        let lastProgress = 0
        const progressInterval = setInterval(async () => {
          try {
            const jobs = await services.video.getActiveJobs()
            const job = jobs.find((j) => j.id === jobId)

            if (job) {
              const progress = job.progress || 0
              if (progress > lastProgress) {
                lastProgress = progress
                const bar = createProgressBar(progress)
                process.stdout.write(`\r   ${bar} ${progress.toFixed(1)}%`)
              }

              if (job.status === "completed") {
                clearInterval(progressInterval)
                finishRender(startTime, outputPath)
              } else if (job.status === "failed") {
                clearInterval(progressInterval)
                console.error(`\n❌ Рендеринг не удался: ${job.error || "Неизвестная ошибка"}`)
                process.exit(1)
              }
            }
          } catch {
            // Игнорируем ошибки при проверке прогресса
          }
        }, 500)

        // Обработка завершения (для случаев когда нет отслеживания прогресса)
        process.on("SIGINT", async () => {
          console.log("\n\n⚠️  Отмена рендеринга...")
          clearInterval(progressInterval)
          await services.video.cancelRender(jobId)
          console.log("Рендеринг отменён")
          process.exit(0)
        })

        // Ожидание завершения (простой polling)
        await waitForJobCompletion(services.video, jobId, progressInterval, startTime, outputPath)
      } catch (error) {
        console.error(`\nОшибка: ${error instanceof Error ? error.message : error}`)
        process.exit(1)
      }
    },
  )

function createProgressBar(progress: number, width = 30): string {
  const filled = Math.round((progress / 100) * width)
  const empty = width - filled
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`
}

function finishRender(startTime: number, outputPath: string): void {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n\n✅ Рендеринг завершён за ${elapsed}s`)
  console.log(`📹 Видео сохранено: ${outputPath}`)
}

async function waitForJobCompletion(
  videoService: { getActiveJobs: () => Promise<Array<{ id: string; status: string; error?: string }>> },
  jobId: string,
  progressInterval: NodeJS.Timeout,
  startTime: number,
  outputPath: string,
): Promise<void> {
  const maxWait = 3600000 // 1 час
  const checkInterval = 1000
  let waited = 0

  while (waited < maxWait) {
    await new Promise((resolve) => setTimeout(resolve, checkInterval))
    waited += checkInterval

    try {
      const jobs = await videoService.getActiveJobs()
      const job = jobs.find((j) => j.id === jobId)

      if (!job) {
        // Job не найден - возможно завершился
        clearInterval(progressInterval)
        finishRender(startTime, outputPath)
        return
      }

      if (job.status === "completed") {
        clearInterval(progressInterval)
        finishRender(startTime, outputPath)
        return
      }

      if (job.status === "failed") {
        clearInterval(progressInterval)
        throw new Error(job.error || "Рендеринг не удался")
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("не удался")) {
        throw error
      }
      // Продолжаем ждать при других ошибках
    }
  }

  clearInterval(progressInterval)
  throw new Error("Превышено время ожидания рендеринга")
}
