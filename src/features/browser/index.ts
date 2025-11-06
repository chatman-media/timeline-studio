// Адаптеры компонентов (с полной реализацией preview компонентов)
export { useEffectsAdapter as useEffectsListAdapter } from "./adapters/use-effects-adapter"
export { useFiltersAdapter as useFiltersListAdapter } from "./adapters/use-filters-adapter"
export { useMediaAdapter } from "./adapters/use-media-adapter"
export { useMusicAdapter } from "./adapters/use-music-adapter"
export { useStyleTemplatesAdapter as useStyleTemplatesListAdapter } from "./adapters/use-style-templates-adapter"
export { useSubtitlesAdapter } from "./adapters/use-subtitles-adapter"
export { useTemplatesAdapter as useTemplatesListAdapter } from "./adapters/use-templates-adapter"
export { useTransitionsAdapter as useTransitionsListAdapter } from "./adapters/use-transitions-adapter"
export * from "./components"
// Унифицированные хуки ресурсов (только уникальные для browser)
export {
  // Типизированные адаптеры из унифицированной системы
  useEffectsAdapter,
  useFiltersAdapter,
  useLoadingState,
  useResourceById,
  useResourceSources,
  useResourcesAdapter,
  useResourcesByCategory,
  useResourcesByComplexity,
  useResourcesByTags,
  useResourcesCache,
  useResourcesSearch,
  useResourcesStats,
  useStyleTemplatesAdapter,
  useTemplatesAdapter,
  useTransitionsAdapter,
} from "./hooks/use-resources"

// Провайдеры
/**
 * BrowserResourcesProvider - управляет библиотекой ДОСТУПНЫХ ресурсов для Browser
 * @deprecated Имя EffectsProvider устарело, используйте BrowserResourcesProvider
 */
export {
  EffectsProvider,
  BrowserResourcesProvider,
  useEffectsProvider,
  useBrowserResourcesProvider,
} from "./providers/browser-resources-provider"

// Сервисы
export * from "./services"

// Типы
export type * from "./types"
