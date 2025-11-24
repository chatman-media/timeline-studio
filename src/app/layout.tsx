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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  'use strict';

  if (typeof window === 'undefined') return;

  // Создаём безопасный объект-заглушку для listeners
  const listenersStorage = {};

  const safeGet = function(obj, prop) {
    if (obj && prop in obj) return obj[prop];
    return { handlerId: 0, event: 'unknown' };
  };

  const listeners = new Proxy(listenersStorage, {
    get(target, prop) {
      if (prop === Symbol.toStringTag) return 'Object';
      if (typeof prop === 'symbol') return undefined;
      if (!(prop in target)) {
        return { handlerId: 0, event: 'unknown' };
      }
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
    deleteProperty(target, prop) {
      delete target[prop];
      return true;
    },
    has(target, prop) {
      return prop in target;
    }
  });

  window.__TAURI_EVENT_PLUGIN_INTERNALS__ = window.__TAURI_EVENT_PLUGIN_INTERNALS__ || {};
  window.__TAURI_EVENT_PLUGIN_INTERNALS__.listeners = listeners;
  window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener = function(event, eventId) {
    if (eventId && eventId in listenersStorage) {
      delete listenersStorage[eventId];
    }
  };
})();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          <AppErrorBoundary>{children}</AppErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
