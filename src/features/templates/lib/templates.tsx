// Импортируем шаблоны из восстановленных preview файлов (базовые)
import { landscapeTemplates as baseLandscapeTemplates } from "../components/template-previews/landscape-templates"
import { portraitTemplates as basePortraitTemplates } from "../components/template-previews/portrait-templates"
import { squareTemplates as baseSquareTemplates } from "../components/template-previews/square-templates"

// Импортируем новые шаблоны (PiP и профессиональные)
import { pipTemplates } from "./pip-templates"
import { professionalLayouts } from "./professional-layouts"

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

// Группируем новые шаблоны по соотношению сторон
const newLandscapeTemplates = [...pipTemplates, ...professionalLayouts].filter((t) => t.id.includes("-landscape"))
const newPortraitTemplates = [...pipTemplates, ...professionalLayouts].filter((t) => t.id.includes("-portrait"))
const newSquareTemplates = [...pipTemplates, ...professionalLayouts].filter((t) => t.id.includes("-square"))

// Объединяем базовые и новые шаблоны
export const TEMPLATE_MAP: Record<"landscape" | "portrait" | "square", MediaTemplate[]> = {
  landscape: [...baseLandscapeTemplates, ...newLandscapeTemplates],
  portrait: [...basePortraitTemplates, ...newPortraitTemplates],
  square: [...baseSquareTemplates, ...newSquareTemplates],
}
