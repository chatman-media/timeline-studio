import type React from "react"

import "@/global/styles/variables.css"
import "@/domains/shared/styles/globals.css"

import type { Metadata } from "next"
import { AppErrorBoundary } from "@/components/error-boundary"
import { Providers } from "@/config/providers/app-providers"

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

  // Глобальный handler для ошибок связанных с Tauri event listeners
  window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('listeners') && e.message.includes('handlerId')) {
      e.preventDefault();
      console.warn('[Tauri] Suppressed listener error:', e.message);
      return true;
    }
  });

  // Создаём безопасный объект-заглушку для listeners
  const listenersStorage = {};
  const defaultListener = Object.freeze({ handlerId: 0, event: 'unknown' });

  const listeners = new Proxy(listenersStorage, {
    get: function(target, prop) {
      if (prop === Symbol.toStringTag) return 'Object';
      if (typeof prop === 'symbol') return undefined;
      return target[prop] || defaultListener;
    },
    set: function(target, prop, value) {
      target[prop] = value;
      return true;
    },
    deleteProperty: function(target, prop) {
      delete target[prop];
      return true;
    },
    has: function(target, prop) {
      return true; // Всегда возвращаем true чтобы избежать ошибок
    }
  });

  // Безопасная функция unregisterListener
  var safeUnregister = function(event, eventId) {
    try {
      if (eventId && listenersStorage[eventId]) {
        delete listenersStorage[eventId];
      }
    } catch(e) {
      // Ignore
    }
  };

  // Инициализируем __TAURI_EVENT_PLUGIN_INTERNALS__
  Object.defineProperty(window, '__TAURI_EVENT_PLUGIN_INTERNALS__', {
    value: {
      listeners: listeners,
      unregisterListener: safeUnregister
    },
    writable: true,
    configurable: true
  });
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
