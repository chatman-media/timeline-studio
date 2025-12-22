import { Grid2x2, List } from "lucide-react"

import type { ViewModeConfig } from "./media-toolbar"

/**
 * Конфигурации режимов просмотра для разных типов контента
 */

// Конфигурация для медиа файлов (нет переключателя - только thumbnails)
export const mediaViewModes: ViewModeConfig[] = []

// Опции сортировки для медиа
export const mediaSortOptions = [
  { value: "name", label: "browser.toolbar.sortBy.name" },
  { value: "date", label: "browser.toolbar.sortBy.date" },
  { value: "size", label: "browser.toolbar.sortBy.size" },
  { value: "duration", label: "browser.toolbar.sortBy.duration" },
]

// Опции группировки для медиа
export const mediaGroupOptions = [
  { value: "none", label: "browser.toolbar.groupBy.none" },
  { value: "type", label: "browser.toolbar.groupBy.type" },
  { value: "date", label: "browser.toolbar.groupBy.date" },
  { value: "duration", label: "browser.toolbar.groupBy.duration" },
]

// Опции фильтрации для медиа
export const mediaFilterOptions = [
  { value: "video", label: "browser.toolbar.filterBy.video" },
  { value: "audio", label: "browser.toolbar.filterBy.audio" },
  { value: "image", label: "browser.toolbar.filterBy.image" },
]

// Конфигурация для музыки (2 режима)
export const musicViewModes: ViewModeConfig[] = [
  {
    value: "list",
    icon: List,
    label: "browser.toolbar.list",
    testId: "list-view-button",
  },
  {
    value: "thumbnails",
    icon: Grid2x2,
    label: "browser.toolbar.thumbnails",
    testId: "thumbnails-view-button",
  },
]

// Конфигурация для эффектов (1 режим - только превью)
export const effectsViewModes: ViewModeConfig[] = [
  {
    value: "thumbnails",
    icon: Grid2x2,
    label: "browser.toolbar.thumbnails",
    testId: "thumbnails-view-button",
  },
]

// Опции сортировки для эффектов
export const effectsSortOptions = [
  { value: "name", label: "browser.toolbar.sortBy.name" },
  { value: "complexity", label: "browser.toolbar.sortBy.complexity" },
  { value: "category", label: "browser.toolbar.sortBy.category" },
]

// Опции группировки для эффектов
export const effectsGroupOptions = [
  { value: "none", label: "browser.toolbar.groupBy.none" },
  { value: "category", label: "browser.toolbar.groupBy.category" },
  { value: "complexity", label: "browser.toolbar.groupBy.complexity" },
  { value: "type", label: "browser.toolbar.groupBy.type" },
  { value: "tags", label: "browser.toolbar.groupBy.tags" },
]

// Опции фильтрации для эффектов
export const effectsFilterOptions = [
  // По сложности
  { value: "basic", label: "effects.complexity.basic" },
  { value: "intermediate", label: "effects.complexity.intermediate" },
  { value: "advanced", label: "effects.complexity.advanced" },
  // По категориям
  { value: "color-correction", label: "effects.categories.color-correction" },
  { value: "artistic", label: "effects.categories.artistic" },
  { value: "vintage", label: "effects.categories.vintage" },
  { value: "cinematic", label: "effects.categories.cinematic" },
  { value: "creative", label: "effects.categories.creative" },
  { value: "technical", label: "effects.categories.technical" },
  { value: "distortion", label: "effects.categories.distortion" },
]

// Опции фильтрации для фильтров
export const filtersFilterOptions = [
  { value: "basic", label: "filters.complexity.basic" },
  { value: "intermediate", label: "filters.complexity.intermediate" },
  { value: "advanced", label: "filters.complexity.advanced" },
  { value: "color-correction", label: "filters.categories.color-correction" },
  { value: "creative", label: "filters.categories.creative" },
  { value: "cinematic", label: "filters.categories.cinematic" },
  { value: "vintage", label: "filters.categories.vintage" },
  { value: "technical", label: "filters.categories.technical" },
  { value: "artistic", label: "filters.categories.artistic" },
]

// Опции фильтрации для переходов
export const transitionsFilterOptions = [
  { value: "basic", label: "transitions.complexity.basic" },
  { value: "intermediate", label: "transitions.complexity.intermediate" },
  { value: "advanced", label: "transitions.complexity.advanced" },
  { value: "basic", label: "transitions.categories.basic" },
  { value: "advanced", label: "transitions.categories.advanced" },
  { value: "creative", label: "transitions.categories.creative" },
  { value: "3d", label: "transitions.categories.3d" },
  { value: "artistic", label: "transitions.categories.artistic" },
  { value: "cinematic", label: "transitions.categories.cinematic" },
]

// Опции фильтрации для субтитров
export const subtitlesFilterOptions = [
  // По сложности
  { value: "basic", label: "subtitles.complexity.basic" },
  { value: "intermediate", label: "subtitles.complexity.intermediate" },
  { value: "advanced", label: "subtitles.complexity.advanced" },
  // По категориям
  { value: "basic", label: "subtitles.categories.basic" },
  { value: "cinematic", label: "subtitles.categories.cinematic" },
  { value: "stylized", label: "subtitles.categories.stylized" },
  { value: "minimal", label: "subtitles.categories.minimal" },
  { value: "animated", label: "subtitles.categories.animated" },
  { value: "modern", label: "subtitles.categories.modern" },
]

// Опции фильтрации для шаблонов
export const templatesFilterOptions = [
  { value: "2", label: "templates.screens.2" },
  { value: "3", label: "templates.screens.3" },
  { value: "4", label: "templates.screens.4" },
  { value: "6", label: "templates.screens.6" },
  { value: "8", label: "templates.screens.8" },
  { value: "9", label: "templates.screens.9" },
  { value: "12", label: "templates.screens.12" },
  { value: "16", label: "templates.screens.16" },
  { value: "25", label: "templates.screens.25" },
]

// Опции фильтрации для стилистических шаблонов
export const styleTemplatesFilterOptions = [
  // По категориям
  { value: "intro", label: "styleTemplates.categories.intro" },
  { value: "outro", label: "styleTemplates.categories.outro" },
  { value: "lower-third", label: "styleTemplates.categories.lowerThird" },
  { value: "title", label: "styleTemplates.categories.title" },
  { value: "transition", label: "styleTemplates.categories.transition" },
  { value: "overlay", label: "styleTemplates.categories.overlay" },
  // По стилям
  { value: "modern", label: "styleTemplates.styles.modern" },
  { value: "classic", label: "styleTemplates.styles.classic" },
  { value: "minimal", label: "styleTemplates.styles.minimal" },
  { value: "bold", label: "styleTemplates.styles.bold" },
  { value: "vintage", label: "styleTemplates.styles.vintage" },
  { value: "corporate", label: "styleTemplates.styles.corporate" },
  { value: "creative", label: "styleTemplates.styles.creative" },
  { value: "cinematic", label: "styleTemplates.styles.cinematic" },
]

/**
 * Функция для получения конфигурации режимов просмотра по типу контента
 */
export function getViewModesForContent(contentType: "media" | "music" | "effects" | "subtitles"): ViewModeConfig[] {
  switch (contentType) {
    case "media":
      return mediaViewModes
    case "music":
      return musicViewModes
    case "effects":
      return effectsViewModes
    case "subtitles":
      return effectsViewModes // Субтитры используют только превью как эффекты
    default:
      return musicViewModes // Дефолт для музыки (2 режима)
  }
}

/**
 * Функция для получения полной конфигурации тулбара по типу контента
 */
export function getToolbarConfigForContent(
  contentType:
    | "media"
    | "music"
    | "effects"
    | "filters"
    | "transitions"
    | "subtitles"
    | "templates"
    | "style_templates",
) {
  switch (contentType) {
    case "media":
      return {
        viewModes: mediaViewModes,
        sortOptions: mediaSortOptions,
        groupOptions: mediaGroupOptions,
        filterOptions: mediaFilterOptions,
        showZoom: true,
        showGroupBy: true,
      }
    case "music":
      return {
        viewModes: musicViewModes,
        sortOptions: [
          { value: "name", label: "browser.toolbar.sortBy.name" },
          { value: "title", label: "browser.toolbar.sortBy.title" },
          { value: "artist", label: "browser.toolbar.sortBy.artist" },
          { value: "date", label: "browser.toolbar.sortBy.date" },
          { value: "size", label: "browser.toolbar.sortBy.size" },
          { value: "duration", label: "browser.toolbar.sortBy.duration" },
        ],
        groupOptions: [
          { value: "none", label: "browser.toolbar.groupBy.none" },
          { value: "artist", label: "browser.toolbar.groupBy.artist" },
          { value: "genre", label: "browser.toolbar.groupBy.genre" },
          { value: "album", label: "browser.toolbar.groupBy.album" },
        ],
        filterOptions: undefined, // Использует availableExtensions
        showZoom: false,
        showGroupBy: true,
      }
    case "effects":
      return {
        viewModes: effectsViewModes,
        sortOptions: effectsSortOptions,
        groupOptions: effectsGroupOptions,
        filterOptions: effectsFilterOptions, // Фильтрация по сложности и категориям
        showZoom: true, // Размеры превью нужны
        showGroupBy: true, // Группировка по категориям и тэгам
      }
    case "filters":
      return {
        viewModes: effectsViewModes, // Фильтры используют только превью как эффекты
        sortOptions: [
          { value: "name", label: "browser.toolbar.sortBy.name" },
          { value: "complexity", label: "browser.toolbar.sortBy.complexity" },
          { value: "category", label: "browser.toolbar.sortBy.category" },
        ],
        groupOptions: [
          { value: "none", label: "browser.toolbar.groupBy.none" },
          { value: "category", label: "browser.toolbar.groupBy.category" },
          { value: "complexity", label: "browser.toolbar.groupBy.complexity" },
          { value: "tags", label: "browser.toolbar.groupBy.tags" },
        ],
        filterOptions: filtersFilterOptions, // Фильтрация по сложности и категориям
        showZoom: true, // Размеры превью нужны
        showGroupBy: true, // Группировка по категориям и тэгам
      }
    case "transitions":
      return {
        viewModes: effectsViewModes, // Переходы используют только превью как эффекты
        sortOptions: [
          { value: "name", label: "browser.toolbar.sortBy.name" },
          { value: "complexity", label: "browser.toolbar.sortBy.complexity" },
          { value: "category", label: "browser.toolbar.sortBy.category" },
          { value: "duration", label: "browser.toolbar.sortBy.duration" },
        ],
        groupOptions: [
          { value: "none", label: "browser.toolbar.groupBy.none" },
          { value: "category", label: "browser.toolbar.groupBy.category" },
          { value: "complexity", label: "browser.toolbar.groupBy.complexity" },
          { value: "tags", label: "browser.toolbar.groupBy.tags" },
          { value: "duration", label: "browser.toolbar.groupBy.duration" },
        ],
        filterOptions: transitionsFilterOptions, // Фильтрация по сложности и категориям
        showZoom: true, // Размеры превью нужны
        showGroupBy: true, // Группировка по категориям и тэгам
      }
    case "subtitles":
      return {
        viewModes: effectsViewModes, // Субтитры используют только превью как эффекты
        sortOptions: [
          { value: "name", label: "browser.toolbar.sortBy.name" },
          { value: "complexity", label: "browser.toolbar.sortBy.complexity" },
          { value: "category", label: "browser.toolbar.sortBy.category" },
        ],
        groupOptions: [
          { value: "none", label: "browser.toolbar.groupBy.none" },
          { value: "category", label: "browser.toolbar.groupBy.category" },
          { value: "complexity", label: "browser.toolbar.groupBy.complexity" },
          { value: "tags", label: "browser.toolbar.groupBy.tags" },
        ],
        filterOptions: subtitlesFilterOptions, // Фильтрация по сложности и категориям
        showZoom: true, // Размеры превью нужны
        showGroupBy: true, // Группировка по категориям и тэгам
      }
    case "templates":
      return {
        viewModes: effectsViewModes, // Шаблоны используют только превью как эффекты
        sortOptions: [
          { value: "name", label: "browser.toolbar.sortBy.name" },
          { value: "screens", label: "browser.toolbar.sortBy.screens" },
          { value: "category", label: "browser.toolbar.sortBy.category" },
        ],
        groupOptions: [
          { value: "none", label: "browser.toolbar.groupBy.none" },
          { value: "screens", label: "browser.toolbar.groupBy.screens" },
          { value: "category", label: "browser.toolbar.groupBy.category" },
        ],
        filterOptions: templatesFilterOptions, // Фильтрация по количеству экранов
        showZoom: true, // Размеры превью нужны
        showGroupBy: true, // Группировка по экранам
      }
    case "style_templates":
      return {
        viewModes: effectsViewModes, // Стилистические шаблоны используют только превью
        sortOptions: [
          { value: "name", label: "browser.toolbar.sortBy.name" },
          { value: "category", label: "browser.toolbar.sortBy.category" },
          { value: "style", label: "browser.toolbar.sortBy.style" },
          { value: "duration", label: "browser.toolbar.sortBy.duration" },
        ],
        groupOptions: [
          { value: "none", label: "browser.toolbar.groupBy.none" },
          { value: "category", label: "browser.toolbar.groupBy.category" },
          { value: "style", label: "browser.toolbar.groupBy.style" },
          { value: "duration", label: "browser.toolbar.groupBy.duration" },
        ],
        filterOptions: styleTemplatesFilterOptions, // Фильтрация по категориям и стилям
        showZoom: true, // Размеры превью нужны
        showGroupBy: true, // Группировка по категориям и стилям
      }
    default:
      return getToolbarConfigForContent("media") // Дефолт для медиа
  }
}
