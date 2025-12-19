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
    <Card className={className} data-oid="s:ird-g">
      <CardHeader data-oid="n6zu-tr">
        <CardTitle className="flex items-center gap-2" data-oid="l5t58np">
          <History className="h-4 w-4" data-oid=".g:p3o1" />
          {t("dialogs.userSettings.versionControl.history.title")}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground" data-oid="el1-w2d">
          <GitBranch className="h-3 w-3" data-oid="ps4w-q-" />
          <span data-oid="kfx9j-:">
            {t("dialogs.userSettings.versionControl.history.branch", {
              name: branchName,
            })}
          </span>
          <Badge variant="outline" className="text-xs" data-oid="pv_wxry">
            {currentVersionId}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4" data-oid="i316oc8">
        {/* Auto-save status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-oid="zvoxo66">
          <div className="flex items-center gap-2 text-sm" data-oid=".ak9d_5">
            <Clock className="h-3 w-3" data-oid="2p_cvzy" />
            <span data-oid="gt.fudk">
              {t("dialogs.userSettings.versionControl.autoSave", {
                enabled: autoSaveEnabled
                  ? t("dialogs.userSettings.versionControl.autoSaveEnabled", {
                      interval: autoSaveIntervalSeconds,
                    })
                  : t("dialogs.userSettings.versionControl.autoSaveDisabled"),
              })}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAutoSaveSettings(!showAutoSaveSettings)}
            data-oid="dk64pjt"
          >
            <Settings className="h-3 w-3" data-oid="s:98.8d" />
          </Button>
        </div>

        {/* Auto-save settings */}
        {showAutoSaveSettings && (
          <div className="space-y-3 p-3 border rounded-lg" data-oid="svbhlf4">
            <div className="flex items-center justify-between" data-oid="0pmnfn3">
              <label className="text-sm" data-oid="s0oa:yo">
                {t("dialogs.userSettings.versionControl.settings.enableAutoSave")}
              </label>
              <Button
                variant={autoSaveEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleToggleAutoSave}
                disabled={isLoading}
                data-oid="dolts4:"
              >
                {autoSaveEnabled
                  ? t("dialogs.userSettings.versionControl.settings.enabled")
                  : t("dialogs.userSettings.versionControl.settings.disabled")}
              </Button>
            </div>

            {autoSaveEnabled && (
              <div className="space-y-2" data-oid="8q.z:p0">
                <label className="text-sm" data-oid="g0u-9u9">
                  {t("dialogs.userSettings.versionControl.settings.intervalTitle")}
                </label>
                <div className="flex gap-2" data-oid="o52k6v9">
                  {[30, 60, 120, 300].map((interval) => (
                    <Button
                      key={interval}
                      variant={autoSaveIntervalSeconds === interval ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleIntervalChange(interval)}
                      disabled={isLoading}
                      data-oid="6_3x82a"
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
        <div className="space-y-2" data-oid="jcpfixs">
          <div className="flex gap-2" data-oid="-b91yvs">
            <input
              type="text"
              placeholder={t("dialogs.userSettings.versionControl.history.placeholder")}
              value={snapshotMessage}
              onChange={(e) => setSnapshotMessage(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border rounded-md"
              disabled={isLoading}
              data-oid="r9-ffx-"
            />

            <Button onClick={handleCreateSnapshot} disabled={isLoading} size="sm" data-oid="0_u1:no">
              <Plus className="h-3 w-3 mr-1" data-oid="ng4c5q:" />
              {t("dialogs.userSettings.versionControl.history.create")}
            </Button>
          </div>
        </div>

        <Separator data-oid="p9cq6-q" />

        {/* Version history */}
        <div className="space-y-2" data-oid="f5lz_do">
          <h4 className="text-sm font-medium" data-oid="4o5lyzm">
            {t("dialogs.userSettings.versionControl.history.title")}
          </h4>

          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded" data-oid="vr.aknv">
              {error}
            </div>
          )}

          <ScrollArea className="h-64" data-oid="tmjy8vx">
            {loadingVersions ? (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground" data-oid="aq6srnp">
                {t("dialogs.userSettings.versionControl.history.loading")}
              </div>
            ) : versions.length === 0 ? (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground" data-oid="srkea_0">
                {t("dialogs.userSettings.versionControl.history.noVersions")}
              </div>
            ) : (
              <div className="space-y-2" data-oid="qkbv4_i">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 border rounded-lg space-y-2 ${
                      version.id === currentVersionId ? "bg-blue-50 border-blue-200" : "hover:bg-muted/50"
                    }`}
                    data-oid="h8-dt1t"
                  >
                    <div className="flex items-center justify-between" data-oid="wb-f-o1">
                      <div className="flex items-center gap-2" data-oid="py4t.u3">
                        <Badge
                          variant={version.id === currentVersionId ? "default" : "outline"}
                          className="text-xs"
                          data-oid="0o2dkag"
                        >
                          {version.id.slice(0, 8)}
                        </Badge>
                        {version.id === currentVersionId && (
                          <Badge variant="secondary" className="text-xs" data-oid="xs5ifor">
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
                          data-oid="38_lzv."
                        >
                          <RotateCcw className="h-3 w-3" data-oid="_:w5vnh" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1" data-oid="roix2s1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground" data-oid="58_j5pr">
                        <User className="h-3 w-3" data-oid="w-goczh" />
                        <span data-oid="zyxrvy8">{version.author}</span>
                        <Clock className="h-3 w-3" data-oid="r31pw5j" />
                        <span data-oid="eanxxev">{formatTimeAgo(new Date(version.timestamp), t)}</span>
                      </div>

                      {version.message && (
                        <div className="flex items-start gap-2 text-xs" data-oid="5aa86jd">
                          <MessageCircle className="h-3 w-3 mt-0.5 shrink-0" data-oid="yquz30n" />
                          <span className="text-foreground" data-oid="do81us0">
                            {version.message}
                          </span>
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
          <div className="text-xs text-muted-foreground" data-oid="_rqz80a">
            {t("dialogs.userSettings.versionControl.history.lastSnapshot", {
              time: formatTimeAgo(new Date(lastSnapshotTime), t),
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
