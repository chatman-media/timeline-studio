import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import { invoke } from "@tauri-apps/api/core"

// Импорт констант для языков
import { DEFAULT_LANGUAGE, getTextDirection, isSupportedLanguage, type LanguageCode } from "./constants"

// Fallback переводы для английского языка (встроены для надежности)
import translationEN from "./locales/en.json"

// Проверка, что код выполняется в браузере
const isBrowser = typeof window !== "undefined"

// Custom Tauri Backend для динамической загрузки переводов
class TauriBackend {
  type = "backend" as const
  static type = "backend" as const

  // Кеш загруженных переводов в памяти
  private cache = new Map<string, Record<string, unknown>>()

  async read(
    language: string,
    namespace: string,
    callback: (err: Error | null, data?: Record<string, unknown>) => void
  ): Promise<void> {
    try {
      const cacheKey = `${language}-${namespace}`

      // Проверяем кеш в памяти
      if (this.cache.has(cacheKey)) {
        console.log(`i18n: Loading ${language} from cache`)
        callback(null, this.cache.get(cacheKey))
        return
      }

      // Загружаем через Tauri API
      console.log(`i18n: Loading ${language} from Tauri backend`)
      const translationJson = await invoke<string>("load_translation_tauri", { lang: language })
      const parsed = JSON.parse(translationJson) as Record<string, unknown>

      // Сохраняем в кеш
      this.cache.set(cacheKey, parsed)

      callback(null, parsed)
    } catch (error) {
      console.error(`i18n: Failed to load translation for ${language}:`, error)

      // Fallback на английский если это не английский язык
      if (language !== "en") {
        console.log(`i18n: Falling back to English for ${language}`)
        callback(null, translationEN as Record<string, unknown>)
      } else {
        callback(error as Error)
      }
    }
  }

  // Очистить кеш (полезно для тестирования)
  clearCache(): void {
    this.cache.clear()
  }
}

// Создаем экземпляр backend
const tauriBackend = new TauriBackend()

// Инициализация i18next
const initI18n = () => {
  // Используем LanguageDetector только в браузере
  // eslint-disable-next-line import/no-named-as-default-member
  const instance = i18n.use(initReactI18next).use(tauriBackend)

  if (isBrowser) {
    instance.use(LanguageDetector)
  }

  // Получаем сохраненный язык из localStorage
  let savedLanguage = DEFAULT_LANGUAGE
  if (isBrowser) {
    try {
      const storedLanguage = localStorage.getItem("app-language")
      if (storedLanguage && isSupportedLanguage(storedLanguage)) {
        savedLanguage = storedLanguage as LanguageCode
        console.log("i18n: Using saved language from localStorage:", savedLanguage)
      }
    } catch (error) {
      console.error("i18n: Error reading language from localStorage:", error)
    }
  }

  // Инициализируем i18n с динамической загрузкой
  const initResult = instance.init({
    // Встроенный английский как fallback
    resources: {
      en: {
        translation: translationEN,
      },
    },
    lng: savedLanguage, // Используем сохраненный язык
    fallbackLng: "en", // Язык по умолчанию
    debug: process.env.NODE_ENV === "development", // Отладка в dev mode

    interpolation: {
      escapeValue: false, // Не экранировать HTML
    },

    // Backend опции
    backend: {
      loadPath: "{{lng}}/{{ns}}", // Шаблон (не используется в Tauri backend, но требуется)
    },

    // Настройки определения языка (только для браузера)
    ...(isBrowser && {
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "app-language",
        caches: ["localStorage"],
      },
    }),
  })

  // Безопасно обрабатываем результат инициализации
  if (initResult && typeof initResult.catch === "function") {
    initResult.catch((error: unknown) => {
      console.error("i18n: Failed to initialize:", error)
    })
  }

  // Обработчик изменения языка
  i18n.on("languageChanged", (lng) => {
    // Сохраняем в localStorage
    if (isBrowser) {
      try {
        localStorage.setItem("app-language", lng)
        console.log("i18n: Language changed and saved to localStorage:", lng)

        // Обновляем направление текста для RTL языков
        const direction = getTextDirection(lng)
        document.documentElement.dir = direction
        document.documentElement.setAttribute("lang", lng)
      } catch (error) {
        console.error("i18n: Error saving language to localStorage:", error)
      }
    }
  })

  return instance
}

// Инициализируем i18n
const i18nInstance = initI18n()

// Экспорт backend для возможности очистки кеша (полезно для тестов)
export { tauriBackend }

export default i18nInstance
