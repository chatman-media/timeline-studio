"use client"

import type { ReactNode } from "react"

import { I18nextProvider } from "react-i18next"

import i18n from "../index"

interface I18nProviderProps {
  children: ReactNode
}

/**
 * I18nProvider - провайдер локализации
 * НЕ блокирует рендеринг - использует встроенные английские переводы как fallback
 * Переводы для других языков загружаются асинхронно в фоне
 */
export function I18nProvider({ children }: I18nProviderProps) {
  // Рендерим сразу - английские переводы уже встроены как fallback
  // Другие языки загрузятся асинхронно и UI обновится автоматически
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
