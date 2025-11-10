/**
 * AI Services Domain Mocks - Central Export
 *
 * Централизованный экспорт всех моков для AI Services домена
 */

export * from "./ai-director-service"
// Re-export commonly used mocks
export {
  aiDirectorService,
  mockAIDirectorConfig,
  mockComprehensiveAnalysisResult,
  mockHealthStatus,
  mockSystemStatus,
  resetAIDirectorServiceMocks,
} from "./ai-director-service"
export * from "./test-utils"
export {
  createMockSnapshot,
  createMockTauriEvent,
  mockBackendSync,
  mockTestData,
  renderWithAIServices,
  simulateAnalysisError,
  simulateAnalysisProgress,
  waitForPromise,
  waitForTime,
} from "./test-utils"
export * from "./unified-orchestrator"
export {
  MockUnifiedOrchestrator,
  mockAnalysisWorkflow,
  mockBatchAnalysisWorkflow,
  mockMontageAnalysisResult,
  mockMontagePlan,
  mockUnifiedContentAnalysis,
  resetUnifiedOrchestratorMocks,
  unifiedOrchestrator,
} from "./unified-orchestrator"
