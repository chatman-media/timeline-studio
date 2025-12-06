/**
 * Утилиты для работы с путями
 */

/**
 * Заменяет домашнюю директорию пользователя на тильду (~)
 * Например: /Users/username/Movies/Timeline Studio → ~/Movies/Timeline Studio
 *
 * @param absolutePath - Абсолютный путь
 * @returns Путь с тильдой, если это путь в домашней директории
 */
export function replaceHomeWithTilde(absolutePath: string): string {
  if (!absolutePath) return absolutePath

  // Для macOS/Linux: /Users/username или /home/username
  const unixMatch = absolutePath.match(/^(\/Users\/[^/]+|\/home\/[^/]+)(.*)$/)
  if (unixMatch) {
    return `~${unixMatch[2]}`
  }

  // Для Windows: C:\Users\username
  const windowsMatch = absolutePath.match(/^([A-Z]:\\Users\\[^\\]+)(.*)$/i)
  if (windowsMatch) {
    return `~${windowsMatch[2].replace(/\\/g, "/")}`
  }

  return absolutePath
}
