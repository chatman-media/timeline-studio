import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// Импорт констант для языков
import {
  DEFAULT_LANGUAGE,
  LanguageCode,
  isSupportedLanguage,
} from "./constants";
// Импорт ресурсов переводов
import translationDE from "./locales/de.json";
import translationEN from "./locales/en.json";
import translationES from "./locales/es.json";
import translationFR from "./locales/fr.json";
import translationRU from "./locales/ru.json";

// Проверка, что код выполняется в браузере
const isBrowser = typeof window !== "undefined";

// Ресурсы переводов
const resources = {
  ru: {
    translation: translationRU,
  },
  en: {
    translation: translationEN,
  },
  es: {
    translation: translationES,
  },
  fr: {
    translation: translationFR,
  },
  de: {
    translation: translationDE,
  },
};

// Инициализация i18next
const initI18n = () => {
  // Используем LanguageDetector только в браузере
  // eslint-disable-next-line import/no-named-as-default-member
  const instance = i18n.use(initReactI18next);

  if (isBrowser) {
    instance.use(LanguageDetector);
  }

  // Получаем сохраненный язык из localStorage
  let savedLanguage = DEFAULT_LANGUAGE;
  if (isBrowser) {
    try {
      const storedLanguage = localStorage.getItem("app-language");
      if (storedLanguage && isSupportedLanguage(storedLanguage)) {
        savedLanguage = storedLanguage as LanguageCode;
        console.log(
          "i18n: Using saved language from localStorage:",
          savedLanguage,
        );
      }
    } catch (error) {
      console.error("i18n: Error reading language from localStorage:", error);
    }
  }

  // Инициализируем i18n
  const initResult = instance.init({
    resources,
    lng: savedLanguage, // Используем сохраненный язык
    fallbackLng: "en", // Язык по умолчанию, если сохраненный недоступен
    debug: process.env.NODE_ENV === "development", // Включаем отладку только в режиме разработки

    interpolation: {
      escapeValue: false, // Не экранировать HTML
    },

    // Настройки определения языка (только для браузера)
    ...(isBrowser && {
      detection: {
        // Изменяем порядок определения языка, чтобы localStorage имел приоритет
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "app-language", // Ключ в localStorage
        caches: ["localStorage"],
      },
    }),
  });

  // Безопасно обрабатываем результат инициализации
  if (initResult && typeof initResult.catch === "function") {
    initResult.catch((error) => {
      console.error("i18n: Failed to initialize:", error);
    });
  }

  // Обработчик изменения языка
  i18n.on("languageChanged", (lng) => {
    // Сохраняем в localStorage
    if (isBrowser) {
      try {
        localStorage.setItem("app-language", lng);
        console.log("i18n: Language changed and saved to localStorage:", lng);
      } catch (error) {
        console.error("i18n: Error saving language to localStorage:", error);
      }
    }
  });

  return instance;
};

// Инициализируем i18n
const i18nInstance = initI18n();

export default i18nInstance;
