#!/usr/bin/env bun
/**
 * Скрипт для подсчета реального количества AI инструментов
 */

import type { BaseAITool } from "../src/domains/ai-tools/base/base-ai-tool"
import { AI_TOOLS_DOMAIN_STATS, allAITools } from "../src/domains/ai-tools/tools"

const stats = AI_TOOLS_DOMAIN_STATS

console.log("=== AI Tools Statistics ===")
console.log(`Core tools: ${stats.core}`)
console.log(`Analysis tools: ${stats.analysis}`)
console.log(`Automation tools: ${stats.automation}`)
console.log(`Integration tools: ${stats.integration}`)
console.log(`\nTotal: ${stats.total}`)
console.log(`\nReal count from array: ${allAITools.length}`)

console.log("\n=== Tool Names ===")
allAITools.forEach((tool: BaseAITool, index: number) => {
  console.log(`${index + 1}. ${tool.metadata.name} (${tool.metadata.domain}/${tool.metadata.category})`)
})
