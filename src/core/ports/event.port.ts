/**
 * Event Port Interface
 *
 * Определяет контракт для системы событий (подписка/отписка).
 * Реализации: TauriEventService (Tauri events), MockEventService (in-memory)
 */

/**
 * Функция для отписки от события
 */
export type UnlistenFn = () => void

/**
 * Callback для обработки события
 */
export type EventCallback<T> = (event: { payload: T }) => void

/**
 * Интерфейс сервиса событий
 */
export interface IEventService {
  /**
   * Подписаться на событие
   * @param eventName - Имя события
   * @param callback - Обработчик события
   * @returns Promise с функцией отписки
   */
  listen<T>(eventName: string, callback: EventCallback<T>): Promise<UnlistenFn>

  /**
   * Отправить событие (для тестов и mock)
   * @param eventName - Имя события
   * @param payload - Данные события
   */
  emit<T>(eventName: string, payload: T): Promise<void>
}
