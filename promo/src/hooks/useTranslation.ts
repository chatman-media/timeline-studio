import { type Language, translations } from "../constants/translations"
import { useLanguage } from "../contexts/LanguageContext"

export function useTranslation() {
  const { language, t } = useLanguage()

  return { t, language }
}
