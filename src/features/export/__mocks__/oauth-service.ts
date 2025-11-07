// Mock OAuth service for testing

import { OAuthToken } from "../types/export-types"

// Mock storage for tokens
const mockTokens: Record<string, OAuthToken | null> = {}

export async function loginToNetwork(network: string): Promise<OAuthToken | null> {
  // Simulate successful OAuth login
  const mockToken: OAuthToken = {
    accessToken: `mock_access_token_${network}`,
    refreshToken: `mock_refresh_token_${network}`,
    expiresIn: 3600,
    tokenType: "Bearer",
  }

  await storeToken(network, mockToken)
  return mockToken
}

export async function getStoredToken(network: string): Promise<OAuthToken | null> {
  // Check in-memory mock first
  if (mockTokens[network]) {
    return mockTokens[network]
  }

  // Check localStorage
  const stored = localStorage.getItem(`oauth_token_${network}`)
  if (stored) {
    return JSON.parse(stored)
  }

  return null
}

export async function logout(network: string): Promise<void> {
  mockTokens[network] = null
  localStorage.removeItem(`oauth_token_${network}`)
}

export async function refreshToken(network: string): Promise<OAuthToken | null> {
  const currentToken = await getStoredToken(network)
  if (!currentToken) return null

  // Simulate token refresh
  const refreshedToken: OAuthToken = {
    ...currentToken,
    accessToken: `refreshed_access_token_${network}`,
    expiresIn: 3600,
  }

  mockTokens[network] = refreshedToken
  localStorage.setItem(`oauth_token_${network}`, JSON.stringify(refreshedToken))

  return refreshedToken
}

export async function storeToken(network: string, token: OAuthToken): Promise<void> {
  mockTokens[network] = token
  localStorage.setItem(`oauth_token_${network}`, JSON.stringify(token))
}

export function isTokenExpired(_token: OAuthToken): boolean {
  // For testing, assume tokens never expire
  return false
}

// Export a namespace-like object for backward compatibility if needed
export const OAuthService = {
  loginToNetwork,
  getStoredToken,
  logout,
  refreshToken,
  storeToken,
  isTokenExpired,
}
