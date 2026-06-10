import type { IUserSettingsService, UserSettingsSubscription } from "@timeline-studio/core/ports"
import type { UserSettingsContextType } from "@timeline-studio/core/types/user-settings"
import { getProjectManagementOrchestrator } from "@/domains/project-management/services/project-management-orchestrator"

export class TauriUserSettingsService implements IUserSettingsService {
  getUserSettings(): UserSettingsContextType {
    return getProjectManagementOrchestrator().getUserSettings() as unknown as UserSettingsContextType
  }

  updateUserSettings(settings: Partial<UserSettingsContextType>): void {
    getProjectManagementOrchestrator().updateUserSettings(settings as any)
  }

  subscribeToUserSettings(callback: (settings: UserSettingsContextType) => void): UserSettingsSubscription {
    return getProjectManagementOrchestrator().subscribeToUserSettings((settings) =>
      callback(settings as unknown as UserSettingsContextType),
    )
  }
}
