/**
 * Mock WorkspaceLayoutProvider for testing
 */

import type { ReactNode } from "react"
import { vi } from "vitest"

import { createMockWorkspaceContext } from "./test-data"

/**
 * Mock useWorkspaceLayout hook
 */
export const mockUseWorkspaceLayout = vi.fn(() => createMockWorkspaceContext())

/**
 * Mock WorkspaceLayoutProvider component
 */
export const MockWorkspaceLayoutProvider = ({ children }: { children: ReactNode }) => {
  return (
    <div data-testid="mock-workspace-layout-provider" data-oid="n3y_.xm">
      {children}
    </div>
  )
}

/**
 * Setup vi.mock for workspace-layout-provider
 */
vi.mock("../services/workspace-layout-provider", () => ({
  WorkspaceLayoutProvider: MockWorkspaceLayoutProvider,
  useWorkspaceLayout: mockUseWorkspaceLayout,
}))
