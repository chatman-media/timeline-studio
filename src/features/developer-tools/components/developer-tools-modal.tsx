/**
 * Modal окно для Developer Tools
 * Включает инструменты для разработчиков: генерация превью эффектов, и др.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@timeline-studio/ui/components/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { useState } from "react"
import { useTranslation } from "react-i18next"
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
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="fhh44g:">
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto" data-oid="a0bha2l">
        <DialogHeader data-oid="l01zki8">
          <DialogTitle data-oid="ychsdty">{t("developerTools.title", "Developer Tools")}</DialogTitle>
          <DialogDescription data-oid="8olrkfw">
            {t("developerTools.description", "Advanced tools for developers and content creators")}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} data-oid="s8h.iag">
          <TabsList className="grid w-full grid-cols-1" data-oid="mfzte0c">
            <TabsTrigger value="effect-previews" data-oid="t6.vr1l">
              {t("developerTools.tabs.effectPreviews", "Effect Previews")}
            </TabsTrigger>
            {/* Можно добавить больше табов в будущем:
                <TabsTrigger value="cache-management">Cache Management</TabsTrigger>
                <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                */}
          </TabsList>

          <TabsContent value="effect-previews" className="mt-4" data-oid="piq-tu.">
            <EffectPreviewGenerator effects={allMigratedEffects} data-oid=":viq:3d" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
