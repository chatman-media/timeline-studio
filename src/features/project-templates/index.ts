// Типы

// Components
export {
  TemplateCustomizer,
  type TemplateCustomizerProps,
  TemplatePicker,
  type TemplatePickerProps,
  TemplatePreview,
  type TemplatePreviewProps,
  TemplateWizard,
  type TemplateWizardProps,
} from "./components"
// Hooks
export {
  type UseProjectTemplateReturn,
  type UseTemplatePickerOptions,
  type UseTemplatePickerReturn,
  useProjectTemplate,
  useTemplatePicker,
} from "./hooks"

// Шаблоны
export {
  allProjectTemplates,
  getProjectTemplateById,
  getProjectTemplatesByAspectRatio,
  getProjectTemplatesByCategory,
  getProjectTemplatesByPlatform,
  podcastTemplates,
  projectTemplatesByCategory,
  projectTemplatesByPlatform,
  socialTemplates,
  youtubeTemplates,
} from "./lib/templates"

// Services
export {
  type ApplyTemplateOptions,
  ProjectTemplateManager,
  projectTemplateManager,
  TemplateApplier,
  TemplateValidator,
  templateApplier,
  templateValidator,
  type ValidationError,
  type ValidationResult,
  type ValidationWarning,
} from "./services"
export type {
  ProjectPlaceholders,
  ProjectSettings,
  ProjectStructure,
  ProjectTemplate,
  ProjectTemplateFilter,
  ProjectTemplateSortBy,
  ProjectTemplateSortOrder,
  Section,
  TrackConfig,
} from "./types"
