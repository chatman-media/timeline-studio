// Re-export commonly used mocks for convenience

export { mockUseClips, mockUseTimeline, mockUseTimelineSelection, mockUseTracks } from "./hooks"
export { mockTimelineService } from "./services"
export {
  createMockClip,
  createMockMediaFile,
  createMockProject,
  createMockProjectResources,
  createMockProjectSettings,
  createMockSection,
  createMockTrack,
} from "./test-factories"
