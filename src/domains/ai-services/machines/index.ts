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

// Будут добавлены при миграции:
// - ai-intelligence-machine
// - ai-orchestrator-machine
