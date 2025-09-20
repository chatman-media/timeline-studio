/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers"

declare module "vitest" {
  interface Assertion<T = any> extends TestingLibraryMatchers<T, void> {
    toBeInTheDocument(): T
    toHaveClass(className: string): T
    toHaveStyle(style: Record<string, any>): T
    toHaveAttribute(attr: string, value?: string): T
    toBeDisabled(): T
    toBeEnabled(): T
    toHaveValue(value: string | number): T
    toBeChecked(): T
    toHaveTextContent(text: string): T
    toBeVisible(): T
    toBeEmptyDOMElement(): T
    toHaveFocus(): T
  }
}
