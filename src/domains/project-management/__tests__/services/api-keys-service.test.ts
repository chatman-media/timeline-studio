/**
 * API Keys Service Tests
 *
 * Тесты для ApiKeysService
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  API_KEY_MASKS,
  API_KEY_MIN_LENGTH,
  API_KEY_PATTERNS,
  ApiKeysService,
  VALIDATION_ERROR_MESSAGES,
} from "../../services/api-keys-service"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

// Mock Tauri commands
const mockListApiKeys = vi.fn()
const mockSaveSimpleApiKey = vi.fn()
const mockValidateApiKey = vi.fn()
const mockSaveOAuthCredentials = vi.fn()
const mockGenerateOAuthUrl = vi.fn()
const mockExchangeOAuthCode = vi.fn()
const mockDeleteApiKey = vi.fn()
const mockImportFromEnv = vi.fn()
const mockExportToEnvFormat = vi.fn()
const mockRefreshOAuthToken = vi.fn()
const mockGetOAuthUserInfo = vi.fn()
const mockParseOAuthCallbackUrl = vi.fn()

vi.mock("@/domains/project-management/tauri/api-keys-commands", () => ({
  listApiKeys: () => mockListApiKeys(),
  saveSimpleApiKey: (params: any) => mockSaveSimpleApiKey(params),
  validateApiKey: (service: string) => mockValidateApiKey(service),
  saveOAuthCredentials: (params: any) => mockSaveOAuthCredentials(params),
  generateOAuthUrl: (service: string, clientId: string, state?: string) =>
    mockGenerateOAuthUrl(service, clientId, state),
  exchangeOAuthCode: (service: string, clientId: string, clientSecret: string, code: string) =>
    mockExchangeOAuthCode(service, clientId, clientSecret, code),
  deleteApiKey: (service: string) => mockDeleteApiKey(service),
  importFromEnv: (envFilePath?: string) => mockImportFromEnv(envFilePath),
  exportToEnvFormat: () => mockExportToEnvFormat(),
  refreshOAuthToken: (service: string) => mockRefreshOAuthToken(service),
  getOAuthUserInfo: (service: string) => mockGetOAuthUserInfo(service),
  parseOAuthCallbackUrl: (url: string) => mockParseOAuthCallbackUrl(url),
}))

describe("ApiKeysService", () => {
  let service: ApiKeysService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ApiKeysService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("listApiKeys", () => {
    it("should return list of API keys", async () => {
      const mockKeys = [
        { key_type: "openai", has_value: true, is_valid: true },
        { key_type: "claude", has_value: true, is_valid: false },
      ]
      mockListApiKeys.mockResolvedValueOnce(mockKeys)

      const result = await service.listApiKeys()

      expect(result).toEqual(mockKeys)
      expect(mockListApiKeys).toHaveBeenCalledTimes(1)
    })

    it("should handle errors", async () => {
      mockListApiKeys.mockRejectedValueOnce(new Error("Failed to list keys"))

      await expect(service.listApiKeys()).rejects.toThrow("Failed to list keys")
    })
  })

  describe("saveSimpleApiKey", () => {
    it("should validate key format before saving", async () => {
      const validKey = "sk-1234567890123456789012345678901234567890"
      mockSaveSimpleApiKey.mockResolvedValueOnce({ success: true, message: "Saved" })

      const result = await service.saveSimpleApiKey("openai", validKey)

      expect(result.success).toBe(true)
      expect(mockSaveSimpleApiKey).toHaveBeenCalledWith({
        key_type: "openai",
        value: validKey,
      })
    })

    it("should reject invalid key format", async () => {
      const invalidKey = "invalid-key"

      const result = await service.saveSimpleApiKey("openai", invalidKey)

      expect(result.success).toBe(false)
      expect(result.message).toBe(VALIDATION_ERROR_MESSAGES.openai)
      expect(mockSaveSimpleApiKey).not.toHaveBeenCalled()
    })

    it("should allow empty keys", async () => {
      mockSaveSimpleApiKey.mockResolvedValueOnce({ success: true, message: "Saved" })

      const result = await service.saveSimpleApiKey("openai", "")

      expect(result.success).toBe(true)
    })

    it("should handle backend errors", async () => {
      const validKey = "sk-1234567890123456789012345678901234567890"
      mockSaveSimpleApiKey.mockResolvedValueOnce({ success: false, message: "Backend error" })

      const result = await service.saveSimpleApiKey("openai", validKey)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Backend error")
    })

    it("should validate different service keys", async () => {
      mockSaveSimpleApiKey.mockResolvedValue({ success: true, message: "Saved" })

      // Valid keys for different services
      await service.saveSimpleApiKey("openai", "sk-1234567890123456789012345678901234567890")
      await service.saveSimpleApiKey("grok", "xai-12345678901234567890123456789012")
      await service.saveSimpleApiKey("gemini", "AIza1234567890123456789012345678901234567")

      expect(mockSaveSimpleApiKey).toHaveBeenCalledTimes(3)
    })
  })

  describe("validateApiKey", () => {
    it("should validate API key", async () => {
      mockValidateApiKey.mockResolvedValueOnce({ is_valid: true, error_message: null })

      const result = await service.validateApiKey("openai")

      expect(result.is_valid).toBe(true)
      expect(mockValidateApiKey).toHaveBeenCalledWith("openai")
    })

    it("should handle validation failures", async () => {
      mockValidateApiKey.mockResolvedValueOnce({
        is_valid: false,
        error_message: "Invalid API key",
      })

      const result = await service.validateApiKey("openai")

      expect(result.is_valid).toBe(false)
      expect(result.error_message).toBe("Invalid API key")
    })

    it("should handle errors", async () => {
      mockValidateApiKey.mockRejectedValueOnce(new Error("Validation failed"))

      await expect(service.validateApiKey("openai")).rejects.toThrow("Validation failed")
    })
  })

  describe("OAuth operations", () => {
    describe("saveOAuthCredentials", () => {
      it("should save OAuth credentials", async () => {
        mockSaveOAuthCredentials.mockResolvedValueOnce({ success: true, message: "Saved" })

        const result = await service.saveOAuthCredentials("youtube", "client-id", "client-secret", "access-token")

        expect(result.success).toBe(true)
        expect(mockSaveOAuthCredentials).toHaveBeenCalledWith({
          key_type: "youtube",
          client_id: "client-id",
          client_secret: "client-secret",
          access_token: "access-token",
          refresh_token: undefined,
        })
      })

      it("should handle refresh token", async () => {
        mockSaveOAuthCredentials.mockResolvedValueOnce({ success: true, message: "Saved" })

        await service.saveOAuthCredentials("youtube", "client-id", "client-secret", "access", "refresh")

        expect(mockSaveOAuthCredentials).toHaveBeenCalledWith({
          key_type: "youtube",
          client_id: "client-id",
          client_secret: "client-secret",
          access_token: "access",
          refresh_token: "refresh",
        })
      })
    })

    describe("generateOAuthUrl", () => {
      it("should generate OAuth URL", async () => {
        mockGenerateOAuthUrl.mockResolvedValueOnce("https://oauth.example.com/authorize")

        const url = await service.generateOAuthUrl("youtube", "client-id")

        expect(url).toBe("https://oauth.example.com/authorize")
        expect(mockGenerateOAuthUrl).toHaveBeenCalledWith("youtube", "client-id", undefined)
      })

      it("should include state parameter", async () => {
        mockGenerateOAuthUrl.mockResolvedValueOnce("https://oauth.example.com/authorize?state=abc")

        await service.generateOAuthUrl("youtube", "client-id", "abc")

        expect(mockGenerateOAuthUrl).toHaveBeenCalledWith("youtube", "client-id", "abc")
      })
    })

    describe("exchangeOAuthCode", () => {
      it("should exchange code for token", async () => {
        mockExchangeOAuthCode.mockResolvedValueOnce({ success: true, message: "Token obtained" })

        const result = await service.exchangeOAuthCode("youtube", "client-id", "client-secret", "auth-code")

        expect(result.success).toBe(true)
        expect(mockExchangeOAuthCode).toHaveBeenCalledWith("youtube", "client-id", "client-secret", "auth-code")
      })
    })

    describe("refreshOAuthToken", () => {
      it("should refresh OAuth token", async () => {
        mockRefreshOAuthToken.mockResolvedValueOnce({ success: true, message: "Token refreshed" })

        const result = await service.refreshOAuthToken("youtube")

        expect(result.success).toBe(true)
        expect(mockRefreshOAuthToken).toHaveBeenCalledWith("youtube")
      })
    })
  })

  describe("deleteApiKey", () => {
    it("should delete API key", async () => {
      mockDeleteApiKey.mockResolvedValueOnce({ success: true, message: "Deleted" })

      const result = await service.deleteApiKey("openai")

      expect(result.success).toBe(true)
      expect(mockDeleteApiKey).toHaveBeenCalledWith("openai")
    })
  })

  describe("import/export", () => {
    describe("importFromEnv", () => {
      it("should import from .env file", async () => {
        mockImportFromEnv.mockResolvedValueOnce({ success: true, message: "Imported" })

        const result = await service.importFromEnv("/path/to/.env")

        expect(result.success).toBe(true)
        expect(mockImportFromEnv).toHaveBeenCalledWith("/path/to/.env")
      })

      it("should import from default location", async () => {
        mockImportFromEnv.mockResolvedValueOnce({ success: true, message: "Imported" })

        await service.importFromEnv()

        expect(mockImportFromEnv).toHaveBeenCalledWith(undefined)
      })
    })

    describe("exportToEnvFormat", () => {
      it("should export to .env format", async () => {
        const envContent = "OPENAI_API_KEY=sk-xxx\nCLAUDE_API_KEY=sk-ant-xxx"
        mockExportToEnvFormat.mockResolvedValueOnce(envContent)

        const result = await service.exportToEnvFormat()

        expect(result).toBe(envContent)
      })
    })
  })

  describe("validateKeyFormat", () => {
    it("should validate OpenAI key format", () => {
      expect(service.validateKeyFormat("openai", "sk-1234567890123456789012345678901234567890")).toBe(true)
      expect(service.validateKeyFormat("openai", "invalid")).toBe(false)
      expect(service.validateKeyFormat("openai", "")).toBe(false)
    })

    it("should validate Claude key format", () => {
      const validKey = `sk-ant-api03-${"a".repeat(95)}`
      expect(service.validateKeyFormat("claude", validKey)).toBe(true)
      expect(service.validateKeyFormat("claude", "sk-ant-api03-short")).toBe(false)
    })

    it("should validate Grok key format", () => {
      expect(service.validateKeyFormat("grok", "xai-12345678901234567890123456789012")).toBe(true)
      expect(service.validateKeyFormat("grok", "xai-short")).toBe(false)
    })

    it("should check minimum length", () => {
      const shortKey = "sk-123"
      expect(service.validateKeyFormat("openai", shortKey)).toBe(false)
    })
  })

  describe("maskApiKey", () => {
    it("should mask API key correctly", () => {
      const key = "sk-1234567890abcdef1234567890abcdef12345678"
      const masked = service.maskApiKey("openai", key)

      expect(masked).toContain("sk-1234")
      expect(masked).toContain("5678")
      expect(masked).toContain("•")
    })

    it("should handle short keys", () => {
      const key = "sk-123"
      const masked = service.maskApiKey("openai", key)

      expect(masked.length).toBeGreaterThan(0)
    })

    it("should return empty string for empty key", () => {
      expect(service.maskApiKey("openai", "")).toBe("")
    })
  })

  describe("isOAuthService", () => {
    it("should identify OAuth services", () => {
      expect(service.isOAuthService("youtube")).toBe(true)
      expect(service.isOAuthService("vimeo")).toBe(true)
      expect(service.isOAuthService("tiktok")).toBe(true)
    })

    it("should identify non-OAuth services", () => {
      expect(service.isOAuthService("openai")).toBe(false)
      expect(service.isOAuthService("claude")).toBe(false)
      expect(service.isOAuthService("grok")).toBe(false)
    })
  })

  describe("getKeyStatus", () => {
    it("should return testing status when loading", () => {
      const status = service.getKeyStatus(null, true)
      expect(status).toBe("testing")
    })

    it("should return not_set when no key info", () => {
      const status = service.getKeyStatus(null, false)
      expect(status).toBe("not_set")
    })

    it("should return valid when key is valid", () => {
      const keyInfo = { key_type: "openai", has_value: true, is_oauth: false, has_access_token: false, is_valid: true }
      const status = service.getKeyStatus(keyInfo, false)
      expect(status).toBe("valid")
    })

    it("should return invalid when key is invalid", () => {
      const keyInfo = { key_type: "openai", has_value: true, is_oauth: false, has_access_token: false, is_valid: false }
      const status = service.getKeyStatus(keyInfo, false)
      expect(status).toBe("invalid")
    })

    it("should return not_set when has no value", () => {
      const keyInfo = {
        key_type: "openai",
        has_value: false,
        is_oauth: false,
        has_access_token: false,
        is_valid: undefined,
      }
      const status = service.getKeyStatus(keyInfo, false)
      expect(status).toBe("not_set")
    })
  })

  describe("Constants", () => {
    it("should have patterns for all services", () => {
      expect(API_KEY_PATTERNS.openai).toBeDefined()
      expect(API_KEY_PATTERNS.claude).toBeDefined()
      expect(API_KEY_PATTERNS.grok).toBeDefined()
    })

    it("should have masks for all services", () => {
      expect(API_KEY_MASKS.openai).toBeDefined()
      expect(API_KEY_MASKS.claude).toBeDefined()
    })

    it("should have min lengths for all services", () => {
      expect(API_KEY_MIN_LENGTH.openai).toBeGreaterThan(0)
      expect(API_KEY_MIN_LENGTH.claude).toBeGreaterThan(0)
    })

    it("should have validation messages for all services", () => {
      expect(VALIDATION_ERROR_MESSAGES.openai).toBeDefined()
      expect(VALIDATION_ERROR_MESSAGES.claude).toBeDefined()
    })
  })
})
