/**
 * AI Services Domain Mocks - Central Export
 *
 * Централизованный экспорт всех моков для AI Services домена
 */

export * from "./ai-director-service"
export * from "./unified-orchestrator"
export * from "./test-utils"

// Re-export commonly used mocks
export {
  mockComprehensiveAnalysisResult,
  mockHealthStatus,
  mockSystemStatus,
  mockAIDirectorConfig,
  aiDirectorService,
  resetAIDirectorServiceMocks,
} from "./ai-director-service"

export {
  mockUnifiedContentAnalysis,
  mockMontageAnalysisResult,
  mockMontagePlan,
  mockAnalysisWorkflow,
  mockBatchAnalysisWorkflow,
  MockUnifiedOrchestrator,
  unifiedOrchestrator,
  resetUnifiedOrchestratorMocks,
} from "./unified-orchestrator"

export {
  renderWithAIServices,
  createMockTauriEvent,
  simulateAnalysisProgress,
  simulateAnalysisError,
  mockBackendSync,
  mockTestData,
  createMockSnapshot,
  waitForPromise,
  waitForTime,
} from "./test-utils"
