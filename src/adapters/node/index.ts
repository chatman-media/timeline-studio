/**
 * Node.js Adapters
 *
 * Реализации сервисов для Node.js окружения (CLI, тесты, серверы).
 * Использует нативные Node.js модули и CLI инструменты.
 */

import { container } from "@/core/container"

import { NodeMediaService } from "./media"

export { NodeMediaService } from "./media"

/**
 * Инициализация приложения с Node.js адаптерами.
 * Используется для CLI инструментов и серверного окружения.
 *
 * @returns Объект с сервисами для программного доступа
 */
export function initNodeApp(): {
  media: NodeMediaService
} {
  // Create Node.js services
  const media = new NodeMediaService()

  // Register in container
  container.registerMedia(media)

  // Return services for programmatic access
  return { media }
}
