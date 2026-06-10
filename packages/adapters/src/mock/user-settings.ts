import type { IUserSettingsService, UserSettingsSubscription } from "@timeline-studio/core/ports"
import {
  DEFAULT_USER_SETTINGS,
  type UserSettingsColorScheme,
  type UserSettingsContextType,
} from "@timeline-studio/core/types/user-settings"

export class MockUserSettingsService implements IUserSettingsService {
  private settings: UserSettingsContextType
  private listeners = new Set<(settings: UserSettingsContextType) => void>()

  constructor(initialSettings: Partial<UserSettingsContextType> = {}) {
    this.settings = this.cloneSettings({
      ...DEFAULT_USER_SETTINGS,
      ...initialSettings,
    })
  }

  getUserSettings(): UserSettingsContextType {
    return this.cloneSettings(this.settings)
  }

  updateUserSettings(settings: Partial<UserSettingsContextType>): void {
    this.settings = this.cloneSettings({
      ...this.settings,
      ...settings,
    })
    this.notify()
  }

  subscribeToUserSettings(callback: (settings: UserSettingsContextType) => void): UserSettingsSubscription {
    this.listeners.add(callback)

    return {
      unsubscribe: () => {
        this.listeners.delete(callback)
      },
    }
  }

  private notify(): void {
    const snapshot = this.cloneSettings(this.settings)
    this.listeners.forEach((callback) => callback(snapshot))
  }

  private cloneSettings(settings: UserSettingsContextType): UserSettingsContextType {
    return {
      ...settings,
      previewSizes: { ...settings.previewSizes },
      apiKeysStatus: { ...settings.apiKeysStatus },
      aiContentDetectionTypes: [...settings.aiContentDetectionTypes],
      customColorSchemes: settings.customColorSchemes.map((scheme) => this.cloneColorScheme(scheme)),
      quickAccessSchemeIds: [...settings.quickAccessSchemeIds],
    }
  }

  private cloneColorScheme(scheme: UserSettingsColorScheme): UserSettingsColorScheme {
    return {
      ...scheme,
      light: { ...scheme.light },
      dark: { ...scheme.dark },
    }
  }
}
