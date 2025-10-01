#!/usr/bin/env node

/**
 * Automated Provider Migration Analysis Script
 *
 * This script analyzes all provider files in the codebase and determines their migration status
 * to the backend-centric system.
 */

import { execSync } from "child_process"
import * as fs from "fs"
import * as path from "path"

interface ProviderAnalysis {
  filePath: string
  providerName: string
  status: "integrated" | "partial" | "local" | "unknown"
  backendIntegration: {
    usesBackendSync: boolean
    usesAppActor: boolean
    usesOrchestrator: boolean
    usesLocalStateOnly: boolean
  }
  testCoverage: {
    hasTests: boolean
    testPath?: string
    hasIntegrationTests: boolean
  }
  recommendations: string[]
}

class ProviderAnalyzer {
  private providers: ProviderAnalysis[] = []
  private projectRoot = "/Users/aleksandrkireev/Apps/timeline-ai"

  constructor() {
    this.findProviders()
  }

  private findProviders(): void {
    try {
      // Find all provider files
      const result = execSync('find src -name "*provider*.tsx" -type f', {
        cwd: this.projectRoot,
        encoding: "utf-8",
      })

      const providerFiles = result.trim().split("\n").filter(Boolean)

      for (const file of providerFiles) {
        this.analyzeProvider(file)
      }
    } catch (error) {
      console.error("Error finding providers:", error)
    }
  }

  private analyzeProvider(filePath: string): void {
    const fullPath = path.join(this.projectRoot, filePath)

    try {
      const content = fs.readFileSync(fullPath, "utf-8")
      const providerName = path.basename(filePath, ".tsx")

      // Analyze backend integration
      const backendIntegration = {
        usesBackendSync: /getBackendSync|backendSync/.test(content),
        usesAppActor: /useApp\(\)|appActor|useActor/.test(content),
        usesOrchestrator: /orchestrator|Orchestrator/.test(content),
        usesLocalStateOnly: this.usesLocalStateOnly(content),
      }

      // Determine status
      const status = this.determineStatus(backendIntegration)

      // Check test coverage
      const testCoverage = this.analyzeTestCoverage(filePath)

      // Generate recommendations
      const recommendations = this.generateRecommendations(status, backendIntegration, testCoverage)

      this.providers.push({
        filePath,
        providerName,
        status,
        backendIntegration,
        testCoverage,
        recommendations,
      })
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error)
    }
  }

  private usesLocalStateOnly(content: string): boolean {
    // Check if provider only uses local React state without backend integration
    const hasUseState = /useState|useReducer/.test(content)
    const hasBackendIntegration = /getBackendSync|backendSync|useApp\(\)|appActor/.test(content)
    return hasUseState && !hasBackendIntegration
  }

  private determineStatus(backendIntegration: any): "integrated" | "partial" | "local" | "unknown" {
    if (backendIntegration.usesBackendSync) {
      return "integrated"
    }
    if (backendIntegration.usesAppActor || backendIntegration.usesOrchestrator) {
      return "partial"
    }
    if (backendIntegration.usesLocalStateOnly) {
      return "local"
    }
    return "unknown"
  }

  private analyzeTestCoverage(filePath: string): {
    hasTests: boolean
    testPath?: string
    hasIntegrationTests: boolean
  } {
    const dir = path.dirname(filePath)
    const testDir = path.join(dir, "__tests__")
    const testFileName = `${path.basename(filePath, ".tsx")}.test.tsx`
    const testFilePath = path.join(testDir, testFileName)
    const fullTestPath = path.join(this.projectRoot, testFilePath)

    let hasTests = false
    let hasIntegrationTests = false
    let testPath: string | undefined

    if (fs.existsSync(fullTestPath)) {
      hasTests = true
      testPath = testFilePath

      const testContent = fs.readFileSync(fullTestPath, "utf-8")
      hasIntegrationTests = /MockBackendProvider|renderWithAppState|integration.*test/.test(testContent)
    }

    return { hasTests, testPath, hasIntegrationTests }
  }

  private generateRecommendations(status: string, backendIntegration: any, testCoverage: any): string[] {
    const recommendations: string[] = []

    switch (status) {
      case "local":
        recommendations.push("Migrate to use getBackendSync() or useApp()")
        recommendations.push("Add integration tests with MockBackendProvider")
        break
      case "partial":
        if (!backendIntegration.usesBackendSync) {
          recommendations.push("Consider migrating from orchestrator to direct backend-sync usage")
        }
        recommendations.push("Add integration tests if not present")
        break
      case "integrated":
        if (!testCoverage.hasIntegrationTests) {
          recommendations.push("Add integration tests with MockBackendProvider")
        }
        break
      case "unknown":
        recommendations.push("Analyze provider architecture and determine migration path")
        break
    }

    if (!testCoverage.hasTests) {
      recommendations.unshift("Add unit tests")
    }

    return recommendations
  }

  public generateReport(): string {
    const integrated = this.providers.filter((p) => p.status === "integrated")
    const partial = this.providers.filter((p) => p.status === "partial")
    const local = this.providers.filter((p) => p.status === "local")
    const unknown = this.providers.filter((p) => p.status === "unknown")

    let report = `# Provider Migration Analysis Report

Generated: ${new Date().toISOString()}

## Summary Statistics

- **Total Providers**: ${this.providers.length}
- **Fully Integrated**: ${integrated.length} (${Math.round((integrated.length / this.providers.length) * 100)}%)
- **Partially Integrated**: ${partial.length} (${Math.round((partial.length / this.providers.length) * 100)}%)
- **Local Only**: ${local.length} (${Math.round((local.length / this.providers.length) * 100)}%)
- **Unknown Status**: ${unknown.length} (${Math.round((unknown.length / this.providers.length) * 100)}%)

## Detailed Analysis

`

    // Add detailed sections
    report += this.generateSection("✅ Fully Integrated Providers", integrated)
    report += this.generateSection("⚠️ Partially Integrated Providers", partial)
    report += this.generateSection("🔧 Local Only Providers (Need Migration)", local)
    report += this.generateSection("❓ Unknown Status", unknown)

    // Add CSV table for easy processing
    report += this.generateCSVTable()

    return report
  }

  private generateSection(title: string, providers: ProviderAnalysis[]): string {
    if (providers.length === 0) return ""

    let section = `## ${title}\n\n`

    for (const provider of providers) {
      section += `### ${provider.providerName}\n`
      section += `- **File**: \`${provider.filePath}\`\n`
      section += `- **Status**: ${provider.status}\n`
      section += "- **Backend Integration**:\n"
      section += `  - Uses BackendSync: ${provider.backendIntegration.usesBackendSync}\n`
      section += `  - Uses App Actor: ${provider.backendIntegration.usesAppActor}\n`
      section += `  - Uses Orchestrator: ${provider.backendIntegration.usesOrchestrator}\n`
      section += `  - Local State Only: ${provider.backendIntegration.usesLocalStateOnly}\n`
      section += "- **Test Coverage**:\n"
      section += `  - Has Tests: ${provider.testCoverage.hasTests}\n`
      section += `  - Has Integration Tests: ${provider.testCoverage.hasIntegrationTests}\n`
      if (provider.testCoverage.testPath) {
        section += `  - Test File: \`${provider.testCoverage.testPath}\`\n`
      }

      if (provider.recommendations.length > 0) {
        section += "- **Recommendations**:\n"
        for (const rec of provider.recommendations) {
          section += `  - ${rec}\n`
        }
      }
      section += "\n"
    }

    return section
  }

  private generateCSVTable(): string {
    let csv = "## CSV Summary Table\n\n"
    csv += "```csv\n"
    csv +=
      "Provider Name,File Path,Status,Uses BackendSync,Uses App Actor,Uses Orchestrator,Local State Only,Has Tests,Has Integration Tests,Recommendations\n"

    for (const provider of this.providers) {
      csv += `${provider.providerName},${provider.filePath},${provider.status},`
      csv += `${provider.backendIntegration.usesBackendSync},${provider.backendIntegration.usesAppActor},`
      csv += `${provider.backendIntegration.usesOrchestrator},${provider.backendIntegration.usesLocalStateOnly},`
      csv += `${provider.testCoverage.hasTests},${provider.testCoverage.hasIntegrationTests},"${provider.recommendations.join("; ")}"\n`
    }

    csv += "```\n"
    return csv
  }

  public saveReport(): void {
    const report = this.generateReport()
    const reportPath = path.join(this.projectRoot, "docs", "provider-migration-analysis.md")
    fs.writeFileSync(reportPath, report)
    console.log(`✅ Provider migration analysis saved to: ${reportPath}`)
  }
}

// Run the analysis
const analyzer = new ProviderAnalyzer()
analyzer.saveReport()

export { ProviderAnalyzer }
