type MontagePlannerBindingValue = any

export interface MontagePlannerBindings {
  montagePlannerMachine: MontagePlannerBindingValue
  applyPlanToTimeline: MontagePlannerBindingValue
  ContentAnalyzer: MontagePlannerBindingValue
  createMarkersFromPlan: MontagePlannerBindingValue
  MomentDetector: MontagePlannerBindingValue
  PlanGenerator: MontagePlannerBindingValue
  RhythmCalculator: MontagePlannerBindingValue
  unifiedOrchestrator: MontagePlannerBindingValue
  DOMAIN_EVENTS: MontagePlannerBindingValue
  eventBus: MontagePlannerBindingValue
}

function createMissingBinding(name: keyof MontagePlannerBindings): MontagePlannerBindingValue {
  return new Proxy(function missingMontagePlannerBinding() {}, {
    apply() {
      throw new Error(`Montage planner binding "${name}" is not registered`)
    },
    construct() {
      throw new Error(`Montage planner binding "${name}" is not registered`)
    },
    get() {
      throw new Error(`Montage planner binding "${name}" is not registered`)
    },
  })
}

function createMissingBindings(): MontagePlannerBindings {
  return {
    applyPlanToTimeline: createMissingBinding("applyPlanToTimeline"),
    ContentAnalyzer: createMissingBinding("ContentAnalyzer"),
    createMarkersFromPlan: createMissingBinding("createMarkersFromPlan"),
    DOMAIN_EVENTS: createMissingBinding("DOMAIN_EVENTS"),
    eventBus: createMissingBinding("eventBus"),
    MomentDetector: createMissingBinding("MomentDetector"),
    montagePlannerMachine: createMissingBinding("montagePlannerMachine"),
    PlanGenerator: createMissingBinding("PlanGenerator"),
    RhythmCalculator: createMissingBinding("RhythmCalculator"),
    unifiedOrchestrator: createMissingBinding("unifiedOrchestrator"),
  }
}

let registeredMontagePlannerBindings = createMissingBindings()

export function setMontagePlannerBindings(bindings: MontagePlannerBindings): void {
  registeredMontagePlannerBindings = {
    ...createMissingBindings(),
    ...bindings,
  }
}

export function getMontagePlannerBindings(): MontagePlannerBindings {
  return registeredMontagePlannerBindings
}

export function clearMontagePlannerBindings(): void {
  registeredMontagePlannerBindings = createMissingBindings()
}
