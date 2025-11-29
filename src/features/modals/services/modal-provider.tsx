/**
 * Modal Provider - Deprecated Wrapper
 *
 * УСТАРЕЛО: Используйте useModals() напрямую из @/domains/system-integration
 *
 * Этот файл сохранен только для обратной совместимости с Providers композитом.
 * ModalProvider теперь является пустым pass-through компонентом,
 * так как вся логика модальных окон управляется через SystemIntegrationOrchestrator.
 */

import type { ReactNode } from "react"

// Re-export types from domain for backward compatibility
export type { ModalData, ModalType } from "@/domains/system-integration"

/**
 * Пропсы для провайдера модальных окон
 */
interface ModalProviderProps {
  children: ReactNode
}

/**
 * Провайдер для модальных окон (deprecated)
 *
 * @deprecated Используйте useModals() напрямую из @/domains/system-integration
 *
 * Этот провайдер больше не содержит логики и служит только для
 * обратной совместимости. SystemIntegrationOrchestrator управляет
 * всем состоянием модальных окон глобально.
 */
export function ModalProvider({ children }: ModalProviderProps) {
  return <>{children}</>
}

/**
 * @deprecated Используйте useModals() из @/domains/system-integration
 *
 * Этот хук оставлен только для обратной совместимости.
 * Все новые компоненты должны использовать useModals() напрямую.
 */
export { useModals as useModal } from "@/domains/system-integration"
