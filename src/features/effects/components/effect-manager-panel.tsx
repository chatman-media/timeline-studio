/**
 * Effect Manager Panel - главная панель управления эффектами
 * Интегрирует новую унифицированную систему эффектов
 */

import { Filter, Plus, Search, Settings2, Upload } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Input } from "@timeline-studio/ui/components/input"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { createLogger } from "@/lib/tauri-logger"
import { useEffectCategories, useEffects } from "../hooks/use-effects"
import { useEffectsImport } from "../hooks/use-effects-import"
import type { BaseEffect } from "../types"
import { EffectDetail } from "./effect-detail"
import { EffectGroup } from "./effect-group"

const logger = createLogger("EffectManagerPanel")

// Категории эффектов с локализацией
const EFFECT_CATEGORIES = {
  all: { en: "All Effects", ru: "Все эффекты" },
  color_correction: { en: "Color Correction", ru: "Цветокоррекция" },
  color_grading: { en: "Color Grading", ru: "Цветовой грейдинг" },
  luts: { en: "LUTs", ru: "LUT таблицы" },
  blur_sharpen: { en: "Blur & Sharpen", ru: "Размытие и резкость" },
  stylize: { en: "Stylize", ru: "Стилизация" },
  distort: { en: "Distort", ru: "Искажение" },
  lighting: { en: "Lighting", ru: "Освещение" },
  noise_grain: { en: "Noise & Grain", ru: "Шум и зерно" },
  transform: { en: "Transform", ru: "Трансформация" },
  keying: { en: "Keying", ru: "Кеинг" },
  motion: { en: "Motion", ru: "Движение" },
  temporal: { en: "Temporal", ru: "Временные" },
}

interface EffectManagerPanelProps {
  onApplyEffect: (effect: BaseEffect, preset?: string, customParams?: Record<string, any>) => void
  selectedCategory?: string
  previewSize?: number
}

export function EffectManagerPanel({
  onApplyEffect,
  selectedCategory = "all",
  previewSize = 120,
}: EffectManagerPanelProps) {
  const { t, i18n } = useTranslation()
  const { effects, loading, error } = useEffects()
  const categories = useEffectCategories()
  const { importEffectsFile, importEffectFile, isImporting } = useEffectsImport()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterScope, setFilterScope] = useState<"all" | "clip" | "track" | "global">("all")
  const [activeCategory, setActiveCategory] = useState(selectedCategory)
  const [selectedEffect, setSelectedEffect] = useState<BaseEffect | null>(null)

  // Фильтрация эффектов
  const filteredEffects = useMemo(() => {
    let result = effects

    // Фильтр по категории
    if (activeCategory !== "all") {
      result = result.filter((effect) => effect.category === activeCategory)
    }

    // Фильтр по области применения
    if (filterScope !== "all") {
      result = result.filter((effect) => effect.scope.includes(filterScope as any))
    }

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((effect) => {
        const name = effect.name[i18n.language] || effect.name.en
        const description = effect.description?.[i18n.language] || effect.description?.en || ""
        const tags = effect.tags.join(" ")

        return (
          name.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query) ||
          tags.toLowerCase().includes(query)
        )
      })
    }

    return result
  }, [effects, activeCategory, filterScope, searchQuery, i18n.language])

  // Группировка эффектов по категориям
  const groupedEffects = useMemo(() => {
    const groups: Record<string, BaseEffect[]> = {}

    filteredEffects.forEach((effect) => {
      if (!groups[effect.category]) {
        groups[effect.category] = []
      }
      groups[effect.category].push(effect)
    })

    return groups
  }, [filteredEffects])

  // Обработчики
  const handleEffectClick = useCallback((effect: BaseEffect) => {
    setSelectedEffect(effect)
  }, [])

  const handleImportClick = useCallback(async () => {
    const result = await importEffectsFile()
    if (result.success) {
      // TODO: Показать уведомление об успешном импорте
      logger.info(result.message)
    }
  }, [importEffectsFile])

  const handleImportLUTClick = useCallback(async () => {
    const result = await importEffectFile()
    if (result.success) {
      // TODO: Показать уведомление об успешном импорте
      logger.info(result.message)
    }
  }, [importEffectFile])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" data-oid="32wy.hr">
        <div className="text-muted-foreground" data-oid="051ma3d">
          {t("effects.loading", "Загрузка эффектов...")}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full" data-oid="-sv3mvg">
        <div className="text-destructive" data-oid="10ztyxa">
          {t("effects.error", "Ошибка загрузки эффектов")}: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" data-oid="_gwald0">
      {/* Панель инструментов */}
      <div className="flex items-center gap-4 p-4 border-b" data-oid="xhrrkn3">
        <div className="flex-1 relative" data-oid="_b1s-v5">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"
            data-oid="gwai0ps"
          />

          <Input
            placeholder={t("effects.search", "Поиск эффектов...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-oid="g7q9wp7"
          />
        </div>

        <Select value={filterScope} onValueChange={(value: any) => setFilterScope(value)} data-oid="_kd743l">
          <SelectTrigger className="w-[140px]" data-oid="q_4_.1c">
            <Filter className="w-4 h-4 mr-2" data-oid="efpb33p" />
            <SelectValue data-oid="qdgss3d" />
          </SelectTrigger>
          <SelectContent data-oid="meuyp-u">
            <SelectItem value="all" data-oid="p07vxyt">
              {t("effects.scope.all", "Все")}
            </SelectItem>
            <SelectItem value="clip" data-oid="_b-i6cy">
              {t("effects.scope.clip", "Клип")}
            </SelectItem>
            <SelectItem value="track" data-oid="6:49c2m">
              {t("effects.scope.track", "Трек")}
            </SelectItem>
            <SelectItem value="global" data-oid="rurjh_y">
              {t("effects.scope.global", "Глобальные")}
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2" data-oid="2.svfb:">
          <Button variant="outline" size="sm" onClick={handleImportClick} disabled={isImporting} data-oid="ee1qwlk">
            <Upload className="w-4 h-4 mr-2" data-oid="cf00inh" />
            {t("effects.import", "Импорт")}
          </Button>

          <Button variant="outline" size="sm" onClick={handleImportLUTClick} disabled={isImporting} data-oid="-q9eb.:">
            <Plus className="w-4 h-4 mr-2" data-oid="lixyv::" />
            LUT
          </Button>
        </div>
      </div>

      {/* Категории */}
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="flex-1 flex flex-col"
        data-oid="9xmtp3h"
      >
        <TabsList className="w-full justify-start px-4 h-auto flex-wrap" data-oid="vn5njo.">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-oid=".r::7zv"
          >
            {EFFECT_CATEGORIES.all[i18n.language as "en" | "ru"]}
            <Badge variant="secondary" className="ml-2" data-oid="o3hk0a-">
              {effects.length}
            </Badge>
          </TabsTrigger>

          {Object.entries(categories).map(([key, categoryEffects]) => {
            const categoryInfo = EFFECT_CATEGORIES[key as keyof typeof EFFECT_CATEGORIES]
            if (!categoryInfo || categoryEffects.length === 0) return null

            return (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-oid="24qq7sd"
              >
                {categoryInfo[i18n.language as "en" | "ru"]}
                <Badge variant="secondary" className="ml-2" data-oid="p:v2pyb">
                  {categoryEffects.length}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Контент */}
        <TabsContent value={activeCategory} className="flex-1 mt-0" data-oid="1e5oyv5">
          <ScrollArea className="h-full" data-oid="dl9g2e7">
            <div className="p-4 space-y-6" data-oid="su-0ix1">
              {activeCategory === "all" ? (
                // Показываем все категории
                Object.entries(groupedEffects).map(([category, categoryEffects]) => {
                  const categoryInfo = EFFECT_CATEGORIES[category as keyof typeof EFFECT_CATEGORIES]
                  if (!categoryInfo || categoryEffects.length === 0) return null

                  return (
                    <EffectGroup
                      key={category}
                      title={categoryInfo[i18n.language as "en" | "ru"]}
                      effects={categoryEffects}
                      previewSize={previewSize}
                      previewWidth={previewSize}
                      previewHeight={previewSize}
                      onEffectClick={handleEffectClick}
                      data-oid="dkq2vbc"
                    />
                  )
                })
              ) : (
                // Показываем эффекты выбранной категории
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${previewSize}px, 1fr))`,
                  }}
                  data-oid="4ld:pv9"
                >
                  {filteredEffects.map((effect, _index) => (
                    <div
                      key={effect.id}
                      className="relative group cursor-pointer"
                      onClick={() => handleEffectClick(effect)}
                      data-oid="qm4namj"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted" data-oid="w0gfjnp">
                        {/* TODO: Добавить превью эффекта */}
                        <div className="w-full h-full flex items-center justify-center" data-oid="-_bi8tu">
                          <Settings2 className="w-8 h-8 text-muted-foreground" data-oid="a9:-h_2" />
                        </div>
                      </div>

                      <div className="mt-2 space-y-1" data-oid="5trnz.7">
                        <h4 className="text-sm font-medium truncate" data-oid="y3vutd0">
                          {effect.name[i18n.language] || effect.name.en}
                        </h4>
                        {effect.author && (
                          <p className="text-xs text-muted-foreground" data-oid="nqrp7u5">
                            {effect.author}
                          </p>
                        )}
                      </div>

                      {/* Кнопка применения при наведении */}
                      <div
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                        data-oid="j1c_ihs"
                      >
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onApplyEffect(effect)
                          }}
                          data-oid="9q3-c3g"
                        >
                          {t("effects.apply", "Применить")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Детали выбранного эффекта */}
      {selectedEffect && <EffectDetail effect={selectedEffect} onApplyEffect={onApplyEffect} data-oid="yyl7860" />}
    </div>
  )
}
