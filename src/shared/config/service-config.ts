/**
 * Конфигурация для управления доменными сервисами
 * Позволяет быстро отключить все доменные сервисы при проблемах с производительностью
 */

export const SERVICE_CONFIG = {
  // Глобальный флаг для отключения всех доменных сервисов
  DISABLE_ALL_DOMAIN_SERVICES: true,

  // Индивидуальные флаги для конкретных сервисов (работают только если DISABLE_ALL_DOMAIN_SERVICES = false)
  SERVICES: {
    AUTO_SAVE: false,
    AUTO_SNAPSHOT: false,
    AUTO_UPDATE: false,
    NOTIFICATIONS: false,
    FEATURES: false,
    UNDO_REDO: false,
    AI_SERVICES: false,
    BACKGROUND_SYNC: false,
    // Video and Timeline Services
    VIDEO_PLAYER: true,
    TIMELINE_PLAYER: true,
  },
} as const

export function isServiceEnabled(serviceName: keyof typeof SERVICE_CONFIG.SERVICES): boolean {
  if (SERVICE_CONFIG.DISABLE_ALL_DOMAIN_SERVICES) {
    return false
  }
  return SERVICE_CONFIG.SERVICES[serviceName]
}
