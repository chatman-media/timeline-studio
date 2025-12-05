/**
 * Config Providers - FEOD App Layer
 *
 * ⚠️ ВАЖНО: Импортируется ТОЛЬКО в /src/app/layout.tsx!
 * Никакие другие файлы не должны импортировать из /src/config/
 *
 * Если вы видите этот импорт в других местах - это ошибка архитектуры!
 */

export { Providers } from "./app-providers"
export { ThemeProvider, useTheme } from "./theme-provider"
