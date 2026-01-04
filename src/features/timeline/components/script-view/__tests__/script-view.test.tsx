/**
 * ScriptView Tests
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TimelineProviders } from "@/test/test-utils"

import { ScriptView } from "../script-view"

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
