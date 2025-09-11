import React, { createContext, useContext, useState } from "react"

type Language = "en" | "ru"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Navigation
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.project": "Project",
    "nav.blog": "Blog",
    "nav.docs": "Docs",
    "nav.about": "About",
    "nav.changelog": "Changelog",
    "nav.download": "Download Free",

    // Blog
    "blog.title": "Blog",
    "blog.subtitle": "News, tutorials, and insights from the Timeline Studio team",
    "blog.tagline": "Stay updated with the latest features and best practices",
    "blog.loading": "Loading posts...",
    "blog.readMore": "Read more",
    "blog.backToBlog": "Back to Blog",
    "blog.updatedWeekly": "Updated Weekly",
    "blog.developerInsights": "Developer Insights",
    "blog.tutorials": "Tutorials",

    // Footer
    "footer.product": "Product",
    "footer.resources": "Resources",
    "footer.company": "Company",
    "footer.legal": "Legal",
    "footer.rights": "All rights reserved",
    "footer.builtWith": "Built with",
    "footer.by": "by",
  },
  ru: {
    // Navigation
    "nav.features": "Возможности",
    "nav.pricing": "Цены",
    "nav.project": "О проекте",
    "nav.blog": "Блог",
    "nav.docs": "Доки",
    "nav.about": "О нас",
    "nav.changelog": "Изменения",
    "nav.download": "Скачать бесплатно",

    // Blog
    "blog.title": "Блог",
    "blog.subtitle": "Новости, туториалы и инсайты от команды Timeline Studio",
    "blog.tagline": "Будьте в курсе последних функций и лучших практик",
    "blog.loading": "Загрузка постов...",
    "blog.readMore": "Читать далее",
    "blog.backToBlog": "Вернуться в блог",
    "blog.updatedWeekly": "Обновляется еженедельно",
    "blog.developerInsights": "Инсайты разработчиков",
    "blog.tutorials": "Туториалы",

    // Footer
    "footer.product": "Продукт",
    "footer.resources": "Ресурсы",
    "footer.company": "Компания",
    "footer.legal": "Юридическое",
    "footer.rights": "Все права защищены",
    "footer.builtWith": "Создано с",
    "footer.by": "командой",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage for saved language preference
    const saved = localStorage.getItem("promo-language")
    if (saved === "ru" || saved === "en") return saved

    // Check browser language
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith("ru")) return "ru"
    return "en"
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("promo-language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)["en"]] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
