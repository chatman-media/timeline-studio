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

  console.log('[Tauri Init] Initializing event plugin internals...');

  const listenersStorage = {};
  const listeners = new Proxy(listenersStorage, {
    get(target, prop) {
      if (!(prop in target)) {
        console.warn('[Tauri Init] Accessing non-existent listener: ' + String(prop));
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
    }
  });

  if (typeof window !== 'undefined') {
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
      listeners: listeners,
      unregisterListener: function(event, eventId) {
        console.log('[Tauri Init] Unregister listener: ' + event + ', eventId: ' + eventId);
        if (eventId in listenersStorage) {
          delete listenersStorage[eventId];
        }
      }
    };

    console.log('[Tauri Init] Event plugin internals initialized successfully');
  }
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
