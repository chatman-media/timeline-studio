"use client"

import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react"
import { type Actor, createActor } from "xstate"

// Используем настоящую V2 машину с интеграцией AI Director
import { aiIntelligenceMachineV2 } from "@/domains/ai-services/machines"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "AiIntelligenceProvider" })

interface AIIntelligenceContextType {
  actor: Actor<typeof aiIntelligenceMachineV2> | null
  isConnected: boolean
  error: string | null
}

const AIIntelligenceContext = createContext<AIIntelligenceContextType | null>(null)

interface AIIntelligenceProviderProps {
  children: ReactNode
}

/**
 * AI Intelligence Provider с интеграцией BackendSync
 *
 * Синхронизирует состояние AI анализа с backend через BackendSync
 */
export function AIIntelligenceProvider({ children }: AIIntelligenceProviderProps) {
  const [actor, setActor] = useState<Actor<typeof aiIntelligenceMachineV2> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true

      // Создаем актор V2 машины с AI Director интеграцией
      const newActor = createActor(aiIntelligenceMachineV2)

      // Подписываемся на события актора для отслеживания состояния
      newActor.subscribe((snapshot) => {
        // V2 машина интегрирована с AI Director через AIEventBridge
        // События синхронизируются автоматически через Tauri events

        // Отслеживаем ошибки
        if (snapshot.context.error) {
          setError(snapshot.context.error)
        }

        // Отслеживаем подключение (активность машины)
        setIsConnected(snapshot.status === "active")
      })

      newActor.start()
      setActor(newActor)

      return () => {
        newActor.stop()
      }
    }
  }, [])

  const contextValue = useMemo(() => ({ actor, isConnected, error }), [actor, isConnected, error])

  return <AIIntelligenceContext.Provider value={contextValue}>{children}</AIIntelligenceContext.Provider>
}

export function useAIIntelligence() {
  const context = useContext(AIIntelligenceContext)
  if (!context) {
    throw new Error("useAIIntelligence must be used within AIIntelligenceProvider")
  }
  return context
}

export { AIIntelligenceContext }
