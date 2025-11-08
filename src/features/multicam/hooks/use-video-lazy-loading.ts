/**
 * Хук для ленивой загрузки видео с использованием Intersection Observer
 */

import { useEffect, useRef, useState } from "react"

export interface UseVideoLazyLoadingOptions {
  /**
   * Порог видимости для начала загрузки (0-1)
   * 0 = как только элемент появляется
   * 1 = когда элемент полностью виден
   */
  threshold?: number

  /**
   * Корневой отступ для раннего начала загрузки
   * Например, "200px" начнет загрузку за 200px до появления
   */
  rootMargin?: string

  /**
   * Отключить lazy loading (для тестирования)
   */
  disabled?: boolean
}

export interface UseVideoLazyLoadingReturn {
  /**
   * Ref для прикрепления к видео элементу
   */
  ref: (element: HTMLVideoElement | null) => void

  /**
   * Видимо ли видео сейчас
   */
  isVisible: boolean

  /**
   * Было ли видео хотя бы раз видимым
   */
  hasBeenVisible: boolean
}

/**
 * Хук для ленивой загрузки видео
 * Использует Intersection Observer для определения видимости элемента
 */
export function useVideoLazyLoading(options: UseVideoLazyLoadingOptions = {}): UseVideoLazyLoadingReturn {
  const { threshold = 0.1, rootMargin = "50px", disabled = false } = options

  const [isVisible, setIsVisible] = useState(disabled)
  const [hasBeenVisible, setHasBeenVisible] = useState(disabled)
  const elementRef = useRef<HTMLVideoElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Обновляем состояние при изменении disabled
  useEffect(() => {
    if (disabled) {
      setIsVisible(true)
      setHasBeenVisible(true)
    }
  }, [disabled])

  useEffect(() => {
    if (disabled) {
      return
    }

    // Создаем observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isCurrentlyVisible = entry.isIntersecting

          setIsVisible(isCurrentlyVisible)

          // Однажды видимое остается в hasBeenVisible
          if (isCurrentlyVisible) {
            setHasBeenVisible(true)
          }
        })
      },
      {
        threshold,
        rootMargin,
      },
    )

    // Наблюдаем за элементом если он установлен
    if (elementRef.current) {
      observerRef.current.observe(elementRef.current)
    }

    // Очистка
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [threshold, rootMargin, disabled])

  // Ref callback для прикрепления к элементу
  const setRef = (element: HTMLVideoElement | null) => {
    // Отключаем наблюдение за старым элементом
    if (elementRef.current && observerRef.current) {
      observerRef.current.unobserve(elementRef.current)
    }

    elementRef.current = element

    // Начинаем наблюдение за новым элементом
    if (element && observerRef.current) {
      observerRef.current.observe(element)
    }
  }

  return {
    ref: setRef,
    isVisible,
    hasBeenVisible,
  }
}
