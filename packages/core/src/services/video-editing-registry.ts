type VideoEditingFunction = (...args: any[]) => any

export interface UndoRedoHelpersBinding {
  createAddClipAction: VideoEditingFunction
  createRemoveClipAction: VideoEditingFunction
  createMoveClipAction: VideoEditingFunction
  createBatchOperationAction: VideoEditingFunction
}

export interface VideoEditingBindings {
  getVideoEditingOrchestrator: VideoEditingFunction
  useUndoRedo: VideoEditingFunction
  UndoRedoHelpers: UndoRedoHelpersBinding
}

function createMissingBinding(name: string): VideoEditingFunction {
  return () => {
    throw new Error(`Video editing binding "${name}" is not registered`)
  }
}

function createMissingBindings(): VideoEditingBindings {
  return {
    getVideoEditingOrchestrator: createMissingBinding("getVideoEditingOrchestrator"),
    UndoRedoHelpers: {
      createAddClipAction: createMissingBinding("UndoRedoHelpers.createAddClipAction"),
      createBatchOperationAction: createMissingBinding("UndoRedoHelpers.createBatchOperationAction"),
      createMoveClipAction: createMissingBinding("UndoRedoHelpers.createMoveClipAction"),
      createRemoveClipAction: createMissingBinding("UndoRedoHelpers.createRemoveClipAction"),
    },
    useUndoRedo: createMissingBinding("useUndoRedo"),
  }
}

let registeredVideoEditingBindings = createMissingBindings()

export function setVideoEditingBindings(bindings: VideoEditingBindings): void {
  registeredVideoEditingBindings = {
    ...createMissingBindings(),
    ...bindings,
    UndoRedoHelpers: {
      ...createMissingBindings().UndoRedoHelpers,
      ...bindings.UndoRedoHelpers,
    },
  }
}

export function getVideoEditingBindings(): VideoEditingBindings {
  return registeredVideoEditingBindings
}

export function clearVideoEditingBindings(): void {
  registeredVideoEditingBindings = createMissingBindings()
}
