// Типы

// Components
export {
  ScenarioBrowser,
  type ScenarioBrowserProps,
  ScenarioPreview,
  type ScenarioPreviewProps,
  ScenarioWizard,
  type ScenarioWizardProps,
} from "./components"

// Hooks
export {
  type UseScenarioReturn,
  type UseScenarioWizardOptions,
  type UseScenarioWizardReturn,
  useScenario,
  useScenarioWizard,
  type WizardData,
  type WizardStepState,
} from "./hooks"
// Сценарии
export {
  allScenarios,
  automationScenarios,
  getAiScenarios,
  getScenarioById,
  getScenariosByCategory,
  getScenariosByDifficulty,
  scenariosByCategory,
  scenariosByDifficulty,
  structureScenarios,
} from "./lib/scenarios"
// Services
export {
  createScenarioActor,
  type ExecuteScenarioOptions,
  type ScenarioContext,
  ScenarioExecutor,
  type ScenarioMachineContext,
  type ScenarioMachineEvent,
  type StepExecutionResult,
  type StepHandler,
  scenarioExecutor,
  scenarioMachine,
} from "./services"
export type {
  AutomationConfig,
  Scenario,
  ScenarioFilter,
  ScenarioRequirements,
  ScenarioResult,
  ScenarioSettings,
  ScenarioSortBy,
  ScenarioSortOrder,
  ScenarioStep,
  ScenarioStepType,
  StepConfig,
  StepValidation,
} from "./types"
