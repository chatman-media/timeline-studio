#!/usr/bin/env node
/**
 * Timeline Studio CLI
 *
 * Командная строка для работы с медиафайлами и проектами.
 * Использует Node.js адаптеры для всех операций.
 *
 * @example
 * ```bash
 * # Получить информацию о файле
 * npx ts-node src/cli/index.ts info video.mp4
 *
 * # Транскрибировать аудио/видео
 * npx ts-node src/cli/index.ts transcribe video.mp4 -l ru
 *
 * # Рендеринг проекта
 * npx ts-node src/cli/index.ts render project.json output.mp4
 * ```
 */

import { Command } from "commander"

import { infoCommand } from "./commands/info"
import { renderCommand } from "./commands/render"
import { renderJobCommand } from "./commands/render-job"
import { transcribeCommand } from "./commands/transcribe"

const program = new Command()

program.name("timeline-studio").description("Timeline Studio CLI - инструменты для работы с медиа").version("1.0.0")

// Регистрация команд
program.addCommand(infoCommand)
program.addCommand(transcribeCommand)
program.addCommand(renderCommand)
program.addCommand(renderJobCommand)

// Запуск
program.parse(process.argv)

// Если команда не указана - показать help
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
