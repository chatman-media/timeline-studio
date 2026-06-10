/**
 * UpdateService - совместимый фасад поверх core container.
 *
 * @deprecated Используйте core container или хук useUpdateManager.
 * Этот файл оставлен для обратной совместимости и будет удален в будущих версиях
 */

import { container } from "@timeline-studio/core/container"
import type { IUpdateService } from "@timeline-studio/core/ports"

export type { IUpdateService as UpdateService } from "@timeline-studio/core/ports"

export const updateService: IUpdateService = {
  checkForUpdates: (...args) => container.getUpdate().checkForUpdates(...args),
  downloadAndInstall: (...args) => container.getUpdate().downloadAndInstall(...args),
  getCurrentVersion: (...args) => container.getUpdate().getCurrentVersion(...args),
  isUpdaterAvailable: (...args) => container.getUpdate().isUpdaterAvailable(...args),
  enableAutoCheck: (...args) => container.getUpdate().enableAutoCheck(...args),
  disableAutoCheck: (...args) => container.getUpdate().disableAutoCheck(...args),
  getCurrentStatus: (...args) => container.getUpdate().getCurrentStatus(...args),
  subscribe: (...args) => container.getUpdate().subscribe(...args),
  reset: (...args) => container.getUpdate().reset(...args),
  getAutoCheckSettings: (...args) => container.getUpdate().getAutoCheckSettings(...args),
  dispose: (...args) => container.getUpdate().dispose(...args),
}
