/**
 * Version control manager component
 * Main interface for version control functionality
 */

import { AlertCircle, Clock, GitBranch, GitCommit, GitMerge, History, Settings } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useVersionControl } from "@/features/version-control/hooks"

import { VersionHistoryPanel } from "./version-history-panel"

interface VersionControlManagerProps {
  className?: string
}

export function VersionControlManager({ className }: VersionControlManagerProps) {
  const { t } = useTranslation()
  const {
    currentVersionId,
    branchName,
    hasUncommittedChanges,
    lastSnapshotTime,
    autoSaveEnabled,
    autoSaveIntervalSeconds,
    isLoading,
    error,
  } = useVersionControl()

  const [activeTab, setActiveTab] = useState("history")

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              {t("dialogs.userSettings.versionControl.title")}
            </div>
            <div className="flex items-center gap-2">
              {hasUncommittedChanges && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t("dialogs.userSettings.versionControl.hasChanges")}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {currentVersionId.slice(0, 8)}
              </Badge>
            </div>
          </CardTitle>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span>{branchName}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {t("dialogs.userSettings.versionControl.autoSave", {
                  enabled: autoSaveEnabled
                    ? t("dialogs.userSettings.versionControl.autoSaveEnabled", { interval: autoSaveIntervalSeconds })
                    : t("dialogs.userSettings.versionControl.autoSaveDisabled"),
                })}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-3 w-3" />
                {t("dialogs.userSettings.versionControl.tabs.history")}
              </TabsTrigger>
              <TabsTrigger value="branches" className="flex items-center gap-2">
                <GitBranch className="h-3 w-3" />
                {t("dialogs.userSettings.versionControl.tabs.branches")}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-3 w-3" />
                {t("dialogs.userSettings.versionControl.tabs.settings")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              <VersionHistoryPanel />
            </TabsContent>

            <TabsContent value="branches" className="mt-4">
              <BranchManager />
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <VersionControlSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Branch management component
export function BranchManager() {
  const { t } = useTranslation()
  const { branchName, createBranch, switchBranch, isLoading } = useVersionControl()

  const [newBranchName, setNewBranchName] = useState("")

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return

    const success = await createBranch(newBranchName.trim())
    if (success) {
      setNewBranchName("")
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">{t("dialogs.userSettings.versionControl.branches.title")}</h4>
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <GitBranch className="h-4 w-4" />
          <span className="font-medium">{branchName}</span>
          <Badge variant="secondary">{t("dialogs.userSettings.versionControl.branches.active")}</Badge>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">{t("dialogs.userSettings.versionControl.branches.createNew")}</h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t("dialogs.userSettings.versionControl.branches.namePlaceholder")}
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border rounded-md"
            disabled={isLoading}
          />
          <Button onClick={handleCreateBranch} disabled={isLoading || !newBranchName.trim()} size="sm">
            <GitBranch className="h-3 w-3 mr-1" />
            {t("dialogs.userSettings.versionControl.branches.create")}
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">{t("dialogs.userSettings.versionControl.branches.merge")}</h4>
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <GitMerge className="h-4 w-4 inline mr-2" />
          {t("dialogs.userSettings.versionControl.branches.mergeNotImplemented")}
        </div>
      </div>
    </div>
  )
}

// Version control settings component
export function VersionControlSettings() {
  const { t } = useTranslation()
  const { autoSaveEnabled, autoSaveIntervalSeconds, enableAutoSave, setAutoSaveInterval, isLoading } =
    useVersionControl()

  const intervalOptions = [
    { value: 30, label: t("dialogs.userSettings.versionControl.settings.intervals.30") },
    { value: 60, label: t("dialogs.userSettings.versionControl.settings.intervals.60") },
    { value: 120, label: t("dialogs.userSettings.versionControl.settings.intervals.120") },
    { value: 300, label: t("dialogs.userSettings.versionControl.settings.intervals.300") },
    { value: 600, label: t("dialogs.userSettings.versionControl.settings.intervals.600") },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-3">{t("dialogs.userSettings.versionControl.settings.autoSaveTitle")}</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium text-sm">
                {t("dialogs.userSettings.versionControl.settings.enableAutoSave")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("dialogs.userSettings.versionControl.settings.enableAutoSaveDesc")}
              </div>
            </div>
            <Button
              variant={autoSaveEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => enableAutoSave(!autoSaveEnabled)}
              disabled={isLoading}
            >
              {autoSaveEnabled
                ? t("dialogs.userSettings.versionControl.settings.enabled")
                : t("dialogs.userSettings.versionControl.settings.disabled")}
            </Button>
          </div>

          {autoSaveEnabled && (
            <div className="p-3 border rounded-lg">
              <div className="font-medium text-sm mb-2">
                {t("dialogs.userSettings.versionControl.settings.intervalTitle")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {intervalOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={autoSaveIntervalSeconds === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoSaveInterval(option.value)}
                    disabled={isLoading}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">{t("dialogs.userSettings.versionControl.settings.storage.title")}</h4>
        <div className="space-y-2 p-3 border rounded-lg">
          <div className="flex justify-between text-sm">
            <span>{t("dialogs.userSettings.versionControl.settings.storage.maxVersions")}</span>
            <span>{t("dialogs.userSettings.versionControl.settings.storage.maxVersionsValue")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{t("dialogs.userSettings.versionControl.settings.storage.compression")}</span>
            <span>{t("dialogs.userSettings.versionControl.settings.storage.compressionValue")}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {t("dialogs.userSettings.versionControl.settings.storage.compressionDesc")}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">
          {t("dialogs.userSettings.versionControl.settings.exportImport.title")}
        </h4>
        <div className="space-y-2">
          <Button variant="outline" size="sm" disabled>
            {t("dialogs.userSettings.versionControl.settings.exportImport.export")}
          </Button>
          <Button variant="outline" size="sm" disabled>
            {t("dialogs.userSettings.versionControl.settings.exportImport.import")}
          </Button>
          <div className="text-xs text-muted-foreground">
            {t("dialogs.userSettings.versionControl.settings.exportImport.notImplemented")}
          </div>
        </div>
      </div>
    </div>
  )
}
