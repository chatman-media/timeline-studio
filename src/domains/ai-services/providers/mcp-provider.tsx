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
 * Автоматически инициализирует MCP сервер при наличии API ключа Claude в настройках
 */
export function MCPProvider({ children }: MCPProviderProps) {
  const { getApiKeyInfo } = useApiKeys()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initializeMCP = async () => {
      try {
        // Проверяем наличие API ключа для MCP
        const mcpClaudeInfo = getApiKeyInfo("mcp_claude")

        if (!mcpClaudeInfo?.has_value) {
          logger.info("MCP Claude API key not configured, skipping initialization")
          return
        }

        logger.info("Initializing MCP server...")

        // Инициализируем MCP с конфигурацией по умолчанию
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

          // Проверяем подключение к Claude API
          try {
            const apiStatus = await mcpCheckApi()
            if (apiStatus) {
              logger.info("MCP Claude API connectivity verified")
            } else {
              logger.warn("MCP Claude API connectivity check failed")
            }
          } catch (error) {
            logger.error("Failed to check MCP API connectivity", { error })
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
