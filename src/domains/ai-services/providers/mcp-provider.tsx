/**
 * MCP Provider
 *
 * Провайдер для инициализации и управления MCP (Model Context Protocol) сервером
 */

"use client"

import { type ReactNode, useEffect, useState } from "react"

import { type MCPConfig, mcpCheckApi, mcpInitialize } from "@/domains/ai-services/tauri/chat-commands"
import { useApiKeys } from "@/domains/project-management/hooks"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "MCPProvider" })

interface MCPProviderProps {
  children: ReactNode
}

/**
 * MCP Provider
 *
 * Автоматически инициализирует MCP сервер для локальных операций (анализ видео, timeline команды).
 * MCP Server нужен независимо от наличия API ключа - он используется для выполнения
 * локальных MCP инструментов через AI Chat.
 */
export function MCPProvider({ children }: MCPProviderProps) {
  const { getApiKeyInfo } = useApiKeys()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initializeMCP = async () => {
      try {
        logger.info("Initializing MCP server for local operations...")

        // Инициализируем MCP с конфигурацией по умолчанию
        // MCP Server нужен для локальных операций независимо от API ключа
        const config: MCPConfig = {
          enabled: true,
          claude_api_key: null, // Ключ уже в SecureStorage, не передаем его напрямую
          model: "claude-3-5-sonnet-20241022", // Последняя модель Claude 3.5 Sonnet
          max_tokens: 4096,
          temperature: 0.7,
        }

        const result = await mcpInitialize(config)

        if (result) {
          logger.info("MCP server initialized successfully")
          setInitialized(true)

          // Проверяем подключение к Claude API только если есть ключ
          const mcpClaudeInfo = getApiKeyInfo("mcp_claude")
          const claudeInfo = getApiKeyInfo("claude")

          if (mcpClaudeInfo?.has_value || claudeInfo?.has_value) {
            try {
              const apiStatus = await mcpCheckApi()
              if (apiStatus) {
                logger.info("MCP Claude API connectivity verified")
              } else {
                logger.warn("MCP Claude API connectivity check failed (API key may be invalid)")
              }
            } catch (error) {
              logger.warn("MCP API check skipped - no valid API key configured", { error })
            }
          } else {
            logger.info("MCP initialized without API key - local tools available, Claude API disabled")
          }
        } else {
          logger.warn("MCP initialization returned false")
        }
      } catch (error) {
        logger.error("Failed to initialize MCP", { error })
      }
    }

    // Инициализируем MCP только один раз
    if (!initialized) {
      void initializeMCP()
    }
  }, [getApiKeyInfo, initialized])

  // Провайдер не предоставляет контекст, только выполняет инициализацию
  return <>{children}</>
}
