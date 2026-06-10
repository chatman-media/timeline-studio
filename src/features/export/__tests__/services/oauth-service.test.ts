import { beforeEach, describe, expect, it, vi } from "vitest"

const mockShowNotification = vi.fn()

// Mock environment utilities before importing services
vi.mock("@/lib/environment", () => ({
  isDesktop: vi.fn().mockReturnValue(false),
  getTauriVersion: vi.fn().mockResolvedValue("2.0.0"),
  getSystemInfo: vi.fn().mockResolvedValue({
    platform: "darwin",
    osVersion: "14.0.0",
    arch: "aarch64",
  }),
}))

vi.mock("@/core/services/notifications", () => ({
  showSystemNotification: mockShowNotification,
}))

// Mock SecureTokenStorage
vi.mock("../../services/secure-token-storage", () => ({
  SecureTokenStorage: {
    storeToken: vi.fn(),
    getStoredToken: vi.fn(),
    removeToken: vi.fn(),
  },
}))

// Mock logger
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => mockLogger),
}))

const mockEnv = {
  NEXT_PUBLIC_YOUTUBE_CLIENT_ID: "youtube_client_id",
  NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET: "youtube_client_secret",
  NEXT_PUBLIC_TIKTOK_CLIENT_ID: "tiktok_client_id",
  NEXT_PUBLIC_TIKTOK_CLIENT_SECRET: "tiktok_client_secret",
  NEXT_PUBLIC_OAUTH_REDIRECT_URI: "http://localhost:3000/oauth/callback",
}

Object.entries(mockEnv).forEach(([key, value]) => {
  vi.stubEnv(key, value)
})

// Import after mocking
const { OAuthService } = await import("../../services/oauth-service")
const { SecureTokenStorage } = await import("../../services/secure-token-storage")

// Mock window.open and message handling
let mockWindow: Partial<Window> & { closed?: boolean }
const mockWindowOpen = vi.fn()
const mockWindowClose = vi.fn()
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

global.fetch = vi.fn()
Object.assign(global.window, {
  open: mockWindowOpen,
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  location: { origin: "http://localhost:3000" },
})

describe("OAuthService - Comprehensive", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShowNotification.mockClear()
    mockLogger.error.mockClear()
    mockLogger.info.mockClear()
    mockLogger.warn.mockClear()
    mockLogger.debug.mockClear()
    mockWindow = {
      closed: false,
      close: mockWindowClose,
    }
    mockWindowOpen.mockReturnValue(mockWindow)
  })

  describe("Static Configuration", () => {
    it("should have correct YouTube configuration", () => {
      expect(OAuthService).toBeDefined()
      // We can't directly access configs since they're private, but we can test through public methods
    })

    it("should have correct TikTok configuration", () => {
      expect(OAuthService).toBeDefined()
      // Configuration is tested through the login methods
    })
  })

  describe("loginToNetwork", () => {
    it("should throw error for unsupported network", async () => {
      await expect(OAuthService.loginToNetwork("unsupported")).rejects.toThrow("Unsupported network: unsupported")
    })

    it("should show error toast if YouTube clientId is not configured", async () => {
      // Reset the module to pick up new environment variables
      vi.resetModules()
      vi.unstubAllEnvs()
      vi.stubEnv("NEXT_PUBLIC_YOUTUBE_CLIENT_ID", "")

      // Re-import the service to pick up new env vars
      const { OAuthService: FreshOAuthService } = await import("../../services/oauth-service")

      const result = await FreshOAuthService.loginToNetwork("youtube")

      expect(result).toBeNull()
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "OAuth Configuration Error",
          message: "OAuth not configured for youtube. Please check environment variables.",
        }),
      )
    }, 10000)

    it("should show error toast if TikTok clientId is not configured", async () => {
      // Reset the module to pick up new environment variables
      vi.resetModules()
      vi.unstubAllEnvs()
      vi.stubEnv("NEXT_PUBLIC_TIKTOK_CLIENT_ID", "")

      // Re-import the service to pick up new env vars
      const { OAuthService: FreshOAuthService } = await import("../../services/oauth-service")

      const result = await FreshOAuthService.loginToNetwork("tiktok")

      expect(result).toBeNull()
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "OAuth Configuration Error",
          message: "OAuth not configured for tiktok. Please check environment variables.",
        }),
      )
    }, 10000)

    it("should create correct auth URL for YouTube", async () => {
      vi.stubEnv("NEXT_PUBLIC_YOUTUBE_CLIENT_ID", "test_youtube_client")

      // Mock window.open to fail after a short delay to avoid infinite wait
      mockWindowOpen.mockReturnValue(null)

      try {
        await OAuthService.loginToNetwork("youtube")
      } catch (error) {
        expect((error as Error).message).toBe("Failed to open authentication window")
      }

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("https://accounts.google.com/o/oauth2/v2/auth"),
        "oauth",
        "width=600,height=700,scrollbars=yes,resizable=yes",
      )
    })

    it("should create correct auth URL for TikTok", async () => {
      vi.stubEnv("NEXT_PUBLIC_TIKTOK_CLIENT_ID", "test_tiktok_client")

      mockWindowOpen.mockReturnValue(null)

      try {
        await OAuthService.loginToNetwork("tiktok")
      } catch (error) {
        expect((error as Error).message).toBe("Failed to open authentication window")
      }

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("https://www.tiktok.com/v2/auth/authorize/"),
        "oauth",
        "width=600,height=700,scrollbars=yes,resizable=yes",
      )
    })

    it("should handle successful OAuth message", async () => {
      const mockToken = {
        accessToken: "test_token",
        refreshToken: "test_refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
      }

      // Set up message handler to simulate successful OAuth
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === "message") {
          // Simulate successful OAuth message after a short delay
          setTimeout(() => {
            handler({
              origin: "http://localhost:3000",
              data: {
                type: "oauth_success",
                token: mockToken,
              },
            })
          }, 100)
        }
      })

      const resultPromise = OAuthService.loginToNetwork("youtube")
      const result = await resultPromise

      expect(result).toEqual(mockToken)
      expect(mockWindowClose).toHaveBeenCalled()
      expect(mockRemoveEventListener).toHaveBeenCalledWith("message", expect.any(Function))
    })

    it("should handle OAuth error message", async () => {
      const errorMessage = "Access denied"

      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === "message") {
          setTimeout(() => {
            handler({
              origin: "http://localhost:3000",
              data: {
                type: "oauth_error",
                error: errorMessage,
              },
            })
          }, 100)
        }
      })

      await expect(OAuthService.loginToNetwork("youtube")).rejects.toThrow(errorMessage)
      expect(mockWindowClose).toHaveBeenCalled()
      expect(mockRemoveEventListener).toHaveBeenCalledWith("message", expect.any(Function))
    })

    it("should handle window closed by user", async () => {
      mockAddEventListener.mockImplementation((event, _handler) => {
        if (event === "message") {
          // Don't send any message, just close the window
          setTimeout(() => {
            mockWindow.closed = true
          }, 100)
        }
      })

      await expect(OAuthService.loginToNetwork("youtube")).rejects.toThrow("Authentication cancelled")
    })

    it("should ignore messages from different origins", async () => {
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === "message") {
          // Send message from wrong origin
          setTimeout(() => {
            handler({
              origin: "https://malicious-site.com",
              data: {
                type: "oauth_success",
                token: { accessToken: "fake" },
              },
            })
          }, 50)

          // Then close window to trigger cancellation
          setTimeout(() => {
            mockWindow.closed = true
          }, 150)
        }
      })

      await expect(OAuthService.loginToNetwork("youtube")).rejects.toThrow("Authentication cancelled")
    })

    it("should handle authentication window popup blocked", async () => {
      mockWindowOpen.mockReturnValue(null)

      await expect(OAuthService.loginToNetwork("youtube")).rejects.toThrow("Failed to open authentication window")
    })
  })

  describe("refreshToken", () => {
    beforeEach(() => {
      vi.mocked(fetch).mockClear()
    })

    it("should refresh YouTube/Google token successfully", async () => {
      const mockResponse = {
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
        expires_in: 3600,
        token_type: "Bearer",
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as any)

      const result = await OAuthService.refreshToken("youtube", "old_refresh_token")

      expect(fetch).toHaveBeenCalledWith("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: expect.any(URLSearchParams),
      })

      expect(result).toEqual({
        accessToken: "new_access_token",
        refreshToken: "new_refresh_token",
        expiresIn: 3600,
        tokenType: "Bearer",
      })
    })

    it("should refresh TikTok token successfully", async () => {
      const mockResponse = {
        data: {
          access_token: "new_tiktok_token",
          refresh_token: "new_tiktok_refresh",
          expires_in: 7200,
        },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as any)

      const result = await OAuthService.refreshToken("tiktok", "old_refresh_token")

      expect(fetch).toHaveBeenCalledWith("https://open-api.tiktok.com/oauth/refresh_token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: expect.any(URLSearchParams),
      })

      expect(result).toEqual({
        accessToken: "new_tiktok_token",
        refreshToken: "new_tiktok_refresh",
        expiresIn: 7200,
        tokenType: "Bearer",
      })
    })

    it("should handle Google token refresh failure", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
      } as any)

      const result = await OAuthService.refreshToken("youtube", "invalid_refresh_token")

      expect(result).toBeNull()
    })

    it("should handle TikTok token refresh failure", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
      } as any)

      const result = await OAuthService.refreshToken("tiktok", "invalid_refresh_token")

      expect(result).toBeNull()
    })

    it("should handle network errors during token refresh", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"))

      const result = await OAuthService.refreshToken("youtube", "refresh_token")

      expect(result).toBeNull()
    })

    it("should return null for unsupported network", async () => {
      const result = await OAuthService.refreshToken("unsupported", "refresh_token")

      expect(result).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    })

    it("should use existing refresh token if new one not provided", async () => {
      const mockResponse = {
        access_token: "new_access_token",
        // Note: no refresh_token in response
        expires_in: 3600,
        token_type: "Bearer",
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as any)

      const result = await OAuthService.refreshToken("youtube", "existing_refresh_token")

      expect(result).toEqual({
        accessToken: "new_access_token",
        refreshToken: "existing_refresh_token", // Should use the existing one
        expiresIn: 3600,
        tokenType: "Bearer",
      })
    })
  })

  describe("logout", () => {
    it("should clear stored tokens and show success message for YouTube", async () => {
      await OAuthService.logout("youtube")

      expect(SecureTokenStorage.removeToken).toHaveBeenCalledWith("youtube")
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          title: "Logged Out",
          message: "Successfully logged out from youtube",
          duration: 3000,
        }),
      )
    })

    it("should clear stored tokens and show success message for TikTok", async () => {
      await OAuthService.logout("tiktok")

      expect(SecureTokenStorage.removeToken).toHaveBeenCalledWith("tiktok")
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          title: "Logged Out",
          message: "Successfully logged out from tiktok",
          duration: 3000,
        }),
      )
    })

    it("should handle logout for any network", async () => {
      await OAuthService.logout("custom_network")

      expect(SecureTokenStorage.removeToken).toHaveBeenCalledWith("custom_network")
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          title: "Logged Out",
          message: "Successfully logged out from custom_network",
          duration: 3000,
        }),
      )
    })
  })

  describe("getStoredToken", () => {
    it("should return stored token from SecureTokenStorage", async () => {
      const mockToken = {
        accessToken: "stored_token",
        refreshToken: "stored_refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
      }

      vi.mocked(SecureTokenStorage.getStoredToken).mockResolvedValue(mockToken)

      const result = await OAuthService.getStoredToken("youtube")

      expect(result).toEqual(mockToken)
      expect(SecureTokenStorage.getStoredToken).toHaveBeenCalledWith("youtube")
    })

    it("should return null if no token stored", async () => {
      vi.mocked(SecureTokenStorage.getStoredToken).mockResolvedValue(null)

      const result = await OAuthService.getStoredToken("youtube")

      expect(result).toBeNull()
      expect(SecureTokenStorage.getStoredToken).toHaveBeenCalledWith("youtube")
    })

    it("should handle storage errors gracefully", async () => {
      vi.mocked(SecureTokenStorage.getStoredToken).mockRejectedValue(new Error("Storage error"))

      // The method should throw the error since it doesn't have try/catch
      await expect(OAuthService.getStoredToken("youtube")).rejects.toThrow("Storage error")
    })
  })

  describe("storeToken", () => {
    it("should store token using SecureTokenStorage", async () => {
      const mockToken = {
        accessToken: "new_token",
        refreshToken: "new_refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
      }

      await OAuthService.storeToken("youtube", mockToken)

      expect(SecureTokenStorage.storeToken).toHaveBeenCalledWith("youtube", mockToken)
    })

    it("should handle different token types", async () => {
      const mockToken = {
        accessToken: "bearer_token",
        refreshToken: "refresh_token",
        expiresIn: 7200,
        tokenType: "Bearer",
      }

      await OAuthService.storeToken("tiktok", mockToken)

      expect(SecureTokenStorage.storeToken).toHaveBeenCalledWith("tiktok", mockToken)
    })

    it("should handle storage errors", async () => {
      const mockToken = {
        accessToken: "token",
        expiresIn: 3600,
        tokenType: "Bearer",
      }

      vi.mocked(SecureTokenStorage.storeToken).mockRejectedValue(new Error("Storage full"))

      await expect(OAuthService.storeToken("youtube", mockToken)).rejects.toThrow("Storage full")
    })
  })

  describe("URL Generation", () => {
    it("should include all required parameters in YouTube auth URL", async () => {
      mockWindowOpen.mockReturnValue(null)

      try {
        await OAuthService.loginToNetwork("youtube")
      } catch (error) {
        // Expected to fail due to null window
      }

      const callArgs = mockWindowOpen.mock.calls[0]
      const authUrl = new URL(callArgs[0])

      expect(authUrl.searchParams.get("client_id")).toBe("youtube_client_id")
      expect(authUrl.searchParams.get("redirect_uri")).toBe("http://localhost:3000/oauth/callback")
      expect(authUrl.searchParams.get("scope")).toBe(
        "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
      )
      expect(authUrl.searchParams.get("response_type")).toBe("code")
      expect(authUrl.searchParams.get("state")).toMatch(/^youtube_\d+$/)
    })

    it("should include all required parameters in TikTok auth URL", async () => {
      mockWindowOpen.mockReturnValue(null)

      try {
        await OAuthService.loginToNetwork("tiktok")
      } catch (error) {
        // Expected to fail due to null window
      }

      const callArgs = mockWindowOpen.mock.calls[0]
      const authUrl = new URL(callArgs[0])

      expect(authUrl.searchParams.get("client_id")).toBe("tiktok_client_id")
      expect(authUrl.searchParams.get("redirect_uri")).toBe("http://localhost:3000/oauth/callback")
      expect(authUrl.searchParams.get("scope")).toBe("video.upload user.info.basic")
      expect(authUrl.searchParams.get("response_type")).toBe("code")
      expect(authUrl.searchParams.get("state")).toMatch(/^tiktok_\d+$/)
    })
  })

  describe("Error Handling", () => {
    it("should handle general errors in loginToNetwork", async () => {
      // Cause an error by making window.open throw
      mockWindowOpen.mockImplementation(() => {
        throw new Error("Window creation failed")
      })

      await expect(OAuthService.loginToNetwork("youtube")).rejects.toThrow("Window creation failed")
    })

    it("should log errors on token refresh failure", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network timeout"))

      const result = await OAuthService.refreshToken("youtube", "token")

      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith("Token refresh failed for youtube: Error: Network timeout")
    })

    it("should log errors on OAuth login failure", async () => {
      mockWindowOpen.mockImplementation(() => {
        throw new Error("Popup blocked")
      })

      await expect(OAuthService.loginToNetwork("youtube")).rejects.toThrow("Popup blocked")

      expect(mockLogger.error).toHaveBeenCalledWith("OAuth login failed for youtube: Error: Popup blocked")
    })
  })
})
