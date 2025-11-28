/**
 * Version history panel component
 * Provides UI for viewing and managing project versions
 */

import { Clock, GitBranch, History, MessageCircle, Plus, RotateCcw, Settings, User } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useVersionControl } from "@/features/version-control/hooks"

import type { VersionInfo } from "../types"

// Time formatting function with i18n support
const formatTimeAgo = (date: Date, t: (key: string, params?: any) => string): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return t("dialogs.userSettings.versionControl.history.timeAgo.justNow")
  if (diffMinutes < 60)
    return t("dialogs.userSettings.versionControl.history.timeAgo.minutesAgo", {
      count: diffMinutes,
    })
  if (diffHours < 24)
    return t("dialogs.userSettings.versionControl.history.timeAgo.hoursAgo", {
      count: diffHours,
    })
  if (diffDays < 30)
    return t("dialogs.userSettings.versionControl.history.timeAgo.daysAgo", {
      count: diffDays,
    })
  return date.toLocaleDateString()
}

interface VersionHistoryPanelProps {
  className?: string
}

export function VersionHistoryPanel({ className }: VersionHistoryPanelProps) {
  const { t } = useTranslation()
  const {
    currentVersionId,
    branchName,
    lastSnapshotTime,
    autoSaveEnabled,
    autoSaveIntervalSeconds,
    isLoading,
    error,
    createSnapshot,
    restoreVersion,
    getVersionHistory,
    enableAutoSave,
    setAutoSaveInterval,
  } = useVersionControl()

  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [snapshotMessage, setSnapshotMessage] = useState("")
  const [showAutoSaveSettings, setShowAutoSaveSettings] = useState(false)

  // Load version history
  const loadVersionHistory = useCallback(async () => {
    setLoadingVersions(true)
    try {
      const history = await getVersionHistory(20) // Last 20 versions
      if (history) {
        setVersions(history)
      }
    } finally {
      setLoadingVersions(false)
    }
  }, [getVersionHistory])

  // Load history on mount and when current version changes
  useEffect(() => {
    void loadVersionHistory()
  }, [loadVersionHistory, currentVersionId])

  // Handle create snapshot
  const handleCreateSnapshot = useCallback(async () => {
    const success = await createSnapshot(snapshotMessage || undefined)
    if (success) {
      setSnapshotMessage("")
      void loadVersionHistory() // Refresh list
    }
  }, [createSnapshot, snapshotMessage, loadVersionHistory])

  // Handle restore version
  const handleRestoreVersion = useCallback(
    async (versionId: string) => {
      if (
        window.confirm(
          t("dialogs.userSettings.versionControl.history.restoreConfirm", {
            id: versionId.slice(0, 8),
          }),
        )
      ) {
        const success = await restoreVersion(versionId)
        if (success) {
          void loadVersionHistory() // Refresh list
        }
      }
    },
    [restoreVersion, loadVersionHistory, t],
  )

  // Handle auto-save toggle
  const handleToggleAutoSave = useCallback(async () => {
    await enableAutoSave(!autoSaveEnabled)
  }, [enableAutoSave, autoSaveEnabled])

  // Handle auto-save interval change
  const handleIntervalChange = useCallback(
    async (newInterval: number) => {
      await setAutoSaveInterval(newInterval)
    },
    [setAutoSaveInterval],
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4" />
          {t("dialogs.userSettings.versionControl.history.title")}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitBranch className="h-3 w-3" />
          <span>
            {t("dialogs.userSettings.versionControl.history.branch", {
              name: branchName,
            })}
          </span>
          <Badge variant="outline" className="text-xs">
            {currentVersionId}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Auto-save status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3 w-3" />
            <span>
              {t("dialogs.userSettings.versionControl.autoSave", {
                enabled: autoSaveEnabled
                  ? t("dialogs.userSettings.versionControl.autoSaveEnabled", {
                      interval: autoSaveIntervalSeconds,
                    })
                  : t("dialogs.userSettings.versionControl.autoSaveDisabled"),
              })}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowAutoSaveSettings(!showAutoSaveSettings)}>
            <Settings className="h-3 w-3" />
          </Button>
        </div>

        {/* Auto-save settings */}
        {showAutoSaveSettings && (
          <div className="space-y-3 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm">{t("dialogs.userSettings.versionControl.settings.enableAutoSave")}</label>
              <Button
                variant={autoSaveEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleToggleAutoSave}
                disabled={isLoading}
              >
                {autoSaveEnabled
                  ? t("dialogs.userSettings.versionControl.settings.enabled")
                  : t("dialogs.userSettings.versionControl.settings.disabled")}
              </Button>
            </div>

            {autoSaveEnabled && (
              <div className="space-y-2">
                <label className="text-sm">{t("dialogs.userSettings.versionControl.settings.intervalTitle")}</label>
                <div className="flex gap-2">
                  {[30, 60, 120, 300].map((interval) => (
                    <Button
                      key={interval}
                      variant={autoSaveIntervalSeconds === interval ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleIntervalChange(interval)}
                      disabled={isLoading}
                    >
                      {interval}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create snapshot */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t("dialogs.userSettings.versionControl.history.placeholder")}
              value={snapshotMessage}
              onChange={(e) => setSnapshotMessage(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border rounded-md"
              disabled={isLoading}
            />
            <Button onClick={handleCreateSnapshot} disabled={isLoading} size="sm">
              <Plus className="h-3 w-3 mr-1" />
              {t("dialogs.userSettings.versionControl.history.create")}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Version history */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t("dialogs.userSettings.versionControl.history.title")}</h4>

          {error && <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{error}</div>}

          <ScrollArea className="h-64">
            {loadingVersions ? (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                {t("dialogs.userSettings.versionControl.history.loading")}
              </div>
            ) : versions.length === 0 ? (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                {t("dialogs.userSettings.versionControl.history.noVersions")}
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 border rounded-lg space-y-2 ${
                      version.id === currentVersionId ? "bg-blue-50 border-blue-200" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={version.id === currentVersionId ? "default" : "outline"} className="text-xs">
                          {version.id.slice(0, 8)}
                        </Badge>
                        {version.id === currentVersionId && (
                          <Badge variant="secondary" className="text-xs">
                            {t("dialogs.userSettings.versionControl.history.current")}
                          </Badge>
                        )}
                      </div>

                      {version.id !== currentVersionId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestoreVersion(version.id)}
                          disabled={isLoading}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{version.author}</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(new Date(version.timestamp), t)}</span>
                      </div>

                      {version.message && (
                        <div className="flex items-start gap-2 text-xs">
                          <MessageCircle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="text-foreground">{version.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Last snapshot info */}
        {lastSnapshotTime && (
          <div className="text-xs text-muted-foreground">
            {t("dialogs.userSettings.versionControl.history.lastSnapshot", {
              time: formatTimeAgo(new Date(lastSnapshotTime), t),
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
