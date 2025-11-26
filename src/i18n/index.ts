import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import { createLogger } from "@/lib/tauri-logger"
import { DEFAULT_LANGUAGE, getTextDirection, isSupportedLanguage, type LanguageCode } from "./constants"

// Только английский встроен как fallback
import translationEN from "./locales/en.json"

const logger = createLogger("i18n")

const isBrowser = typeof window !== "undefined"

// Ленивая загрузка переводов
const loadTranslation = async (lang: string): Promise<Record<string, unknown>> => {
  switch (lang) {
    case "ar":
      return (await import("./locales/ar.json")).default
    case "de":
      return (await import("./locales/de.json")).default
    case "es":
      return (await import("./locales/es.json")).default
    case "fa":
      return (await import("./locales/fa.json")).default
    case "fr":
      return (await import("./locales/fr.json")).default
    case "hi":
      return (await import("./locales/hi.json")).default
    case "it":
      return (await import("./locales/it.json")).default
    case "ja":
      return (await import("./locales/ja.json")).default
    case "ko":
      return (await import("./locales/ko.json")).default
    case "pt":
      return (await import("./locales/pt.json")).default
    case "ru":
      return (await import("./locales/ru.json")).default
    case "th":
      return (await import("./locales/th.json")).default
    case "tr":
      return (await import("./locales/tr.json")).default
    case "zh":
      return (await import("./locales/zh.json")).default
    default:
      return translationEN
  }
}

// Кэш загруженных переводов
const loadedLanguages = new Set<string>(["en"])

// Загрузить язык если еще не загружен
const ensureLanguageLoaded = async (lang: string): Promise<void> => {
  if (loadedLanguages.has(lang)) return

  try {
    const translation = await loadTranslation(lang)
    i18n.addResourceBundle(lang, "translation", translation, true, true)
    loadedLanguages.add(lang)
    logger.debugSync("Language loaded", { lang })
  } catch (error) {
    logger.errorSync("Failed to load language", { lang, error })
  }
}

// Инициализация i18next
const initI18n = () => {
  // eslint-disable-next-line import/no-named-as-default-member
  const instance = i18n.use(initReactI18next)

  if (isBrowser) {
    instance.use(LanguageDetector)
  }

  // Получаем сохраненный язык
  let savedLanguage = DEFAULT_LANGUAGE
  if (isBrowser) {
    try {
      const storedLanguage = localStorage.getItem("app-language")
      if (storedLanguage && isSupportedLanguage(storedLanguage)) {
        savedLanguage = storedLanguage as LanguageCode
      }
    } catch {
      // ignore
    }
  }

  // Инициализируем только с английским
  instance.init({
    resources: {
      en: { translation: translationEN },
    },
    lng: savedLanguage,
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",
    interpolation: { escapeValue: false },
    ...(isBrowser && {
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "app-language",
        caches: ["localStorage"],
      },
    }),
  })

  // Загружаем сохранённый язык если не английский
  if (savedLanguage !== "en") {
    void ensureLanguageLoaded(savedLanguage)
  }

  // При смене языка - загружаем его
  i18n.on("languageChanged", (lng) => {
    logger.infoSync("Language changed", { lng })

    // Загружаем язык если нужно
    void ensureLanguageLoaded(lng)

    if (isBrowser) {
      try {
        localStorage.setItem("app-language", lng)
        const direction = getTextDirection(lng)
        document.documentElement.dir = direction
        document.documentElement.setAttribute("lang", lng)
      } catch {
        // ignore
      }
    }
  })

  return instance
}

const i18nInstance = initI18n()

export { ensureLanguageLoaded }
export default i18nInstance
