/**
 * ScriptView Tests
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { TimelineProviders } from "@/test/test-utils"

import { ScriptView } from "../script-view"

vi.mock("@timeline-studio/ui/components/resizable", () => {
  const React = require("react")
  return {
    ResizablePanelGroup: ({ children, ...props }: any) =>
      React.createElement("div", { "data-testid": "resizable-group", ...props }, children),
    ResizablePanel: ({ children, ...props }: any) =>
      React.createElement("div", { "data-testid": "resizable-panel", ...props }, children),
    ResizableHandle: (props: any) => React.createElement("div", { "data-testid": "resizable-handle", ...props }),
  }
})

describe("ScriptView", () => {
  it("should render script view", () => {
    render(
      <TimelineProviders>
        <ScriptView />
      </TimelineProviders>,
    )
    expect(screen.getByTestId("script-view")).toBeInTheDocument()
  })

  it("should render three panels", () => {
    render(
      <TimelineProviders>
        <ScriptView />
      </TimelineProviders>,
    )

    expect(screen.getByTestId("fragment-library-panel")).toBeInTheDocument()
    expect(screen.getByTestId("storyboard-editor-panel")).toBeInTheDocument()
    expect(screen.getByTestId("plan-settings-panel")).toBeInTheDocument()
  })

  it("should display panel titles", () => {
    render(
      <TimelineProviders>
        <ScriptView />
      </TimelineProviders>,
    )

    expect(screen.getByText("Фрагменты из анализа")).toBeInTheDocument()
    expect(screen.getByText("Настройки плана")).toBeInTheDocument()
  })
})
