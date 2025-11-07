/**
 * AI Services Domain - State Machines
 */

// Chat machine
export {
  type ChatMachine,
  type ChatMachineContext,
  type ChatMachineEvent,
  chatMachine,
} from "./chat-machine"

// Montage Planner machine
export {
  type MontagePlannerContext,
  type MontagePlannerEvent,
  type MontagePlannerMachine,
  montagePlannerMachine,
} from "./montage-planner-machine"

// AI Intelligence machine V2 (NEW - с интеграцией AI Director)
export {
  type AIIntelligenceContextV2,
  type AIIntelligenceEventV2,
  type AIIntelligenceMachineV2,
  type AIIntelligenceSnapshotV2,
  aiIntelligenceMachineV2,
} from "./ai-intelligence-machine-v2"

// Legacy AI Intelligence machine (deprecated - использовать V2)
export {
  type AIIntelligenceMachine,
  type AIIntelligenceContext,
  type AIIntelligenceEvent,
  aiIntelligenceMachine,
} from "./ai-intelligence-machine"
