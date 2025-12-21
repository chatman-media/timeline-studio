import { memo } from "react"

import { cn } from "@/lib/utils"

interface MetadataItem {
  icon?: React.ReactNode
  label: string
}

interface PreviewInfoProps {
  /** Заголовок */
  title: string

  /** Подзаголовок */
  subtitle?: string

  /** Теги */
  tags?: string[]

  /** Метаданные (для list view) */
  metadata?: MetadataItem[]

  /** Режим отображения */
  variant?: "compact" | "full" | "list"

  /** CSS классы */
  className?: string
}

/**
 * Компонент для отображения информации о превью
 */
export const PreviewInfo = memo(function PreviewInfo({
  title,
  subtitle,
  tags,
  metadata,
  variant = "compact",
  className,
}: PreviewInfoProps) {
  // Compact variant - только название внизу превью
  if (variant === "compact") {
    return (
      <div className={cn("bg-muted px-1.5 py-1 text-center", className)}>
        <div className="truncate text-xs font-medium" title={title}>
          {title}
        </div>
      </div>
    )
  }

  // List variant - полная информация для строки
  if (variant === "list") {
    return (
      <div className={cn("flex-1 min-w-0", className)}>
        <div className="truncate text-sm font-medium">{title}</div>
        {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
        {metadata && metadata.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {metadata.map((item, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {item.icon}
                {item.label}
              </span>
            ))}
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {tag}
              </span>
            ))}
            {tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>}
          </div>
        )}
      </div>
    )
  }

  // Full variant - название, подзаголовок, теги
  return (
    <div className={cn("bg-muted px-2 py-1.5", className)}>
      <div className="truncate text-sm font-medium" title={title}>
        {title}
      </div>
      {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-background px-1 py-0.5 text-[10px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})
