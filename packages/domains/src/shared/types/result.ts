/**
 * Result and Option Types
 *
 * Функциональные типы для обработки результатов и опциональных значений
 */

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

export type Option<T> = T | null | undefined
