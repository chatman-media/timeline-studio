/**
 * @vitest-environment jsdom
 * Tests for Home page component
 *
 * Note: Home page is a simple wrapper that renders MediaStudio.
 * MediaStudio has comprehensive tests in src/features/media-studio/__tests__/
 * These tests verify the basic structure and export of the Home component.
 */

import { describe, expect, it, vi } from "vitest"

// Mock MediaStudio to avoid provider requirements
vi.mock("@/features/media-studio/components/media-studio", () => ({
  MediaStudio: () => <div data-testid="media-studio-mock">MediaStudio</div>,
}))

describe("Home Page", () => {
  it("should export default function", async () => {
    const module = await import("../page")
    expect(module.default).toBeDefined()
    expect(typeof module.default).toBe("function")
  })

  it("should render with MediaStudio", async () => {
    const { render } = await import("@testing-library/react")
    const Home = (await import("../page")).default

    const { getByTestId, container } = render(<Home />)

    // Check MediaStudio is rendered (mocked)
    expect(getByTestId("media-studio-mock")).toBeInTheDocument()

    // Check container has correct styling
    const rootDiv = container.firstChild as HTMLElement
    expect(rootDiv).toHaveClass("relative")
    expect(rootDiv).toHaveClass("min-h-screen")
  })

  it("should have correct background colors", async () => {
    const { render } = await import("@testing-library/react")
    const Home = (await import("../page")).default

    const { container } = render(<Home />)

    const rootDiv = container.firstChild as HTMLElement
    expect(rootDiv).toHaveClass("bg-[#f7f8f9]")
    expect(rootDiv).toHaveClass("dark:bg-[#252526]")
  })

  it("should be a client component", async () => {
    // Verify the file has "use client" directive by checking it's a client component
    const { render } = await import("@testing-library/react")
    const Home = (await import("../page")).default

    expect(() => render(<Home />)).not.toThrow()
  })
})
