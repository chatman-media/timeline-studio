/**
 * About Modal
 *
 * Модальное окно "О программе"
 */

import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

export function AboutModal() {
  const { t } = useTranslation()

  const version = "1.0.0" // TODO: Get from package.json or Tauri config
  const buildDate = new Date().getFullYear()

  return (
    <div className="flex flex-col gap-4 p-6" data-oid="about-modal">
      {/* Logo and Title */}
      <div className="flex flex-col items-center gap-2" data-oid="about-header">
        <div className="text-2xl font-bold" data-oid="about-title">
          Timeline Studio
        </div>
        <div className="text-sm text-muted-foreground" data-oid="about-version">
          {t("about.version", "Версия")} {version}
        </div>
      </div>

      {/* Description */}
      <div className="text-center text-sm" data-oid="about-description">
        <p>{t("about.description", "Профессиональный видеоредактор для создания и монтажа видео")}</p>
      </div>

      {/* Credits */}
      <div className="flex flex-col gap-2 text-xs text-muted-foreground" data-oid="about-credits">
        <div data-oid="about-copyright">
          © {buildDate} Timeline Studio. {t("about.rights", "Все права защищены")}.
        </div>
        <div data-oid="about-technologies">
          {t("about.builtWith", "Создано с использованием")}: React, Next.js, Tauri, Rust
        </div>
      </div>

      {/* Links */}
      <div className="flex justify-center gap-4" data-oid="about-links">
        <Button
          variant="link"
          onClick={() => window.open("https://github.com/timeline-studio", "_blank")}
          data-oid="about-github"
        >
          GitHub
        </Button>
        <Button
          variant="link"
          onClick={() => window.open("https://github.com/timeline-studio/docs", "_blank")}
          data-oid="about-docs"
        >
          {t("about.documentation", "Документация")}
        </Button>
      </div>

      {/* License */}
      <div className="text-center text-xs text-muted-foreground" data-oid="about-license">
        {t("about.license", "Лицензия")}: MIT
      </div>
    </div>
  )
}
