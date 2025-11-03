import type React from "react"

import "@/styles/globals.css"

import type { Metadata } from "next"
import { AppErrorBoundary } from "@/components/error-boundary"
import { Providers } from "@/features/media-studio/services/providers"

export const metadata: Metadata = {
  title: "Timeline Studio",
  description: "Professional video editing application",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <AppErrorBoundary>{children}</AppErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
