/**
 * Core hook для работы с избранными медиафайлами
 * Re-exports useFavorites from project-management domain for convenience
 *
 * @example
 * ```tsx
 * const { favorites, isFavorite, toggleFavorite } = useFavorites()
 *
 * const handleToggle = () => {
 *   toggleFavorite(mediaFile)
 * }
 * ```
 */
export { useFavorites } from "@/domains/project-management/hooks"
