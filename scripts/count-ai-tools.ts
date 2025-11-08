#!/usr/bin/env bun
/**
 * Скрипт для подсчета реального количества AI инструментов
 */

import { AIToolsV2Utils } from "../src/features/ai-chat/tools"

const stats = AIToolsV2Utils.getStats()
const allTools = AIToolsV2Utils.getAllTools()

console.log("=== AI Tools Statistics ===")
console.log(`Core tools: ${stats.core}`)
console.log(`Analysis tools: ${stats.analysis}`)
console.log(`Automation tools: ${stats.automation}`)
console.log(`Integration tools: ${stats.integration}`)
console.log(`\nTotal: ${stats.total}`)
console.log(`\nReal count from array: ${allTools.length}`)

console.log("\n=== Tool Names ===")
allTools.forEach((tool, index) => {
  console.log(`${index + 1}. ${tool.metadata.name} (${tool.metadata.domain}/${tool.metadata.category})`)
})
