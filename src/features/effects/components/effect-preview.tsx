import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { AddMediaButton } from "@/features/browser/components/layout/add-media-button"
import { ApplyButton } from "@/features/browser/components/layout/apply-button"
import { FavoriteButton } from "@/features/browser/components/layout/favorite-button"
import type { BaseEffect, VideoEffect } from "@/features/effects/types"
import { useResources } from "@/features/resources"
import type { EffectResource, TimelineResource } from "@/features/resources/types"
import { usePlayer, useVideoSelection } from "@/features/video-player"
import { generateCSSFilterForEffect, getPlaybackRate } from "../utils/css-effects"
import { getEffectPreview } from "../utils/effect-previews"
import { EffectIndicators } from "./effect-indicators"

// Получаем путь к превью видео для конкретного эффекта
const getPreviewPath = (effect: BaseEffect) => {
  // Используем превью из эффекта или дефолтное
  if (effect.preview) {
    return effect.preview
  }
  // Fallback на старую систему
  const preview = getEffectPreview(effect.id)
  return preview.videoPath
}

/**
 * Интерфейс пропсов для компонента EffectPreview
 */
interface EffectPreviewProps {
  effect: BaseEffect
  onClick: () => void
  size: number
  width?: number // Ширина превью (опционально, по умолчанию равна size)
  height?: number // Высота превью (опционально, по умолчанию равна size)
  customParams?: Record<string, any> // Пользовательские параметры для эффекта
}

/**
 * Компонент для отображения превью видеоэффекта
 * Показывает видео с применённым эффектом и позволяет добавить эффект в проект
 */
export function EffectPreview({
  effect,
  onClick,
  size,
  width = size, // По умолчанию ширина равна size (квадратное превью)
  height = size, // По умолчанию высота равна size (квадратное превью)
  customParams, // Пользовательские параметры для эффекта
}: EffectPreviewProps) {
  const { i18n } = useTranslation() // Хук для интернационализации
  const { isEffectAdded } = useResources() // Получаем методы для работы с ресурсами
  const [isHovering, setIsHovering] = useState(false) // Состояние наведения мыши
  const [videoSrc, setVideoSrc] = useState<string | null>(null) // Путь к видео (для ленивой загрузки)
  const videoRef = useRef<HTMLVideoElement>(null) // Ссылка на элемент видео
  const timeoutRef = useRef<NodeJS.Timeout>(null) // Ссылка на таймер для воспроизведения видео
  const { applyEffect } = usePlayer() // Получаем метод для применения эффекта
  const { getCurrentVideo } = useVideoSelection() // Получаем текущее видео для применения эффекта

  // Создаем эффект с пользовательскими параметрами, если они переданы
  const processedEffect = useMemo(() => {
    if (!effect) return null

    if (customParams && Object.keys(customParams).length > 0) {
      // Создаем объект с параметрами на основе структуры эффекта
      const params: Record<string, any> = {}

      // Собираем текущие значения параметров
      if (effect.parameters) {
        effect.parameters.forEach((param) => {
          params[param.id] = param.currentValue ?? param.defaultValue
        })
      }

      return {
        ...effect,
        parameters:
          effect.parameters?.map((param) => ({
            ...param,
            currentValue: customParams[param.id] ?? param.currentValue ?? param.defaultValue,
          })) || [],
        // Для обратной совместимости создаем params объект
        params: {
          ...params,
          ...customParams,
        },
      }
    }

    return effect
  }, [effect, customParams])

  // Проверяем, добавлен ли эффект уже в хранилище ресурсов
  // Мемоизируем результат для оптимизации
  const isAdded = useMemo(() => {
    return processedEffect ? isEffectAdded(processedEffect) : false
  }, [processedEffect, isEffectAdded])

  // Обработчик применения эффекта
  const handleApplyEffect = useCallback(
    (_resource: TimelineResource, _type: string) => {
      if (!processedEffect) return

      // Получаем имя эффекта для текущего языка
      const effectName =
        typeof processedEffect.name === "object"
          ? processedEffect.name[i18n.language] || processedEffect.name.en || processedEffect.id
          : processedEffect.name || processedEffect.id

      console.log("[EffectPreview] Applying effect:", effectName)

      // Собираем параметры из новой структуры
      const params: Record<string, any> = {}
      if (processedEffect.parameters) {
        processedEffect.parameters.forEach((param) => {
          params[param.id] = param.currentValue ?? param.defaultValue
        })
      }

      applyEffect({
        id: processedEffect.id,
        name: effectName,
        params: {
          ...params,
          ...((processedEffect as any).params || {}), // Fallback для старой структуры
        },
      })
    },
    [processedEffect, applyEffect, i18n.language],
  )

  // Ленивая загрузка видео при наведении
  useEffect(() => {
    if (isHovering && !videoSrc) {
      setVideoSrc(getPreviewPath(effect))
    }
  }, [isHovering, effect, videoSrc])

  /**
   * Эффект для управления воспроизведением видео и применением эффектов
   * Запускает видео при наведении и применяет соответствующий эффект
   */
  useEffect(() => {
    if (!effect) return
    if (!videoSrc || !videoRef.current) return
    const videoElement = videoRef.current

    /**
     * Применяет эффект к видео и запускает его воспроизведение
     * Устанавливает таймер для повторного воспроизведения
     */
    const applyEffect = () => {
      videoElement.currentTime = 0 // Сбрасываем время видео на начало
      videoElement.style.filter = "" // Сбрасываем предыдущие фильтры
      videoElement.style.boxShadow = "" // Сбрасываем дополнительные эффекты
      videoElement.playbackRate = 1 // Сбрасываем скорость воспроизведения

      // Применяем CSS-фильтр на основе параметров эффекта
      // Собираем параметры для CSS фильтра
      const effectParams: Record<string, any> = {}
      if (processedEffect?.parameters) {
        processedEffect.parameters.forEach((param) => {
          effectParams[param.id] = param.currentValue ?? param.defaultValue
        })
      }

      // Добавляем пользовательские параметры
      Object.assign(effectParams, customParams)

      const cssFilter = generateCSSFilterForEffect(processedEffect || effect, effectParams)
      if (cssFilter) {
        videoElement.style.filter = cssFilter
      }

      // Специальные эффекты, требующие дополнительных CSS-стилей
      if (
        processedEffect?.id === "vignette" ||
        (processedEffect?.category === "lighting" && processedEffect?.id.includes("vignette"))
      ) {
        // Создаем эффект виньетки через box-shadow
        const intensity = customParams?.intensity ?? effectParams?.intensity ?? 0.3
        const radius = customParams?.radius ?? effectParams?.radius ?? 0.8
        const shadowSize = Math.round(Math.min(width, height) * (1 - radius) * 0.5)
        const shadowBlur = Math.round(shadowSize * intensity * 2)
        videoElement.style.boxShadow = `inset 0 0 ${shadowBlur}px ${shadowSize}px rgba(0,0,0,${intensity})`
      } else {
        videoElement.style.boxShadow = ""
      }

      // Устанавливаем скорость воспроизведения
      const playbackRate = getPlaybackRate(processedEffect)
      videoElement.playbackRate = playbackRate

      // Запускаем воспроизведение видео
      videoElement.play().catch((err: unknown) => {
        console.log("Autoplay prevented:", err)
      })

      // Устанавливаем таймер для повторного воспроизведения через 2 секунды
      timeoutRef.current = setTimeout(() => {
        if (isHovering) {
          applyEffect()
        }
      }, 2000)
    }

    // Если курсор наведен на превью - применяем эффект и запускаем видео
    if (isHovering) {
      applyEffect()
    } else {
      // Если курсор не наведен - останавливаем видео и сбрасываем эффекты
      videoElement.pause()
      videoElement.currentTime = 0
      videoElement.style.filter = ""
      videoElement.style.boxShadow = ""
      videoElement.playbackRate = 1
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isHovering, processedEffect, width, height, customParams, videoSrc])

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер превью эффекта */}
      <div
        className="group relative cursor-pointer rounded-xs bg-gray-800"
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={onClick}
      >
        {/* Видео для демонстрации эффекта */}
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xs"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              objectFit: "cover", // Обрезаем видео по размерам контейнера
            }}
            muted
            playsInline
            preload="metadata"
            data-testid="effect-video"
          />
        )}

        {/* Плейсхолдер пока видео не загружено */}
        {!videoSrc && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xs bg-gray-800 flex items-center justify-center"
            style={{
              width: `${width}px`,
              height: `${height}px`,
            }}
          >
            <div className="text-gray-500 text-xs">
              {processedEffect
                ? typeof processedEffect.name === "object"
                  ? processedEffect.name[i18n.language] || processedEffect.name.en || processedEffect.id
                  : processedEffect.name || processedEffect.id
                : "Effect"}
            </div>
          </div>
        )}

        {/* Индикаторы эффекта */}
        {processedEffect && (
          <>
            {/* Цветовой индикатор сложности слева */}
            <div className="absolute bottom-1 left-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  processedEffect.complexity === "low"
                    ? "bg-green-500"
                    : processedEffect.complexity === "medium"
                      ? "bg-yellow-500"
                      : processedEffect.complexity === "high"
                        ? "bg-red-500"
                        : processedEffect.complexity === "extreme"
                          ? "bg-purple-500"
                          : "bg-gray-500"
                }`}
                title={`effects.complexity.${processedEffect.complexity || "low"}`}
              />
            </div>

            {/* Индикаторы категории и тегов справа */}
            <div className="absolute top-1 left-1">
              <EffectIndicators effect={processedEffect} size={size > 150 ? "md" : "sm"} />
            </div>
          </>
        )}

        {/* Кнопка добавления в избранное */}
        {processedEffect && (
          <FavoriteButton
            file={{
              id: processedEffect.id,
              path: "",
              name:
                typeof processedEffect.name === "object"
                  ? processedEffect.name[i18n.language] || processedEffect.name.en || processedEffect.id
                  : processedEffect.name || processedEffect.id,
            }}
            size={size}
            type="effect"
          />
        )}
        {processedEffect && (
          <ApplyButton
            resource={
              {
                id: processedEffect.id,
                type: "effect",
                name:
                  typeof processedEffect.name === "object"
                    ? processedEffect.name[i18n.language] || processedEffect.name.en || processedEffect.id
                    : processedEffect.name || processedEffect.id,
                resourceId: processedEffect.id,
                addedAt: Date.now(),
                effect: processedEffect as VideoEffect,
                params: (processedEffect as any).params || {},
              } as EffectResource
            }
            size={size}
            type="effect"
            onApply={handleApplyEffect}
          />
        )}
        {/* Кнопка добавления эффекта в проект */}
        <div className={isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"}>
          {processedEffect && (
            <AddMediaButton
              resource={
                {
                  id: processedEffect.id,
                  type: "effect",
                  name:
                    typeof processedEffect.name === "object"
                      ? processedEffect.name[i18n.language] || processedEffect.name.en || processedEffect.id
                      : processedEffect.name || processedEffect.id,
                  resourceId: processedEffect.id,
                  addedAt: Date.now(),
                  effect: processedEffect as VideoEffect,
                  params: (processedEffect as any).params || {},
                } as EffectResource
              }
              size={size}
              type="effect"
            />
          )}
        </div>
      </div>
      {/* Название эффекта */}
      <div className="mt-1 text-xs text-center">
        {processedEffect
          ? typeof processedEffect.name === "object"
            ? processedEffect.name[i18n.language] || processedEffect.name.en || processedEffect.id
            : processedEffect.name || processedEffect.id
          : "Effect"}
      </div>
    </div>
  )
}
