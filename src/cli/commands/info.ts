/**
 * Команда info - получение информации о медиафайле
 */

import crypto from "node:crypto"
import path from "node:path"
import { Command } from "commander"

import { initNodeApp } from "@timeline-studio/adapters/node"
import type { MediaMetadata } from "@timeline-studio/core/ports"

export const infoCommand = new Command("info")
  .description("Получить информацию о медиафайле")
  .argument("<file>", "Путь к медиафайлу")
  .option("-j, --json", "Вывод в формате JSON")
  .option("-t, --thumbnail <path>", "Сохранить превью в указанный путь")
  .action(async (file: string, options: { json?: boolean; thumbnail?: string }) => {
    try {
      // Инициализация сервисов
      const services = await initNodeApp({ autoConnect: false })

      // Получение абсолютного пути
      const absolutePath = path.resolve(file)

      // Проверка существования файла
      const exists = await services.platform.exists(absolutePath)
      if (!exists) {
        console.error(`Ошибка: Файл не найден: ${absolutePath}`)
        process.exit(1)
      }

      // Получение метаданных
      const metadata = await services.media.getMetadata(absolutePath)

      if (options.json) {
        console.log(JSON.stringify(metadata, null, 2))
      } else {
        printMetadata(absolutePath, metadata)
      }

      // Генерация превью если запрошено
      if (options.thumbnail) {
        const targetPath = path.resolve(options.thumbnail)
        const fileId = crypto.randomUUID()
        const generatedPath = await services.media.generateThumbnail(fileId, absolutePath, {
          timestamp: 0,
          width: 320,
          height: 180,
        })
        // Копируем сгенерированный thumbnail в указанный путь
        const fs = await import("node:fs/promises")
        await fs.copyFile(generatedPath, targetPath)
        console.log(`✅ Превью сохранено: ${targetPath}`)
      }
    } catch (error) {
      console.error(`Ошибка: ${error instanceof Error ? error.message : error}`)
      process.exit(1)
    }
  })

function printMetadata(absolutePath: string, metadata: MediaMetadata): void {
  console.log("\n📁 Информация о файле:")
  console.log("─".repeat(40))
  console.log(`  Путь:        ${absolutePath}`)
  console.log(`  Имя:         ${path.basename(absolutePath)}`)
  console.log(`  Тип:         ${metadata.type}`)

  if (metadata.type === "Video") {
    if (metadata.duration !== undefined) {
      console.log(`  Длительность: ${formatDuration(metadata.duration)}`)
    }
    if (metadata.width !== undefined && metadata.height !== undefined) {
      console.log(`  Разрешение:  ${metadata.width}x${metadata.height}`)
    }
    if (metadata.fps !== undefined) {
      console.log(`  Частота:     ${metadata.fps} fps`)
    }
    if (metadata.codec) {
      console.log(`  Кодек:       ${metadata.codec}`)
    }
    if (metadata.bitrate !== undefined) {
      console.log(`  Битрейт:     ${formatBitrate(metadata.bitrate)}`)
    }
    if (metadata.size !== undefined) {
      console.log(`  Размер:      ${formatFileSize(metadata.size)}`)
    }
  } else if (metadata.type === "Audio") {
    if (metadata.duration !== undefined) {
      console.log(`  Длительность: ${formatDuration(metadata.duration)}`)
    }
    if (metadata.codec) {
      console.log(`  Кодек:       ${metadata.codec}`)
    }
    if (metadata.sample_rate !== undefined) {
      console.log(`  Sample rate: ${metadata.sample_rate} Hz`)
    }
    if (metadata.channels !== undefined) {
      console.log(`  Каналы:      ${metadata.channels}`)
    }
    if (metadata.bitrate !== undefined) {
      console.log(`  Битрейт:     ${formatBitrate(metadata.bitrate)}`)
    }
    if (metadata.size !== undefined) {
      console.log(`  Размер:      ${formatFileSize(metadata.size)}`)
    }
  } else if (metadata.type === "Image") {
    if (metadata.width !== undefined && metadata.height !== undefined) {
      console.log(`  Разрешение:  ${metadata.width}x${metadata.height}`)
    }
  }

  console.log("")
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
}

function formatBitrate(bps: number): string {
  if (bps >= 1_000_000) {
    return `${(bps / 1_000_000).toFixed(2)} Mbps`
  }
  if (bps >= 1000) {
    return `${(bps / 1000).toFixed(0)} kbps`
  }
  return `${bps} bps`
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${bytes} bytes`
}
