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
    // Property reads must stay side-effect-free. The montage-planner barrel is
    // imported eagerly (top-bar → montage-planner), so this proxy is exported and
    // evaluated BEFORE MontagePlannerBindingsBootstrapProvider registers the real
    // bindings. React Fast Refresh (and devtools/console introspection) probe every
    // export at module-eval time — isLikelyComponentType reads `.prototype` /
    // `.displayName` / `.$$typeof` — and a throwing getter there crashes the whole
    // feature module and takes down the app in dev/browser-preview. Returning
    // undefined keeps introspection harmless; genuine misuse still throws on
    // apply/construct (calling or `new`-ing an unregistered binding).
    get() {
      return undefined
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
