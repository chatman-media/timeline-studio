/**
 * @deprecated
 *
 * Этот файл УСТАРЕЛ и перемещён в /src/config/providers/app-providers.tsx
 *
 * По архитектуре FEOD (Fractal Entity Oriental Design):
 * - Провайдеры приложения относятся к App Layer
 * - App Layer находится в /src/config/
 * - Импортируется ТОЛЬКО в /src/app/layout.tsx
 *
 * НЕ импортируйте этот файл!
 * Используйте: import { Providers } from '@/config/providers/app-providers'
 */

"use client"

import { type ReactNode } from "react"
import { Providers as AppProviders } from "@/config/providers/app-providers"

interface ProvidersProps {
  children: ReactNode
}

/**
 * @deprecated Используйте @/config/providers/app-providers
 */
export function Providers({ children }: ProvidersProps) {
  console.warn(
    "[DEPRECATED] Importing from @/features/media-studio/services/providers is deprecated. " +
      "Use @/config/providers/app-providers instead.",
  )
  return <AppProviders data-oid="iu66r2_">{children}</AppProviders>
}
