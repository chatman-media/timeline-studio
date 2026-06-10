/**
 * Storage Port Interface
 *
 * Определяет контракт для персистентного хранилища.
 * Реализации: TauriStorage (Tauri Store), BrowserStorage (localStorage), MockStorage
 */

export interface IStorageService {
  /**
   * Получение значения по ключу
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Сохранение значения по ключу
   */
  set<T>(key: string, value: T): Promise<void>

  /**
   * Удаление значения по ключу
   */
  delete(key: string): Promise<void>

  /**
   * Проверка существования ключа
   */
  has(key: string): Promise<boolean>

  /**
   * Получение всех ключей
   */
  keys(): Promise<string[]>

  /**
   * Очистка всего хранилища
   */
  clear(): Promise<void>
}
