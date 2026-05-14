/**
 * PlanSettings Tests
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { PlanSettings as PlanSettingsType } from "@/features/timeline/types/script"

import { PlanSettings } from "../plan-settings"

const mockSettings: PlanSettingsType = {
  prioritizeQuality: true,
  prioritizeEngagement: true,
  syncWithMusic: false,
  includeFaces: true,
  includeDynamic: true,
  paceLevel: 70,
  transitionComplexity: 50,
}

describe("PlanSettings", () => {
  it("should render plan settings", () => {
    render(<PlanSettings settings={mockSettings} planName="Test Plan" targetDuration={120} style="dynamic-action" />)
    expect(screen.getByTestId("plan-settings")).toBeInTheDocument()
  })

  it("should display plan name input", () => {
    render(<PlanSettings settings={mockSettings} planName="Test Plan" targetDuration={120} style="dynamic-action" />)

    const input = screen.getByTestId("plan-name-input") as HTMLInputElement
    expect(input.value).toBe("Test Plan")
  })

  it("should display target duration input", () => {
    render(<PlanSettings settings={mockSettings} planName="Test Plan" targetDuration={120} style="dynamic-action" />)

    const input = screen.getByTestId("target-duration-input") as HTMLInputElement
    expect(input.value).toBe("120")
  })

  it("should render all style options", () => {
    render(<PlanSettings settings={mockSettings} planName="Test Plan" targetDuration={120} style="dynamic-action" />)

    expect(screen.getByTestId("style-dynamic-action")).toBeInTheDocument()
    expect(screen.getByTestId("style-cinematic-drama")).toBeInTheDocument()
    expect(screen.getByTestId("style-music-video")).toBeInTheDocument()
    expect(screen.getByTestId("style-documentary")).toBeInTheDocument()
    expect(screen.getByTestId("style-social-media")).toBeInTheDocument()
    expect(screen.getByTestId("style-corporate")).toBeInTheDocument()
  })

  it("should check selected style", () => {
    render(<PlanSettings settings={mockSettings} planName="Test Plan" targetDuration={120} style="cinematic-drama" />)

    const input = screen.getByTestId("style-cinematic-drama") as HTMLInputElement
    expect(input.checked).toBe(true)
  })

  it("should call onNameChange when name input changes", async () => {
    const user = userEvent.setup()
    const onNameChange = vi.fn()

    render(
      <PlanSettings
        settings={mockSettings}
        planName="Test Plan"
        targetDuration={120}
        style="dynamic-action"
        onNameChange={onNameChange}
      />,
    )

    const input = screen.getByTestId("plan-name-input")
    await user.clear(input)
    await user.type(input, "New Name")

    expect(onNameChange).toHaveBeenCalled()
  })

  it("should call onDurationChange when duration input changes", async () => {
    const user = userEvent.setup()
    const onDurationChange = vi.fn()

    render(
      <PlanSettings
        settings={mockSettings}
        planName="Test Plan"
        targetDuration={120}
        style="dynamic-action"
        onDurationChange={onDurationChange}
      />,
    )

    const input = screen.getByTestId("target-duration-input")
    await user.clear(input)
    await user.type(input, "180")

    expect(onDurationChange).toHaveBeenCalled()
  })

  it("should call onStyleChange when style selected", async () => {
    const user = userEvent.setup()
    const onStyleChange = vi.fn()

    render(
      <PlanSettings
        settings={mockSettings}
        planName="Test Plan"
        targetDuration={120}
        style="dynamic-action"
        onStyleChange={onStyleChange}
      />,
    )

    await user.click(screen.getByTestId("style-music-video"))

    expect(onStyleChange).toHaveBeenCalledWith("music-video")
  })

  it("should render generate plan button", () => {
    render(<PlanSettings settings={mockSettings} planName="Test Plan" targetDuration={120} style="dynamic-action" />)

    expect(screen.getByTestId("generate-plan-button")).toBeInTheDocument()
    expect(screen.getByText(/Создать план \(AI\)/i)).toBeInTheDocument()
  })

  it("should render apply plan button", () => {
    render(<PlanSettings settings={mockSettings} planName="Test Plan" targetDuration={120} style="dynamic-action" />)

    expect(screen.getByTestId("apply-plan-button")).toBeInTheDocument()
    expect(screen.getByText(/Применить к Timeline/i)).toBeInTheDocument()
  })

  it("should call onGeneratePlan when generate button clicked", async () => {
    const user = userEvent.setup()
    const onGeneratePlan = vi.fn()

    render(
      <PlanSettings
        settings={mockSettings}
        planName="Test Plan"
        targetDuration={120}
        style="dynamic-action"
        onGeneratePlan={onGeneratePlan}
      />,
    )

    await user.click(screen.getByTestId("generate-plan-button"))

    expect(onGeneratePlan).toHaveBeenCalled()
  })

  it("should call onApplyPlan when apply button clicked", async () => {
    const user = userEvent.setup()
    const onApplyPlan = vi.fn()

    render(
      <PlanSettings
        settings={mockSettings}
        planName="Test Plan"
        targetDuration={120}
        style="dynamic-action"
        onApplyPlan={onApplyPlan}
      />,
    )

    await user.click(screen.getByTestId("apply-plan-button"))

    expect(onApplyPlan).toHaveBeenCalled()
  })
})
