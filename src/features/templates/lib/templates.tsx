// Импортируем шаблоны из новой конфигурационной системы
import { landscapeTemplates, portraitTemplates, squareTemplates } from "./all-template-configs.tsx"

// Импортируем и реэкспортируем типы из template-config для обратной совместимости
import type {
  CellConfiguration,
  DividerConfig,
  LayoutConfig,
  MediaTemplate,
  MediaTemplateConfig,
  SplitPoint,
  TemplateAspectRatio,
} from "./template-config"

export type {
  SplitPoint,
  CellConfiguration as CellConfig,
  MediaTemplate,
  MediaTemplateConfig,
  DividerConfig,
  LayoutConfig,
  TemplateAspectRatio,
}

// Импортируем утилиты для работы с конфигурациями
export {
  createCellConfig,
  createDividerConfig,
  PRESET_STYLES,
} from "./template-config"

export const TEMPLATE_MAP: Record<"landscape" | "portrait" | "square", MediaTemplate[]> = {
  landscape: landscapeTemplates,
  portrait: portraitTemplates,
  square: squareTemplates,
}
