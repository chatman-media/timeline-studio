/**
 * Shared Domain Mocks
 *
 * Export all mock utilities for easy importing in tests
 */

// AI Config Mocks
export {
  createMockAIConfig,
  createMockProviderConfig,
  mockAIConfigs,
  mockAnalysisResults,
  mockPlatformAdaptations,
  mockScriptResults,
} from "./ai-config"
// Domain Events Mocks
export {
  assertEventNotPublished,
  assertEventPublished,
  createEventSimulator,
  createEventSpy,
  createMockDomainEvent,
  createMockDomainEventsHook,
  createMockEventBus,
  mockAIServicePayloads,
  mockBrowserPayloads,
  mockMediaManagementPayloads,
  mockVideoEditingPayloads,
  waitForEvent,
} from "./domain-events"
