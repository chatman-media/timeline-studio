/**
 * Global Layer - FEOD Architecture
 *
 * ⚠️ ВАЖНО: Этот файл НЕ ДОЛЖЕН содержать экспортов!
 *
 * Global layer работает через side-effects:
 * - Type declarations в /types/ подключаются через tsconfig.json
 * - CSS переменные в /styles/ подключаются в root layout
 * - Polyfills в /setup/ выполняются при инициализации
 *
 * Если вам нужно что-то экспортировать - это НЕ Global layer!
 * Переместите в:
 * - /src/lib/ для утилит и хелперов (Common layer)
 * - /src/components/ для компонентов (Common layer)
 * - /src/features/ для бизнес-логики (Modules layer)
 *
 * См. README.md в этой папке для подробностей.
 */

// Этот файл намеренно оставлен пустым
// Не добавляйте сюда экспорты!
