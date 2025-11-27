import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { container } from "@/core"
import { useNotifications } from "@/domains/system-integration"
import { logError, logInfo } from "@/lib/tauri-logger"

import { SOCIAL_NETWORKS } from "../constants/export-constants"
import * as SocialNetworksService from "../services/social-networks-service"
import {
  getNetworkLimits as getNetworkLimitsFromService,
  getOptimalSettings as getOptimalSettingsFromService,
  validateExportSettings,
} from "../services/social-validation-service"
import type { SocialExportSettings } from "../types/export-types"

export function useSocialExport() {
  logInfo("[useSocialExport] Инициализация хука")

  const { t } = useTranslation()
  const { showError, showSuccess } = useNotifications()
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])

  const loginToSocialNetwork = useCallback(
    async (network: string) => {
      try {
        const success = await SocialNetworksService.login(network)
        return success
      } catch (error) {
        logError(`[useSocialExport] Ошибка входа в ${network}: ${String(error)}`)
        showError(t("dialogs.export.errors.loginFailed", { network }), "")
        return false
      }
    },
    [showError, t],
  )

  const logoutFromSocialNetwork = useCallback(async (network: string) => {
    await SocialNetworksService.logout(network)
  }, [])

  const isLoggedIn = useCallback(async (network: string) => {
    return await SocialNetworksService.isLoggedIn(network)
  }, [])

  const getUserInfo = useCallback((network: string) => {
    return SocialNetworksService.getStoredUserInfo(network)
  }, [])

  const uploadToSocialNetwork = useCallback(
    async (videoPath: string, settings: SocialExportSettings) => {
      const network = SOCIAL_NETWORKS.find((n) => n.id === settings.socialNetwork)

      if (!network) {
        throw new Error("Unknown social network")
      }

      if (!platform) {
        throw new Error("Platform service not available")
      }

      try {
        setIsUploading(true)
        setUploadProgress(0)

        // Читаем файл через Platform service
        const fileData = await platform.readFile(videoPath)
        const videoBlob = new Blob([fileData as BlobPart], { type: "video/mp4" })

        const result = await SocialNetworksService.uploadVideo(
          network.id,
          videoBlob,
          settings as any,
          (progress: number) => {
            setUploadProgress(progress)
          },
        )

        setIsUploading(false)
        setUploadProgress(100)

        showSuccess(t("dialogs.export.uploadSuccess", { network: network.name }), "")
        return result
      } catch (error) {
        setIsUploading(false)
        logError(`[useSocialExport] Ошибка загрузки в ${network.name}: ${String(error)}`)
        showError(t("dialogs.export.errors.uploadFailed", { network: network.name }), "")
        throw error
      }
    },
    [platform, showError, showSuccess, t],
  )

  const validateSocialExport = useCallback(
    (settings: SocialExportSettings, videoFile?: { size: number; duration: number; format: string }) => {
      const network = SOCIAL_NETWORKS.find((n) => n.id === settings.socialNetwork)
      if (!network) {
        return { valid: false, error: "Unknown social network" }
      }

      const validation = validateExportSettings(network.id, settings, videoFile)

      if (!validation.isValid) {
        return {
          valid: false,
          error: validation.errors[0] || "Validation failed",
          errors: validation.errors,
          warnings: validation.warnings,
          suggestions: validation.suggestions,
        }
      }

      return {
        valid: true,
        warnings: validation.warnings,
        suggestions: validation.suggestions,
      }
    },
    [],
  )

  const getOptimalSettings = useCallback((networkId: string) => {
    return getOptimalSettingsFromService(networkId)
  }, [])

  const getNetworkLimits = useCallback((networkId: string) => {
    return getNetworkLimitsFromService(networkId)
  }, [])

  return {
    loginToSocialNetwork,
    logoutFromSocialNetwork,
    isLoggedIn,
    getUserInfo,
    uploadToSocialNetwork,
    validateSocialExport,
    getOptimalSettings,
    getNetworkLimits,
    uploadProgress,
    isUploading,
  }
}
