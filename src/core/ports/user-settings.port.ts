import type { UserSettingsContextType } from "../types/user-settings"

export interface UserSettingsSubscription {
  unsubscribe: () => void
}

export interface IUserSettingsService {
  getUserSettings: () => UserSettingsContextType
  updateUserSettings: (settings: Partial<UserSettingsContextType>) => void
  subscribeToUserSettings: (callback: (settings: UserSettingsContextType) => void) => UserSettingsSubscription
}
