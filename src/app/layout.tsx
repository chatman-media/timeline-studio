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
  // Workaround for Next.js 16 static export + React Context bug
  // During static generation, skip providers to avoid useContext errors
  const isClient = typeof window !== "undefined"

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {isClient ? (
          <Providers>
            <AppErrorBoundary>{children}</AppErrorBoundary>
          </Providers>
        ) : (
          <AppErrorBoundary>{children}</AppErrorBoundary>
        )}
      </body>
    </html>
  )
}
