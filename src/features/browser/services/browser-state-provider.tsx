/**
 * Browser State Provider - Legacy compatibility wrapper
 *
 * @deprecated Используйте BrowserProvider из @/domains/browser
 * Этот файл оставлен для обратной совместимости с тестами и старым кодом
 */

export {
  BrowserProvider as BrowserStateProvider,
  useBrowser as useBrowserState,
} from "@/domains/browser"
