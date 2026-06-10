export interface AIToolResultMetadata {
  model?: string
  provider?: string
  tokenCount?: number
  inputTokens?: number
  outputTokens?: number
  cost?: number
  cacheHit?: boolean
  cacheKey?: string
  executionTime?: number
  memoryUsage?: number
  cpuUsage?: number
  confidence?: number
  accuracy?: number
  toolVersion?: string
  apiVersion?: string
  [key: string]: any
}

export interface AIToolResult<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
  warnings?: string[]
  executionTime: number
  toolName: string
  executionId: string
  metadata?: AIToolResultMetadata
}

export interface AIToolExecutionOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  enableLogging?: boolean
  metadata?: Record<string, any>
}

export type AIToolDomain = "core" | "analysis" | "automation" | "integration"
export type CoreToolCategory = "timeline" | "resources" | "browser" | "player"
export type AnalysisToolCategory =
  | "video-analysis"
  | "audio-analysis"
  | "content-intelligence"
  | "whisper-tools"
  | "multimodal"
export type AutomationToolCategory =
  | "batch-processing"
  | "montage-planning"
  | "workflow-automation"
  | "smart-templates"
  | "performance"
export type IntegrationToolCategory = "export-tools" | "platform-integration"
export type AIToolCategory = CoreToolCategory | AnalysisToolCategory | AutomationToolCategory | IntegrationToolCategory

export interface AIToolExample {
  name?: string
  description: string
  input: any
  output?: any
  expectedOutput?: any
}

export interface AIToolMetadata {
  name: string
  displayName?: string
  description: string
  domain: AIToolDomain
  category: AIToolCategory
  version: string
  author?: string
  tags?: string[]
  dependencies?: string[]
  inputSchema?: any
  outputSchema?: any
  examples?: AIToolExample[]
}

export interface IAITool {
  readonly metadata: AIToolMetadata
  execute(input: any, options?: AIToolExecutionOptions): Promise<AIToolResult>
  validate(input: any): boolean
  getSchema(): { input: any; output: any }
  getToolName(): string
  getMetadata(): AIToolMetadata
}
