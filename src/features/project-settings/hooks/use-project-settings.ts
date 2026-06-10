import { useContext } from "react"

import { ProjectSettingsContext, type ProjectSettingsProviderType } from "@timeline-studio/core/types/project-settings-context"

/**
 * Хук для доступа к настройкам проекта
 * Предоставляет доступ к текущим настройкам проекта и методам для их изменения
 *
 * @returns {ProjectSettingsProviderType} Объект с настройками проекта и методами для их изменения
 * @throws {Error} Если хук используется вне компонента ProjectSettingsProvider
 */
export function useProjectSettings(): ProjectSettingsProviderType {
  // Получаем значение контекста
  const context = useContext(ProjectSettingsContext)

  // Проверяем, что хук используется внутри провайдера
  if (!context) {
    throw new Error("useProjectSettings must be used within a ProjectSettingsProvider")
  }

  // Возвращаем значение контекста
  return context
}
