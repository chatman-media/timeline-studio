/**
 * AI Services Domain Provider
 *
 * Provides centralized access to all AI services state machines and services
 * Replaces individual providers for chat, montage-planner, ai-content-intelligence
 */

import { useActor } from "@xstate/react"
import { createContext, type PropsWithChildren, useContext } from "react"
import { aiIntelligenceMachine } from "../machines/ai-intelligence-machine"
// Import domain machines
import { ChatMachineContext, chatMachine } from "../machines/chat-machine"
import { MontagePlannerContext, montagePlannerMachine } from "../machines/montage-planner-machine"

// Import domain types
import type {
  AIIntelligenceContext,
  AIIntelligenceEvent,
  AIServicesDomainConfig,
  ChatMachineEvent,
  MontagePlannerEvent,
} from "../types"

// Domain Provider Context
interface AIServicesDomainContextValue {
  // Domain configuration
  config: AIServicesDomainConfig

  // Chat machine
  chatState: ChatMachineContext
  chatSend: (event: ChatMachineEvent) => void

  // Montage Planner machine
  montagePlannerState: MontagePlannerContext
  montagePlannerSend: (event: MontagePlannerEvent) => void

  // AI Intelligence machine
  aiIntelligenceState: AIIntelligenceContext
  aiIntelligenceSend: (event: AIIntelligenceEvent) => void

  // Domain-level actions
  resetAllServices: () => void
  enableService: (service: keyof AIServicesDomainConfig) => void
  disableService: (service: keyof AIServicesDomainConfig) => void
}

const AIServicesDomainContext = createContext<AIServicesDomainContextValue | null>(null)

// Domain Provider Component
export function AIServicesDomainProvider({ children }: PropsWithChildren) {
  // Initialize domain configuration
  const domainConfig: AIServicesDomainConfig = {
    chatEnabled: true,
    intelligenceEnabled: true,
    montagePlannerEnabled: true,
    recognitionEnabled: true,
  }

  // Initialize chat machine
  const [chatState, chatSend] = useActor(chatMachine)

  // Initialize montage planner machine
  const [montagePlannerState, montagePlannerSend] = useActor(montagePlannerMachine)

  // Initialize AI intelligence machine
  const [aiIntelligenceState, aiIntelligenceSend] = useActor(aiIntelligenceMachine)

  // Domain-level actions
  const resetAllServices = () => {
    chatSend({ type: "CLEAR_MESSAGES" })
    montagePlannerSend({ type: "RESET" })
    aiIntelligenceSend({ type: "RESET" })
  }

  const enableService = (service: keyof AIServicesDomainConfig) => {
    // Implement service enabling logic
    console.log(`[AI Services Domain] Enabling service: ${service}`)
  }

  const disableService = (service: keyof AIServicesDomainConfig) => {
    // Implement service disabling logic
    console.log(`[AI Services Domain] Disabling service: ${service}`)
  }

  const contextValue: AIServicesDomainContextValue = {
    config: domainConfig,
    chatState: chatState.context,
    chatSend,
    montagePlannerState: montagePlannerState.context,
    montagePlannerSend,
    aiIntelligenceState: aiIntelligenceState.context,
    aiIntelligenceSend,
    resetAllServices,
    enableService,
    disableService,
  }

  return <AIServicesDomainContext.Provider value={contextValue}>{children}</AIServicesDomainContext.Provider>
}

// Domain Hook
export function useAIServicesDomain() {
  const context = useContext(AIServicesDomainContext)
  if (!context) {
    throw new Error("useAIServicesDomain must be used within AIServicesDomainProvider")
  }
  return context
}

// Specific service hooks for backward compatibility
export function useAIServicesChat() {
  const { chatState, chatSend } = useAIServicesDomain()
  return { chatState, chatSend }
}

export function useAIServicesMontage() {
  const { montagePlannerState, montagePlannerSend } = useAIServicesDomain()
  return { montagePlannerState, montagePlannerSend }
}

export function useAIServicesIntelligence() {
  const { aiIntelligenceState, aiIntelligenceSend } = useAIServicesDomain()
  return { aiIntelligenceState, aiIntelligenceSend }
}

// Domain utilities
export function useAIServicesDomainStatus() {
  const { config } = useAIServicesDomain()

  return {
    isServiceEnabled: (service: keyof AIServicesDomainConfig) => config[service],
    enabledServices: Object.entries(config)
      .filter(([, enabled]) => enabled)
      .map(([service]) => service),
    disabledServices: Object.entries(config)
      .filter(([, enabled]) => !enabled)
      .map(([service]) => service),
  }
}
