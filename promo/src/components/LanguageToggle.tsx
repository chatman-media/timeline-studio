import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useLanguage } from "../contexts/LanguageContext"

interface LanguageToggleProps {
  className?: string
  isMobile?: boolean
}

type Language = "en" | "ru" | "zh"

interface LanguageOption {
  code: Language
  name: string
  flag: string
}

const languages: LanguageOption[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
]

export function LanguageToggle({ className = "", isMobile = false }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  const handleLanguageSelect = (langCode: Language) => {
    setLanguage(langCode)
    setIsOpen(false)
  }

  if (isMobile) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 cursor-pointer"
        >
          <div className="flex items-center">
            <span className="mr-2">{currentLanguage.flag}</span>
            <span>{currentLanguage.name}</span>
          </div>
          <motion.svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-2 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-200 cursor-pointer ${
                    lang.code === language
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="mr-2">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute inset-0 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          layoutId="language-bg"
        />
        <span className="relative z-10 mr-2">{currentLanguage.flag}</span>
        <span className="relative z-10 text-xs tracking-wider">
          {currentLanguage.code.toUpperCase()}
        </span>
        <motion.svg
          className="relative z-10 w-3 h-3 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden shadow-xl z-50 min-w-[120px]"
          >
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`flex items-center w-full px-3 py-2 text-sm transition-colors duration-200 cursor-pointer ${
                  lang.code === language
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
                whileHover={{ x: 2 }}
              >
                <span className="mr-2">{lang.flag}</span>
                <span className="text-xs">{lang.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}