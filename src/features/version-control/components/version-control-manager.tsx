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
    <div className={className} data-oid="p8n0bp.">
      <Card data-oid="s0ag-4t">
        <CardHeader data-oid="eot9mj_">
          <CardTitle className="flex items-center justify-between" data-oid="ar27taq">
            <div className="flex items-center gap-2" data-oid="v02:igh">
              <GitCommit className="h-5 w-5" data-oid="ir:0i19" />
              {t("dialogs.userSettings.versionControl.title")}
            </div>
            <div className="flex items-center gap-2" data-oid="gy6y-xf">
              {hasUncommittedChanges && (
                <Badge variant="destructive" className="text-xs" data-oid="-0nhezw">
                  <AlertCircle className="h-3 w-3 mr-1" data-oid="qu:r2_7" />
                  {t("dialogs.userSettings.versionControl.hasChanges")}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs" data-oid="5dvegta">
                {currentVersionId.slice(0, 8)}
              </Badge>
            </div>
          </CardTitle>

          <div className="flex items-center gap-4 text-sm text-muted-foreground" data-oid="jne._6:">
            <div className="flex items-center gap-1" data-oid="m_pso0z">
              <GitBranch className="h-3 w-3" data-oid="c5s4hrc" />
              <span data-oid="uz8o_0k">{branchName}</span>
            </div>

            <div className="flex items-center gap-1" data-oid="i4.w95x">
              <Clock className="h-3 w-3" data-oid="fytt-3n" />
              <span data-oid="w23ndzq">
                {t("dialogs.userSettings.versionControl.autoSave", {
                  enabled: autoSaveEnabled
                    ? t("dialogs.userSettings.versionControl.autoSaveEnabled", {
                        interval: autoSaveIntervalSeconds,
                      })
                    : t("dialogs.userSettings.versionControl.autoSaveDisabled"),
                })}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent data-oid="yw2-:7g">
          <Tabs value={activeTab} onValueChange={setActiveTab} data-oid="6e_dvym">
            <TabsList className="grid w-full grid-cols-3" data-oid="5msp._:">
              <TabsTrigger value="history" className="flex items-center gap-2" data-oid="dp_.m_x">
                <History className="h-3 w-3" data-oid="ybd-e9v" />
                {t("dialogs.userSettings.versionControl.tabs.history")}
              </TabsTrigger>
              <TabsTrigger value="branches" className="flex items-center gap-2" data-oid="5yjkull">
                <GitBranch className="h-3 w-3" data-oid="8:ya2_d" />
                {t("dialogs.userSettings.versionControl.tabs.branches")}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2" data-oid="qxlc4g4">
                <Settings className="h-3 w-3" data-oid="haaat7z" />
                {t("dialogs.userSettings.versionControl.tabs.settings")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4" data-oid="f:zjb94">
              <VersionHistoryPanel data-oid="pk0z_4f" />
            </TabsContent>

            <TabsContent value="branches" className="mt-4" data-oid="qa2ehyg">
              <BranchManager data-oid="_9ktrpt" />
            </TabsContent>

            <TabsContent value="settings" className="mt-4" data-oid="k95n346">
              <VersionControlSettings data-oid="e5avow-" />
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
    <div className="space-y-4" data-oid="2b3ypal">
      <div data-oid="ywu4j5f">
        <h4 className="text-sm font-medium mb-2" data-oid="xq_tiw3">
          {t("dialogs.userSettings.versionControl.branches.title")}
        </h4>
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg" data-oid="w6jzf8h">
          <GitBranch className="h-4 w-4" data-oid="-r.0rcj" />
          <span className="font-medium" data-oid="c4..x.p">
            {branchName}
          </span>
          <Badge variant="secondary" data-oid="ty712m1">
            {t("dialogs.userSettings.versionControl.branches.active")}
          </Badge>
        </div>
      </div>

      <div data-oid="x-s1yop">
        <h4 className="text-sm font-medium mb-2" data-oid="mooy:c4">
          {t("dialogs.userSettings.versionControl.branches.createNew")}
        </h4>
        <div className="flex gap-2" data-oid="7ssaqf0">
          <input
            type="text"
            placeholder={t("dialogs.userSettings.versionControl.branches.namePlaceholder")}
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border rounded-md"
            disabled={isLoading}
            data-oid="wevlxbn"
          />

          <Button
            onClick={handleCreateBranch}
            disabled={isLoading || !newBranchName.trim()}
            size="sm"
            data-oid="6aci38n"
          >
            <GitBranch className="h-3 w-3 mr-1" data-oid="io:3n07" />
            {t("dialogs.userSettings.versionControl.branches.create")}
          </Button>
        </div>
      </div>

      <div data-oid="86buj8u">
        <h4 className="text-sm font-medium mb-2" data-oid="zht-gi8">
          {t("dialogs.userSettings.versionControl.branches.merge")}
        </h4>
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground" data-oid="w334qa8">
          <GitMerge className="h-4 w-4 inline mr-2" data-oid="5fceo.f" />
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
    {
      value: 30,
      label: t("dialogs.userSettings.versionControl.settings.intervals.30"),
    },
    {
      value: 60,
      label: t("dialogs.userSettings.versionControl.settings.intervals.60"),
    },
    {
      value: 120,
      label: t("dialogs.userSettings.versionControl.settings.intervals.120"),
    },
    {
      value: 300,
      label: t("dialogs.userSettings.versionControl.settings.intervals.300"),
    },
    {
      value: 600,
      label: t("dialogs.userSettings.versionControl.settings.intervals.600"),
    },
  ]

  return (
    <div className="space-y-6" data-oid="lbsn2yl">
      <div data-oid=".q0xz4e">
        <h4 className="text-sm font-medium mb-3" data-oid="7zp80gi">
          {t("dialogs.userSettings.versionControl.settings.autoSaveTitle")}
        </h4>
        <div className="space-y-3" data-oid="9oyr19r">
          <div className="flex items-center justify-between p-3 border rounded-lg" data-oid="f2hqbir">
            <div data-oid="7lnnkub">
              <div className="font-medium text-sm" data-oid="9s_4525">
                {t("dialogs.userSettings.versionControl.settings.enableAutoSave")}
              </div>
              <div className="text-xs text-muted-foreground" data-oid="5c0pf1w">
                {t("dialogs.userSettings.versionControl.settings.enableAutoSaveDesc")}
              </div>
            </div>
            <Button
              variant={autoSaveEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => enableAutoSave(!autoSaveEnabled)}
              disabled={isLoading}
              data-oid="g9p-2rx"
            >
              {autoSaveEnabled
                ? t("dialogs.userSettings.versionControl.settings.enabled")
                : t("dialogs.userSettings.versionControl.settings.disabled")}
            </Button>
          </div>

          {autoSaveEnabled && (
            <div className="p-3 border rounded-lg" data-oid="1:o3-tt">
              <div className="font-medium text-sm mb-2" data-oid="ez.qvu8">
                {t("dialogs.userSettings.versionControl.settings.intervalTitle")}
              </div>
              <div className="grid grid-cols-2 gap-2" data-oid="uq_mm3c">
                {intervalOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={autoSaveIntervalSeconds === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoSaveInterval(option.value)}
                    disabled={isLoading}
                    data-oid="k254ckf"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div data-oid="o2udfu7">
        <h4 className="text-sm font-medium mb-3" data-oid="d7g8eu:">
          {t("dialogs.userSettings.versionControl.settings.storage.title")}
        </h4>
        <div className="space-y-2 p-3 border rounded-lg" data-oid="ukfrj2r">
          <div className="flex justify-between text-sm" data-oid="rsfd5g0">
            <span data-oid="6so2eg9">{t("dialogs.userSettings.versionControl.settings.storage.maxVersions")}</span>
            <span data-oid="awl2vnr">{t("dialogs.userSettings.versionControl.settings.storage.maxVersionsValue")}</span>
          </div>
          <div className="flex justify-between text-sm" data-oid="7mjnvks">
            <span data-oid="zkwb26:">{t("dialogs.userSettings.versionControl.settings.storage.compression")}</span>
            <span data-oid="-6p.dka">{t("dialogs.userSettings.versionControl.settings.storage.compressionValue")}</span>
          </div>
          <div className="text-xs text-muted-foreground" data-oid="2nekhba">
            {t("dialogs.userSettings.versionControl.settings.storage.compressionDesc")}
          </div>
        </div>
      </div>

      <div data-oid="4nqz9::">
        <h4 className="text-sm font-medium mb-3" data-oid="qckcmv_">
          {t("dialogs.userSettings.versionControl.settings.exportImport.title")}
        </h4>
        <div className="space-y-2" data-oid="2f3gso4">
          <Button variant="outline" size="sm" disabled data-oid="4:pe4rb">
            {t("dialogs.userSettings.versionControl.settings.exportImport.export")}
          </Button>
          <Button variant="outline" size="sm" disabled data-oid="q2j-qf-">
            {t("dialogs.userSettings.versionControl.settings.exportImport.import")}
          </Button>
          <div className="text-xs text-muted-foreground" data-oid="ibumpsz">
            {t("dialogs.userSettings.versionControl.settings.exportImport.notImplemented")}
          </div>
        </div>
      </div>
    </div>
  )
}
