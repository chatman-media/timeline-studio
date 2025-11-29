/**
 * Core hook для работы с уведомлениями
 * Re-exports useNotifications from system-integration domain for convenience
 *
 * @example
 * ```tsx
 * const { showSuccess, showError } = useNotifications()
 *
 * const handleExport = async () => {
 *   try {
 *     await exportVideo()
 *     showSuccess("Export Complete", "Video exported successfully")
 *   } catch (error) {
 *     showError("Export Failed", error.message)
 *   }
 * }
 * ```
 */
export { useNotifications } from "@/domains/system-integration"
