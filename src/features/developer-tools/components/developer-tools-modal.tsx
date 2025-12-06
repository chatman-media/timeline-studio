/**
 * Modal окно для Developer Tools
 * Включает инструменты для разработчиков: генерация превью эффектов, и др.
 */

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EffectPreviewGenerator } from "@/features/effects"
import { allMigratedEffects } from "@/features/effects/data/effects-loader"

interface DeveloperToolsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeveloperToolsModal({ open, onOpenChange }: DeveloperToolsModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("effect-previews")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("developerTools.title", "Developer Tools")}</DialogTitle>
          <DialogDescription>
            {t("developerTools.description", "Advanced tools for developers and content creators")}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="effect-previews">
              {t("developerTools.tabs.effectPreviews", "Effect Previews")}
            </TabsTrigger>
            {/* Можно добавить больше табов в будущем:
            <TabsTrigger value="cache-management">Cache Management</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            */}
          </TabsList>

          <TabsContent value="effect-previews" className="mt-4">
            <EffectPreviewGenerator effects={allMigratedEffects} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
