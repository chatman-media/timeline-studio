import {
  getMontagePlannerBindings,
  type MontagePlannerBindings,
} from "@timeline-studio/core/services/montage-planner-registry"

export type MontagePlannerContext = any
export type MontagePlannerEvent = any
export type TimelineIntegrationOptions = Record<string, any>

export interface AnalysisWorkflow {
  workflowId: string
  videoPath: string
  stages: {
    aiDirector: string
    montagePlanner: string
    integration: string
  }
  status: string
  startTime: Date
  endTime?: Date
  errors: Array<{ error: string; stage?: string; timestamp?: Date }>
  results: {
    unified?: any
  }
}

export interface AIDirectorAnalysisProgressEvent {
  analysisId: string
  progress: number
  estimatedTimeRemaining?: number
  message?: string
}

export interface AIDirectorStageCompletedEvent {
  analysisId: string
  stage: string
  success: boolean
}

export interface ContentAnalysisCompletedEvent {
  analysisId: string
}

export interface ContentAnalysisStartedEvent {
  analysisId: string
}

interface DomainEventsProxy {
  AI_SERVICES: Record<string, string>
}

interface EventBusProxy {
  publish<T = any>(type: string, source: string, data: T): void
  subscribe<T = any>(callback: (event: { payload: T; type?: string }) => void, options?: any): () => void
}

interface UnifiedOrchestratorProxy {
  getActiveWorkflows(): AnalysisWorkflow[]
  [key: string]: any
}

export {
  analyzeAudioContent as analyzeAudioContentCommand,
  analyzeFrameQuality as analyzeFrameQualityCommand,
  analyzeVideoCompositionWithProcessor,
  analyzeVideoQuality as analyzeVideoQualityCommand,
  detectKeyMomentsFromDetections,
  generateMontagePlanFromMoments,
} from "./montage-planner-commands"

function getBinding(name: keyof MontagePlannerBindings) {
  return getMontagePlannerBindings()[name]
}

function createBindingProxy(name: keyof MontagePlannerBindings) {
  return new Proxy(function montagePlannerBindingProxy() {}, {
    apply(_target, thisArg, args) {
      return Reflect.apply(getBinding(name), thisArg, args)
    },
    construct(_target, args) {
      return Reflect.construct(getBinding(name), args)
    },
    get(_target, property) {
      const target = getBinding(name)
      const value = target[property as keyof typeof target]
      return typeof value === "function" ? value.bind(target) : value
    },
    set(_target, property, value) {
      getBinding(name)[property as keyof ReturnType<typeof getBinding>] = value
      return true
    },
  })
}

export const montagePlannerMachine = createBindingProxy("montagePlannerMachine") as any

export function applyPlanToTimeline(...args: any[]) {
  return getBinding("applyPlanToTimeline")(...args)
}

export const ContentAnalyzer = createBindingProxy("ContentAnalyzer") as any

export function createMarkersFromPlan(...args: any[]) {
  return getBinding("createMarkersFromPlan")(...args)
}

export const MomentDetector = createBindingProxy("MomentDetector") as any
export const PlanGenerator = createBindingProxy("PlanGenerator") as any
export const RhythmCalculator = createBindingProxy("RhythmCalculator") as any

export const applyPlanToTimelineService = applyPlanToTimeline
export const createMarkersFromPlanService = createMarkersFromPlan

export const unifiedOrchestrator = createBindingProxy("unifiedOrchestrator") as unknown as UnifiedOrchestratorProxy
export const DOMAIN_EVENTS = createBindingProxy("DOMAIN_EVENTS") as unknown as DomainEventsProxy
export const eventBus = createBindingProxy("eventBus") as unknown as EventBusProxy
