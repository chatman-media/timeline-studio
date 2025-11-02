/**
 * Performance benchmarking utilities for Timeline Studio
 * Specialized tools for measuring audio analysis performance improvements
 */

export interface BenchmarkConfig {
  warmUpRuns: number
  benchmarkRuns: number
  timeoutMs: number
  memoryTrackingEnabled: boolean
  accuracyTrackingEnabled: boolean
}

export interface PerformanceMetrics {
  operation: string
  system: "unified" | "legacy"
  executionTimes: number[]
  averageTime: number
  medianTime: number
  minTime: number
  maxTime: number
  standardDeviation: number
  memoryUsage?: {
    peak: number
    average: number
    delta: number
  }
  accuracy?: number
  throughput: number // operations per second
  timestamp: string
}

export interface ComparisonReport {
  operation: string
  unified: PerformanceMetrics
  legacy: PerformanceMetrics
  improvements: {
    speed: number // percentage
    memory: number // percentage
    accuracy: number // percentage
    throughput: number // percentage
  }
  statisticalSignificance: {
    speedSignificant: boolean
    pValue: number
    confidenceLevel: number
  }
  passed: boolean
  thresholds: {
    minimumSpeedImprovement: number
    minimumMemoryImprovement: number
    minimumAccuracyImprovement: number
  }
}

export class PerformanceBenchmarker {
  private config: BenchmarkConfig
  private results: PerformanceMetrics[] = []

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = {
      warmUpRuns: 3,
      benchmarkRuns: 10,
      timeoutMs: 30000,
      memoryTrackingEnabled: true,
      accuracyTrackingEnabled: true,
      ...config,
    }
  }

  async runBenchmark<T>(
    operation: string,
    system: "unified" | "legacy",
    testFunction: () => Promise<T>,
    extractMetrics?: (result: T) => { memory?: number; accuracy?: number },
  ): Promise<PerformanceMetrics> {
    console.log(`🔄 Benchmarking ${operation} (${system} system)...`)

    // Warm-up runs
    for (let i = 0; i < this.config.warmUpRuns; i++) {
      await testFunction()
    }

    const executionTimes: number[] = []
    const memoryMeasurements: number[] = []
    const accuracyMeasurements: number[] = []

    // Benchmark runs
    for (let i = 0; i < this.config.benchmarkRuns; i++) {
      // Measure memory before
      const memoryBefore = this.config.memoryTrackingEnabled ? this.getMemoryUsage() : 0

      // Execute and time the operation
      const startTime = performance.now()
      const result = await testFunction()
      const endTime = performance.now()

      const executionTime = endTime - startTime
      executionTimes.push(executionTime)

      // Measure memory after
      if (this.config.memoryTrackingEnabled) {
        const memoryAfter = this.getMemoryUsage()
        memoryMeasurements.push(memoryAfter - memoryBefore)
      }

      // Extract accuracy if possible
      if (this.config.accuracyTrackingEnabled && extractMetrics) {
        const metrics = extractMetrics(result)
        if (metrics.accuracy !== undefined) {
          accuracyMeasurements.push(metrics.accuracy)
        }
        if (metrics.memory !== undefined) {
          memoryMeasurements.push(metrics.memory)
        }
      }

      // Prevent memory buildup between runs
      if (typeof global !== "undefined" && global.gc) {
        global.gc()
      }
    }

    const performanceMetrics = this.calculateMetrics(
      operation,
      system,
      executionTimes,
      memoryMeasurements,
      accuracyMeasurements,
    )

    this.results.push(performanceMetrics)
    this.logMetrics(performanceMetrics)

    return performanceMetrics
  }

  private calculateMetrics(
    operation: string,
    system: "unified" | "legacy",
    executionTimes: number[],
    memoryMeasurements: number[],
    accuracyMeasurements: number[],
  ): PerformanceMetrics {
    const sortedTimes = [...executionTimes].sort((a, b) => a - b)
    const averageTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
    const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)]
    const minTime = Math.min(...executionTimes)
    const maxTime = Math.max(...executionTimes)

    // Calculate standard deviation
    const variance = executionTimes.reduce((sum, time) => sum + (time - averageTime) ** 2, 0) / executionTimes.length
    const standardDeviation = Math.sqrt(variance)

    // Memory metrics
    let memoryUsage: PerformanceMetrics["memoryUsage"]
    if (memoryMeasurements.length > 0) {
      memoryUsage = {
        peak: Math.max(...memoryMeasurements),
        average: memoryMeasurements.reduce((sum, mem) => sum + mem, 0) / memoryMeasurements.length,
        delta: Math.max(...memoryMeasurements) - Math.min(...memoryMeasurements),
      }
    }

    // Accuracy metrics
    const accuracy =
      accuracyMeasurements.length > 0
        ? accuracyMeasurements.reduce((sum, acc) => sum + acc, 0) / accuracyMeasurements.length
        : undefined

    return {
      operation,
      system,
      executionTimes,
      averageTime,
      medianTime,
      minTime,
      maxTime,
      standardDeviation,
      memoryUsage,
      accuracy,
      throughput: 1000 / averageTime, // operations per second
      timestamp: new Date().toISOString(),
    }
  }

  private getMemoryUsage(): number {
    // In browser environment, approximate memory usage
    if (typeof performance !== "undefined" && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }

    // In Node environment
    if (typeof process !== "undefined" && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024 // MB
    }

    return 0
  }

  private logMetrics(metrics: PerformanceMetrics): void {
    console.log(`✅ ${metrics.operation} (${metrics.system}):`)
    console.log(`   Average: ${metrics.averageTime.toFixed(2)}ms`)
    console.log(`   Median:  ${metrics.medianTime.toFixed(2)}ms`)
    console.log(`   Range:   ${metrics.minTime.toFixed(2)}-${metrics.maxTime.toFixed(2)}ms`)
    console.log(`   StdDev:  ${metrics.standardDeviation.toFixed(2)}ms`)
    console.log(`   Throughput: ${metrics.throughput.toFixed(2)} ops/sec`)

    if (metrics.memoryUsage) {
      console.log(
        `   Memory:  ${metrics.memoryUsage.average.toFixed(1)}MB avg, ${metrics.memoryUsage.peak.toFixed(1)}MB peak`,
      )
    }

    if (metrics.accuracy) {
      console.log(`   Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`)
    }
    console.log("")
  }

  compareResults(
    unifiedMetrics: PerformanceMetrics,
    legacyMetrics: PerformanceMetrics,
    thresholds: {
      minimumSpeedImprovement: number
      minimumMemoryImprovement: number
      minimumAccuracyImprovement: number
    } = {
      minimumSpeedImprovement: 0.15, // 15%
      minimumMemoryImprovement: 0.2, // 20%
      minimumAccuracyImprovement: 0.05, // 5%
    },
  ): ComparisonReport {
    // Calculate improvements (positive = unified better)
    const speedImprovement = (legacyMetrics.averageTime - unifiedMetrics.averageTime) / legacyMetrics.averageTime

    const memoryImprovement =
      unifiedMetrics.memoryUsage && legacyMetrics.memoryUsage
        ? (legacyMetrics.memoryUsage.average - unifiedMetrics.memoryUsage.average) / legacyMetrics.memoryUsage.average
        : 0

    const accuracyImprovement =
      unifiedMetrics.accuracy && legacyMetrics.accuracy
        ? (unifiedMetrics.accuracy - legacyMetrics.accuracy) / legacyMetrics.accuracy
        : 0

    const throughputImprovement = (unifiedMetrics.throughput - legacyMetrics.throughput) / legacyMetrics.throughput

    // Calculate statistical significance using Welch's t-test approximation
    const { significant, pValue } = this.calculateSignificance(
      unifiedMetrics.executionTimes,
      legacyMetrics.executionTimes,
    )

    const passed =
      speedImprovement >= thresholds.minimumSpeedImprovement &&
      memoryImprovement >= thresholds.minimumMemoryImprovement &&
      (accuracyImprovement >= thresholds.minimumAccuracyImprovement || accuracyImprovement >= 0)

    return {
      operation: unifiedMetrics.operation,
      unified: unifiedMetrics,
      legacy: legacyMetrics,
      improvements: {
        speed: speedImprovement * 100,
        memory: memoryImprovement * 100,
        accuracy: accuracyImprovement * 100,
        throughput: throughputImprovement * 100,
      },
      statisticalSignificance: {
        speedSignificant: significant,
        pValue,
        confidenceLevel: 95,
      },
      passed,
      thresholds: {
        minimumSpeedImprovement: thresholds.minimumSpeedImprovement * 100,
        minimumMemoryImprovement: thresholds.minimumMemoryImprovement * 100,
        minimumAccuracyImprovement: thresholds.minimumAccuracyImprovement * 100,
      },
    }
  }

  private calculateSignificance(sample1: number[], sample2: number[]): { significant: boolean; pValue: number } {
    const mean1 = sample1.reduce((sum, val) => sum + val, 0) / sample1.length
    const mean2 = sample2.reduce((sum, val) => sum + val, 0) / sample2.length

    const variance1 = sample1.reduce((sum, val) => sum + (val - mean1) ** 2, 0) / (sample1.length - 1)
    const variance2 = sample2.reduce((sum, val) => sum + (val - mean2) ** 2, 0) / (sample2.length - 1)

    const standardError = Math.sqrt(variance1 / sample1.length + variance2 / sample2.length)
    const tStatistic = Math.abs(mean1 - mean2) / standardError

    // Simplified p-value calculation (approximate)
    const degreesOfFreedom = sample1.length + sample2.length - 2
    const pValue = tStatistic > 2.0 ? 0.01 : tStatistic > 1.5 ? 0.05 : 0.1 // Rough approximation

    return {
      significant: pValue < 0.05,
      pValue,
    }
  }

  generateReport(): string {
    const report = ["📊 Performance Benchmark Report", "═".repeat(50), ""]

    // Group results by operation
    const operationGroups = new Map<string, PerformanceMetrics[]>()

    this.results.forEach((result) => {
      const operation = result.operation
      if (!operationGroups.has(operation)) {
        operationGroups.set(operation, [])
      }
      operationGroups.get(operation)!.push(result)
    })

    operationGroups.forEach((metrics, operation) => {
      report.push(`🔍 ${operation}`)
      report.push("-".repeat(30))

      const unified = metrics.find((m) => m.system === "unified")
      const legacy = metrics.find((m) => m.system === "legacy")

      if (unified && legacy) {
        const comparison = this.compareResults(unified, legacy)

        report.push(
          `Speed Improvement: ${comparison.improvements.speed.toFixed(1)}% ${comparison.improvements.speed > 0 ? "✅" : "❌"}`,
        )
        report.push(
          `Memory Improvement: ${comparison.improvements.memory.toFixed(1)}% ${comparison.improvements.memory > 0 ? "✅" : "❌"}`,
        )
        report.push(
          `Accuracy Improvement: ${comparison.improvements.accuracy.toFixed(1)}% ${comparison.improvements.accuracy >= 0 ? "✅" : "❌"}`,
        )
        report.push(
          `Statistical Significance: ${comparison.statisticalSignificance.speedSignificant ? "✅" : "❌"} (p=${comparison.statisticalSignificance.pValue.toFixed(3)})`,
        )
        report.push(`Overall: ${comparison.passed ? "✅ PASSED" : "❌ FAILED"}`)
      } else {
        metrics.forEach((metric) => {
          report.push(
            `${metric.system}: ${metric.averageTime.toFixed(2)}ms avg, ${metric.throughput.toFixed(2)} ops/sec`,
          )
        })
      }

      report.push("")
    })

    // Summary statistics
    const allUnified = this.results.filter((r) => r.system === "unified")
    const allLegacy = this.results.filter((r) => r.system === "legacy")

    if (allUnified.length > 0 && allLegacy.length > 0) {
      const avgUnifiedTime = allUnified.reduce((sum, r) => sum + r.averageTime, 0) / allUnified.length
      const avgLegacyTime = allLegacy.reduce((sum, r) => sum + r.averageTime, 0) / allLegacy.length
      const overallImprovement = ((avgLegacyTime - avgUnifiedTime) / avgLegacyTime) * 100

      report.push("📈 Overall Summary")
      report.push("-".repeat(20))
      report.push(`Average Unified Performance: ${avgUnifiedTime.toFixed(2)}ms`)
      report.push(`Average Legacy Performance: ${avgLegacyTime.toFixed(2)}ms`)
      report.push(`Overall Speed Improvement: ${overallImprovement.toFixed(1)}%`)
      report.push("")
    }

    report.push(`Generated: ${new Date().toISOString()}`)

    return report.join("\n")
  }

  clearResults(): void {
    this.results = []
  }

  getResults(): PerformanceMetrics[] {
    return [...this.results]
  }
}

// Specialized audio benchmarking utilities
export class AudioBenchmarkSuite {
  private benchmarker: PerformanceBenchmarker

  constructor(config?: Partial<BenchmarkConfig>) {
    this.benchmarker = new PerformanceBenchmarker(config)
  }

  async benchmarkUnifiedVsLegacy(
    testCases: Array<{
      name: string
      audioPath: string
      config: any
    }>,
    mockInvoke: (command: string, args?: any) => Promise<any>,
  ): Promise<ComparisonReport[]> {
    const comparisons: ComparisonReport[] = []

    for (const testCase of testCases) {
      console.log(`\n🎵 Testing: ${testCase.name}`)

      // Benchmark unified system
      const unifiedMetrics = await this.benchmarker.runBenchmark(
        testCase.name,
        "unified",
        () =>
          mockInvoke("unified_audio_analyze_comprehensive", {
            videoPath: testCase.audioPath,
            config: testCase.config,
          }),
        (result: any) => ({
          memory: result.memory_usage_mb,
          accuracy: result.unified_result?.overall_quality,
        }),
      )

      // Benchmark legacy system
      const legacyMetrics = await this.benchmarker.runBenchmark(
        testCase.name,
        "legacy",
        () =>
          mockInvoke("legacy_audio_analyze_ffmpeg", {
            filePath: testCase.audioPath,
          }),
        (result: any) => ({
          memory: result.memory_usage_mb,
          accuracy: result.quality_assessment,
        }),
      )

      const comparison = this.benchmarker.compareResults(unifiedMetrics, legacyMetrics)
      comparisons.push(comparison)

      console.log(`📊 ${testCase.name} Results:`)
      console.log(`   Speed: ${comparison.improvements.speed.toFixed(1)}% improvement`)
      console.log(`   Memory: ${comparison.improvements.memory.toFixed(1)}% improvement`)
      console.log(`   Accuracy: ${comparison.improvements.accuracy.toFixed(1)}% improvement`)
    }

    return comparisons
  }

  generateDetailedReport(): string {
    return this.benchmarker.generateReport()
  }
}
