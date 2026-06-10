import { afterEach, describe, expect, it, vi } from "vitest"
import {
  clearMediaManagementBindings,
  getMediaManagementBindings,
  setMediaManagementBindings,
  type MediaManagementBindings,
} from "../media-management-registry"

function createBindings(): MediaManagementBindings {
  const binding = vi.fn()
  return {
    getMediaFiles: binding,
    getMediaMetadata: binding,
    getMediaMetadataService: binding,
    selectAudioFile: binding,
    selectMediaDirectory: binding,
    useAutoProxy: binding,
    useCacheStatistics: binding,
    useFileOperations: binding,
    useFramePreview: binding,
    useMediaImport: binding,
    useMediaManagement: binding,
    useMediaMetadata: binding,
    useMediaPreview: binding,
    useMediaProcessor: binding,
    useMediaRestoration: binding,
    usePreviewPreloader: binding,
    useSimpleMediaProcessor: binding,
  }
}

describe("media-management-registry", () => {
  afterEach(() => {
    clearMediaManagementBindings()
  })

  it("throws before media management bindings are registered", () => {
    expect(() => getMediaManagementBindings().useMediaManagement()).toThrow(
      'Media management binding "useMediaManagement" is not registered',
    )
  })

  it("stores registered media management bindings", () => {
    const bindings = createBindings()
    setMediaManagementBindings(bindings)

    getMediaManagementBindings().useMediaManagement("arg")

    expect(bindings.useMediaManagement).toHaveBeenCalledWith("arg")
  })
})
