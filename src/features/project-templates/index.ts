// Типы
export type {
  ProjectTemplate,
  ProjectStructure,
  Section,
  TrackConfig,
  ProjectPlaceholders,
  ProjectSettings,
  ProjectTemplateFilter,
  ProjectTemplateSortBy,
  ProjectTemplateSortOrder,
} from "./types"

// Шаблоны
export {
  allProjectTemplates,
  projectTemplatesByCategory,
  projectTemplatesByPlatform,
  getProjectTemplateById,
  getProjectTemplatesByCategory,
  getProjectTemplatesByPlatform,
  getProjectTemplatesByAspectRatio,
  youtubeTemplates,
  socialTemplates,
  podcastTemplates,
} from "./lib/templates"
