import { BarChart3, ChevronDown, Image, Palette, Sliders, TrendingUp } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@timeline-studio/ui/components/collapsible"

import { ColorGradingProvider } from "../services/color-grading-provider"
import { ColorWheelsSection } from "./color-wheels/color-wheels-section"
import { ColorGradingControls } from "./controls/color-grading-controls"
import { CurvesSection } from "./curves/curves-section"
import { HSLSection } from "./hsl/hsl-section"
import { LUTSection } from "./lut/lut-section"
import { ScopesSection } from "./scopes/scopes-section"

export interface ColorSettingsProps {
  className?: string
}

export function ColorSettings({ className }: ColorSettingsProps) {
  const { t } = useTranslation()

  // Состояние открытых секций (по умолчанию первичная коррекция открыта)
  const [openSections, setOpenSections] = useState({
    colorWheels: true,
    curves: false,
    hsl: false,
    lut: false,
    scopes: false,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <ColorGradingProvider data-oid="_obdsb4">
      <div
        className={`color-grading-panel h-full flex flex-col ${className || ""}`}
        data-testid="color-settings"
        data-oid="stt-1a8"
      >
        {/* Прокручиваемое содержимое */}
        <div
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar"
          style={{
            scrollbarGutter: "stable",
            scrollbarWidth: "thin",
            scrollbarColor: "#4b5563 #1f2937",
          }}
          data-oid="g-dpe31"
        >
          {/* 1. ОСНОВНЫЕ НАСТРОЙКИ - Color Wheels */}
          <Collapsible
            open={openSections.colorWheels}
            onOpenChange={() => toggleSection("colorWheels")}
            data-oid=":3.l-lc"
          >
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-testid="color-wheels-trigger"
              data-oid="40qnjuz"
            >
              <div className="flex items-center gap-2" data-oid="jmmgl3k">
                <div className="w-2 h-2 rounded-full bg-blue-400" data-oid="u5m9_gg" />
                <Palette className="h-4 w-4 text-blue-400" data-oid="t:q0yzv" />
                <h3 className="font-medium text-foreground" data-oid="j5o8e_y">
                  {t("colorGrading.primaryCorrection", "Primary Color Correction")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.colorWheels ? "rotate-180" : ""}`}
                data-oid="ezb7l2c"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="ms1_7n_">
              <div className="bg-card rounded-lg border border-border p-4" data-oid="y:elqt2">
                <ColorWheelsSection data-oid="utnhob8" />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 2. КРИВЫЕ */}
          <Collapsible open={openSections.curves} onOpenChange={() => toggleSection("curves")} data-oid="9tatmsi">
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-testid="curves-trigger"
              data-oid="o5khvhy"
            >
              <div className="flex items-center gap-2" data-oid="bt3e:.e">
                <div className="w-2 h-2 rounded-full bg-green-400" data-oid="v6gsp:u" />
                <TrendingUp className="h-4 w-4 text-green-400" data-oid="s4-ieba" />
                <h3 className="font-medium text-foreground" data-oid="ud83n1u">
                  {t("colorGrading.curvesSection", "Curves")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.curves ? "rotate-180" : ""}`}
                data-oid="5hy7_9n"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="eloqsjd">
              <div className="bg-card rounded-lg border border-border p-4" data-oid="d_xgn4l">
                <CurvesSection data-oid="gxz6ybt" />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 3. HSL КОРРЕКЦИЯ */}
          <Collapsible open={openSections.hsl} onOpenChange={() => toggleSection("hsl")} data-oid="d3myakn">
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-testid="hsl-trigger"
              data-oid="h0_2iju"
            >
              <div className="flex items-center gap-2" data-oid="1vo6mxh">
                <div className="w-2 h-2 rounded-full bg-yellow-400" data-oid="1:x3sgd" />
                <Sliders className="h-4 w-4 text-yellow-400" data-oid="--ktap1" />
                <h3 className="font-medium text-foreground" data-oid="tglsucc">
                  {t("colorGrading.hslCorrection", "HSL Correction")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.hsl ? "rotate-180" : ""}`}
                data-oid="i.m3uoi"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid=":63pm10">
              <div className="bg-card rounded-lg border border-border p-4" data-oid="zuu096t">
                <HSLSection data-oid="8ulprtd" />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 4. LUT */}
          <Collapsible open={openSections.lut} onOpenChange={() => toggleSection("lut")} data-oid="5d7j.jb">
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-testid="lut-trigger"
              data-oid="4og_h4w"
            >
              <div className="flex items-center gap-2" data-oid="6qv3n6b">
                <div className="w-2 h-2 rounded-full bg-purple-400" data-oid=":hpk2cw" />
                <Image className="h-4 w-4 text-purple-400" data-oid="ldf:5m3" />
                <h3 className="font-medium text-foreground" data-oid="va62tp-">
                  {t("colorGrading.lutSection", "LUT")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.lut ? "rotate-180" : ""}`}
                data-oid="i.32mre"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="dtlus3k">
              <div className="bg-card rounded-lg border border-border p-4" data-oid="n_6:frx">
                <LUTSection data-oid="90sk72k" />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 5. SCOPES */}
          <Collapsible open={openSections.scopes} onOpenChange={() => toggleSection("scopes")} data-oid="klkb64e">
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-testid="scopes-trigger"
              data-oid="c3ma_rh"
            >
              <div className="flex items-center gap-2" data-oid="5mzyv6i">
                <div className="w-2 h-2 rounded-full bg-red-400" data-oid="q_jdtlm" />
                <BarChart3 className="h-4 w-4 text-red-400" data-oid="_wgy_ra" />
                <h3 className="font-medium text-foreground" data-oid="14x6aps">
                  {t("colorGrading.scopesSection", "Scopes")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.scopes ? "rotate-180" : ""}`}
                data-oid="3e47wv6"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid=":h2l9qd">
              <div className="bg-card rounded-lg border border-border p-4" data-oid="93zjqd_">
                <ScopesSection data-oid="q9kgbfa" />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Нижние кнопки управления */}
        <div className="border-t border-border bg-card" data-oid=".4h2k_g">
          <ColorGradingControls data-oid="lqc357i" />
        </div>
      </div>
    </ColorGradingProvider>
  )
}
