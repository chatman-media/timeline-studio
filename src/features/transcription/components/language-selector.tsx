import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LanguageSelectorProps {
  value?: string
  onChange: (value: string | undefined) => void
  includeAutoDetect?: boolean
}

const languages = [
  { code: "auto", name: "Auto-detect", nativeName: "Автоопределение" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
]

export function LanguageSelector({ value, onChange, includeAutoDetect = true }: LanguageSelectorProps) {
  const { t } = useTranslation()

  const availableLanguages = includeAutoDetect ? languages : languages.filter((lang) => lang.code !== "auto")

  return (
    <div className="space-y-2" data-oid="njnimz2">
      <Label data-oid="x2_fbz:">{t("transcription.language", "Язык")}</Label>
      <Select
        value={value || (includeAutoDetect ? "auto" : undefined)}
        onValueChange={(val) => onChange(val === "auto" ? undefined : val)}
        data-oid="wo5d26x"
      >
        <SelectTrigger data-oid="6r12._1">
          <SelectValue placeholder={t("transcription.selectLanguage", "Выберите язык")} data-oid="vfmgzm1" />
        </SelectTrigger>
        <SelectContent data-oid="u1bbdsx">
          {availableLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} data-oid="gygfz8m">
              <div className="flex items-center justify-between w-full" data-oid=".1fc51i">
                <span data-oid="s7:tbz3">{lang.nativeName}</span>
                {lang.code !== "auto" && (
                  <span className="text-xs text-muted-foreground ml-2" data-oid="ew.yp4d">
                    {lang.name}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
