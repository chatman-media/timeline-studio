"use client"

import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react"
import { type Actor, createActor } from "xstate"
// Используем машину из домена
import { aiIntelligenceMachine } from "@/domains/ai-services/machines/ai-intelligence-machine"

interface AIIntelligenceContextType {
  actor: Actor<typeof aiIntelligenceMachine> | null
}

const AIIntelligenceContext = createContext<AIIntelligenceContextType | null>(null)

interface AIIntelligenceProviderProps {
  children: ReactNode
}

export function AIIntelligenceProvider({ children }: AIIntelligenceProviderProps) {
  const [actor, setActor] = useState<Actor<typeof aiIntelligenceMachine> | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      const newActor = createActor(aiIntelligenceMachine)
      newActor.start()
      setActor(newActor)

      return () => {
        newActor.stop()
      }
    }
  }, [])

  const contextValue = useMemo(() => ({ actor }), [actor])

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
