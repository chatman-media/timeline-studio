type MediaManagementFunction = (...args: any[]) => any

export interface MediaManagementBindings {
  getMediaFiles: MediaManagementFunction
  getMediaMetadata: MediaManagementFunction
  getMediaMetadataService: MediaManagementFunction
  selectAudioFile: MediaManagementFunction
  selectMediaDirectory: MediaManagementFunction
  useAutoProxy: MediaManagementFunction
  useCacheStatistics: MediaManagementFunction
  useFileOperations: MediaManagementFunction
  useFramePreview: MediaManagementFunction
  useMediaImport: MediaManagementFunction
  useMediaManagement: MediaManagementFunction
  useMediaMetadata: MediaManagementFunction
  useMediaPreview: MediaManagementFunction
  useMediaProcessor: MediaManagementFunction
  useMediaRestoration: MediaManagementFunction
  usePreviewPreloader: MediaManagementFunction
  useSimpleMediaProcessor: MediaManagementFunction
}

function createMissingBinding(name: keyof MediaManagementBindings): MediaManagementFunction {
  return () => {
    throw new Error(`Media management binding "${name}" is not registered`)
  }
}

function createMissingBindings(): MediaManagementBindings {
  return {
    getMediaFiles: createMissingBinding("getMediaFiles"),
    getMediaMetadata: createMissingBinding("getMediaMetadata"),
    getMediaMetadataService: createMissingBinding("getMediaMetadataService"),
    selectAudioFile: createMissingBinding("selectAudioFile"),
    selectMediaDirectory: createMissingBinding("selectMediaDirectory"),
    useAutoProxy: createMissingBinding("useAutoProxy"),
    useCacheStatistics: createMissingBinding("useCacheStatistics"),
    useFileOperations: createMissingBinding("useFileOperations"),
    useFramePreview: createMissingBinding("useFramePreview"),
    useMediaImport: createMissingBinding("useMediaImport"),
    useMediaManagement: createMissingBinding("useMediaManagement"),
    useMediaMetadata: createMissingBinding("useMediaMetadata"),
    useMediaPreview: createMissingBinding("useMediaPreview"),
    useMediaProcessor: createMissingBinding("useMediaProcessor"),
    useMediaRestoration: createMissingBinding("useMediaRestoration"),
    usePreviewPreloader: createMissingBinding("usePreviewPreloader"),
    useSimpleMediaProcessor: createMissingBinding("useSimpleMediaProcessor"),
  }
}

let registeredMediaManagementBindings = createMissingBindings()

export function setMediaManagementBindings(bindings: MediaManagementBindings): void {
  registeredMediaManagementBindings = {
    ...createMissingBindings(),
    ...bindings,
  }
}

export function getMediaManagementBindings(): MediaManagementBindings {
  return registeredMediaManagementBindings
}

export function clearMediaManagementBindings(): void {
  registeredMediaManagementBindings = createMissingBindings()
}
