import { container } from "../container"
import type { IUserSettingsService, UserSettingsSubscription } from "../ports/user-settings.port"

export type { IUserSettingsService, UserSettingsSubscription }

export function getUserSettingsService(): IUserSettingsService {
  return container.getUserSettings()
}
