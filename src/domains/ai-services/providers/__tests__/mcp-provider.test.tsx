/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для MCP Provider
 */

import { render, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MCPProvider } from "../mcp-provider"

// Mock Tauri commands
const mockMcpInitialize = vi.fn()
const mockMcpCheckApi = vi.fn()

vi.mock("@/domains/ai-services/tauri/chat-commands", () => ({
  mcpInitialize: (config: any) => mockMcpInitialize(config),
  mcpCheckApi: () => mockMcpCheckApi(),
}))

// Mock useApiKeys
const mockGetApiKeyInfo = vi.fn()

vi.mock("@/domains/project-management/hooks", () => ({
  useApiKeys: () => ({
    getApiKeyInfo: mockGetApiKeyInfo,
  }),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tauri-logger")>()
  return {
    ...actual,
    createLogger: () => ({
      info: vi.fn(),
      infoSync: vi.fn(),
      warn: vi.fn(),
      warnSync: vi.fn(),
      error: vi.fn(),
      errorSync: vi.fn(),
      debug: vi.fn(),
      debugSync: vi.fn(),
      trace: vi.fn(),
      traceSync: vi.fn(),
    }),
  }
})

describe("MCPProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен отрендерить children", () => {
    mockGetApiKeyInfo.mockReturnValue({ has_value: false })

    const { getByText } = render(
      <MCPProvider data-oid=":bqas02">
        <div data-oid="vo:h:wb">Test Content</div>
      </MCPProvider>,
    )

    expect(getByText("Test Content")).toBeInTheDocument()
  })

  it("должен инициализировать MCP даже без API ключа (для локальных инструментов)", async () => {
    mockGetApiKeyInfo.mockReturnValue({ has_value: false })
    mockMcpInitialize.mockResolvedValue(true)

    render(
      <MCPProvider data-oid="o:u0edx">
        <div data-oid="7ntyb4t">Test</div>
      </MCPProvider>,
    )

    // MCP инициализируется всегда для локальных инструментов
    await waitFor(() => {
      expect(mockMcpInitialize).toHaveBeenCalledWith({
        enabled: true,
        claude_api_key: null,
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        temperature: 0.7,
      })
    })

    // Но проверка API не должна выполняться без ключа
    expect(mockMcpCheckApi).not.toHaveBeenCalled()
  })

  it("должен инициализировать MCP если есть API ключ", async () => {
    mockGetApiKeyInfo.mockReturnValue({ has_value: true })
    mockMcpInitialize.mockResolvedValue(true)
    mockMcpCheckApi.mockResolvedValue(true)

    render(
      <MCPProvider data-oid="kw45j9p">
        <div data-oid="o-n6vi8">Test</div>
      </MCPProvider>,
    )

    await waitFor(() => {
      expect(mockMcpInitialize).toHaveBeenCalledWith({
        enabled: true,
        claude_api_key: null,
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        temperature: 0.7,
      })
    })
  })

  it("должен проверить подключение к API после инициализации", async () => {
    // Мокаем проверку для обоих ключей
    mockGetApiKeyInfo.mockImplementation((keyName: string) => {
      if (keyName === "mcp_claude" || keyName === "claude") {
        return { has_value: true }
      }
      return { has_value: false }
    })
    mockMcpInitialize.mockResolvedValue(true)
    mockMcpCheckApi.mockResolvedValue(true)

    render(
      <MCPProvider data-oid="2_tdo0y">
        <div data-oid="264x21j">Test</div>
      </MCPProvider>,
    )

    await waitFor(() => {
      expect(mockMcpCheckApi).toHaveBeenCalled()
    })
  })

  it("не должен падать если инициализация вернула false", async () => {
    mockGetApiKeyInfo.mockReturnValue({ has_value: true })
    mockMcpInitialize.mockResolvedValue(false)

    const { getByText } = render(
      <MCPProvider data-oid="83d12vt">
        <div data-oid="bkv.0ar">Test</div>
      </MCPProvider>,
    )

    await waitFor(() => {
      expect(mockMcpInitialize).toHaveBeenCalled()
    })

    expect(getByText("Test")).toBeInTheDocument()
    expect(mockMcpCheckApi).not.toHaveBeenCalled()
  })

  it("не должен падать если проверка API не удалась", async () => {
    // Мокаем проверку для обоих ключей
    mockGetApiKeyInfo.mockImplementation((keyName: string) => {
      if (keyName === "mcp_claude" || keyName === "claude") {
        return { has_value: true }
      }
      return { has_value: false }
    })
    mockMcpInitialize.mockResolvedValue(true)
    mockMcpCheckApi.mockResolvedValue(false)

    const { getByText } = render(
      <MCPProvider data-oid="od9wb28">
        <div data-oid="rap2u0c">Test</div>
      </MCPProvider>,
    )

    await waitFor(() => {
      expect(mockMcpCheckApi).toHaveBeenCalled()
    })

    expect(getByText("Test")).toBeInTheDocument()
  })

  it("не должен падать при ошибке инициализации", async () => {
    mockGetApiKeyInfo.mockReturnValue({ has_value: true })
    mockMcpInitialize.mockRejectedValue(new Error("Initialization failed"))

    const { getByText } = render(
      <MCPProvider data-oid="s56-q3g">
        <div data-oid="pg_8bld">Test</div>
      </MCPProvider>,
    )

    await waitFor(() => {
      expect(mockMcpInitialize).toHaveBeenCalled()
    })

    expect(getByText("Test")).toBeInTheDocument()
  })

  it("не должен падать при ошибке проверки API", async () => {
    // Мокаем проверку для обоих ключей
    mockGetApiKeyInfo.mockImplementation((keyName: string) => {
      if (keyName === "mcp_claude" || keyName === "claude") {
        return { has_value: true }
      }
      return { has_value: false }
    })
    mockMcpInitialize.mockResolvedValue(true)
    mockMcpCheckApi.mockRejectedValue(new Error("API check failed"))

    const { getByText } = render(
      <MCPProvider data-oid="bqy_mxm">
        <div data-oid="vxn21zj">Test</div>
      </MCPProvider>,
    )

    await waitFor(() => {
      expect(mockMcpCheckApi).toHaveBeenCalled()
    })

    expect(getByText("Test")).toBeInTheDocument()
  })

  it("должен инициализировать MCP только один раз", async () => {
    mockGetApiKeyInfo.mockReturnValue({ has_value: true })
    mockMcpInitialize.mockResolvedValue(true)
    mockMcpCheckApi.mockResolvedValue(true)

    const { rerender } = render(
      <MCPProvider data-oid=":1l2krb">
        <div data-oid="v0jj17f">Test</div>
      </MCPProvider>,
    )

    await waitFor(() => {
      expect(mockMcpInitialize).toHaveBeenCalledTimes(1)
    })

    // Перерендерим компонент
    rerender(
      <MCPProvider data-oid="nbsdtfi">
        <div data-oid="qxk_ide">Test Updated</div>
      </MCPProvider>,
    )

    await waitFor(() => {
      // Не должно быть повторной инициализации
      expect(mockMcpInitialize).toHaveBeenCalledTimes(1)
    })
  })

  it("должен использовать правильную модель Claude", async () => {
    mockGetApiKeyInfo.mockReturnValue({ has_value: true })
    mockMcpInitialize.mockResolvedValue(true)

    render(
      <MCPProvider data-oid="b9w731h">
        <div data-oid="m2xo.:x">Test</div>
      </MCPProvider>,
    )

    await waitFor(() => {
      expect(mockMcpInitialize).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-3-5-sonnet-20241022",
        }),
      )
    })
  })

  it("должен использовать правильные параметры по умолчанию", async () => {
    mockGetApiKeyInfo.mockReturnValue({ has_value: true })
    mockMcpInitialize.mockResolvedValue(true)

    render(
      <MCPProvider data-oid="z157gjf">
        <div data-oid="zbwji80">Test</div>
      </MCPProvider>,
    )

    await waitFor(() => {
      expect(mockMcpInitialize).toHaveBeenCalledWith({
        enabled: true,
        claude_api_key: null,
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        temperature: 0.7,
      })
    })
  })
})
