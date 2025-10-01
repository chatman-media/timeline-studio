/**
 * React Hook для работы с Domain Events
 */

import { useCallback, useEffect, useRef } from "react"
import { type DomainName, type EventHandler, eventBus, type PublishResult, type SubscriptionOptions } from "../events"

export interface UseDomainEventsOptions {
  /** Домен, от имени которого публикуются события */
  domain: DomainName
  /** Включить логирование событий */
  debug?: boolean
}

export interface UseDomainEventsReturn {
  /** Опубликовать событие */
  publish: <T = unknown>(type: string, payload: T, metadata?: Record<string, unknown>) => Promise<PublishResult>

  /** Подписаться на события */
  subscribe: <T = unknown>(handler: EventHandler<T>, options?: SubscriptionOptions) => void

  /** Подписаться на конкретный тип события */
  on: <T = unknown>(
    eventType: string | string[],
    handler: EventHandler<T>,
    options?: Omit<SubscriptionOptions, "filter">,
  ) => void

  /** Подписаться на событие один раз */
  once: <T = unknown>(eventType: string, handler: EventHandler<T>) => void
}

/**
 * Hook для работы с доменными событиями
 */
export function useDomainEvents(options: UseDomainEventsOptions): UseDomainEventsReturn {
  const { domain, debug = false } = options
  const unsubscribesRef = useRef<Set<() => void>>(new Set())

  // Публикация события
  const publish = useCallback(
    async <T = unknown>(type: string, payload: T, metadata?: Record<string, unknown>): Promise<PublishResult> => {
      if (debug) {
        console.log(`[${domain}] Publishing event:`, type, payload)
      }

      return eventBus.publish(type, domain, payload, {
        ...metadata,
        publishedBy: domain,
      })
    },
    [domain, debug],
  )

  // Подписка на события
  const subscribe = useCallback(
    <T = unknown>(handler: EventHandler<T>, options?: SubscriptionOptions): void => {
      const wrappedHandler: EventHandler<T> = (event) => {
        if (debug) {
          console.log(`[${domain}] Received event:`, event.type, event.payload)
        }
        return handler(event)
      }

      const unsubscribe = eventBus.subscribe(wrappedHandler, options)
      unsubscribesRef.current.add(unsubscribe)
    },
    [domain, debug],
  )

  // Подписка на конкретный тип события
  const on = useCallback(
    <T = unknown>(
      eventType: string | string[],
      handler: EventHandler<T>,
      options?: Omit<SubscriptionOptions, "filter">,
    ): void => {
      subscribe(handler, {
        ...options,
        filter: {
          type: eventType,
        },
      })
    },
    [subscribe],
  )

  // Подписка на событие один раз
  const once = useCallback(
    <T = unknown>(eventType: string, handler: EventHandler<T>): void => {
      subscribe(handler, {
        filter: { type: eventType },
        once: true,
      })
    },
    [subscribe],
  )

  // Отписка при размонтировании
  useEffect(() => {
    return () => {
      unsubscribesRef.current.forEach((unsubscribe) => unsubscribe())
      unsubscribesRef.current.clear()
    }
  }, [])

  return {
    publish,
    subscribe,
    on,
    once,
  }
}
