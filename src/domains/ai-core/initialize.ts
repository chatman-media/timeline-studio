/**
 * AI Core Initialization
 *
 * Инициализация AI Core домена с регистрацией всех сервисов
 */

import { getAIContainer } from "./container"
import { registerAIProviders } from "./providers"
import { registerAICoreServices } from "./services"
import type { AIServiceConfig } from "./types"

/**
 * Инициализирует AI Core с полной регистрацией сервисов
 */
export async function initializeAICoreWithPlugins(config?: AIServiceConfig) {
  const container = getAIContainer()

  // Конфигурируем если передана конфигурация
  if (config) {
    container.configure(config)
  }

  // Регистрируем провайдеры
  registerAIProviders(container)

  // Регистрируем core сервисы
  registerAICoreServices(container)

  // Инициализируем контейнер
  await container.initialize()

  return container
}
