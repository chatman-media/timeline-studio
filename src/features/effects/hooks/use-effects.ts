import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import effectsData from "@features/effects/data/effects.json";

import { VideoEffect } from "@/types/effects";

import {
  createFallbackEffect,
  processEffects,
  validateEffectsData,
} from "../utils/effect-processor";
// Импортируем JSON файл напрямую - в Tauri это работает отлично

interface UseEffectsReturn {
  effects: VideoEffect[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  isReady: boolean;
}

/**
 * Хук для загрузки и управления эффектами из JSON файла
 */
export function useEffects(): UseEffectsReturn {
  const { t } = useTranslation();
  const [effects, setEffects] = useState<VideoEffect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Загружает эффекты из импортированного JSON файла
   */
  const loadEffects = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      // Используем импортированные данные - в Tauri это работает мгновенно
      const data = effectsData;

      // Валидируем данные
      if (!validateEffectsData(data)) {
        throw new Error(
          t(
            "effects.errors.invalidEffectsData",
            "Invalid effects data structure",
          ),
        );
      }

      // Обрабатываем эффекты (преобразуем строки в функции)
      const processedEffects = processEffects(data.effects);

      setEffects(processedEffects);

      console.log(
        `✅ ${t("effects.messages.effectsLoaded", "Loaded {{count}} effects from JSON", { count: processedEffects.length })}`,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("effects.errors.unknownError", "Unknown error");
      setError(
        t(
          "effects.errors.failedToLoadEffects",
          "Failed to load effects: {{error}}",
          { error: errorMessage },
        ),
      );

      // Создаем fallback эффекты в случае ошибки
      const fallbackEffects = [
        createFallbackEffect("brightness"),
        createFallbackEffect("contrast"),
        createFallbackEffect("saturation"),
      ];

      setEffects(fallbackEffects);

      console.error(
        `❌ ${t("effects.errors.fallbackEffects", "Failed to load effects, using fallback")}:`,
        err,
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Загружаем эффекты при монтировании компонента
  useEffect(() => {
    loadEffects();
  }, [loadEffects]);

  return {
    effects,
    loading,
    error,
    reload: loadEffects,
    isReady: !loading && effects.length > 0,
  };
}

/**
 * Хук для получения конкретного эффекта по ID
 * Примечание: Названо useEffectById, чтобы избежать конфликта с React.useEffect
 */
export function useEffectById(effectId: string): VideoEffect | null {
  const { effects, isReady } = useEffects();

  if (!isReady) {
    return null;
  }

  return effects.find((effect) => effect.id === effectId) || null;
}

/**
 * Хук для получения эффектов по категории
 */
export function useEffectsByCategory(category: string): VideoEffect[] {
  const { effects, isReady } = useEffects();

  if (!isReady) {
    return [];
  }

  return effects.filter((effect) => effect.category === category);
}

/**
 * Хук для поиска эффектов
 */
export function useEffectsSearch(
  query: string,
  lang: "ru" | "en" = "ru",
): VideoEffect[] {
  const { effects, isReady } = useEffects();

  if (!isReady || !query.trim()) {
    return effects;
  }

  const lowercaseQuery = query.toLowerCase();

  return effects.filter(
    (effect) =>
      (effect.labels?.[lang] || effect.name || "")
        .toLowerCase()
        .includes(lowercaseQuery) ||
      (effect.description?.[lang] || "")
        .toLowerCase()
        .includes(lowercaseQuery) ||
      (effect.tags || []).some((tag) =>
        tag.toLowerCase().includes(lowercaseQuery),
      ),
  );
}
