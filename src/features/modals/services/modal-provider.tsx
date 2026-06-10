/**
 * Modal Provider - Deprecated Wrapper
 *
 * УСТАРЕЛО: Используйте useModals() из @/features/modals/services
 *
 * Этот файл сохранен только для обратной совместимости с Providers композитом.
 * ModalProvider теперь является пустым pass-through компонентом,
 * так как вся логика модальных окон управляется через SystemIntegrationOrchestrator.
 */

import type { ReactNode } from "react"

// Re-export types for backward compatibility.
export type { ModalData, ModalType } from "@/core/types/modals"

/**
 * Пропсы для провайдера модальных окон
 */
interface ModalProviderProps {
  children: ReactNode
}

/**
 * Провайдер для модальных окон (deprecated)
 *
 * @deprecated Используйте useModals() из @/features/modals/services
 *
 * Этот провайдер больше не содержит логики и служит только для
 * обратной совместимости. SystemIntegrationOrchestrator управляет
 * всем состоянием модальных окон глобально.
 */
export function ModalProvider({ children }: ModalProviderProps) {
  return <>{children}</>
}

/**
 * @deprecated Используйте useModals() из @/features/modals/services
 *
 * Этот хук оставлен только для обратной совместимости.
 * Все новые компоненты должны использовать useModals() из feature-facing compatibility layer.
 */
export { useModals, useModals as useModal } from "@/domains/system-integration"
