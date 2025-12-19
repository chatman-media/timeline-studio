/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MidiConfigurationModalComponent } from "../midi-configuration-modal-component"

// Mock MidiSetup component
vi.mock("../midi-setup", () => ({
  MidiSetup: () => (
    <div data-testid="midi-setup" data-oid="zksp2kj">
      Mocked MidiSetup
    </div>
  ),
}))

describe("MidiConfigurationModalComponent", () => {
  it("should render without errors", () => {
    render(<MidiConfigurationModalComponent data-oid="xo.fw7k" />)

    expect(screen.getByTestId("midi-setup")).toBeInTheDocument()
  })

  it("should apply correct container styles", () => {
    const { container } = render(<MidiConfigurationModalComponent data-oid="t866y:2" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass("max-w-2xl max-h-[80vh] overflow-hidden")
  })

  it("should apply correct scrollable area styles", () => {
    const { container } = render(<MidiConfigurationModalComponent data-oid="hemlxf2" />)

    const scrollArea = container.querySelector(".overflow-y-auto")
    expect(scrollArea).toHaveClass("overflow-y-auto max-h-[60vh] pr-2")
  })

  it("should render MidiSetup component inside scrollable area", () => {
    const { container } = render(<MidiConfigurationModalComponent data-oid="7kaq-dq" />)

    const scrollArea = container.querySelector(".overflow-y-auto")
    const midiSetup = scrollArea?.querySelector('[data-testid="midi-setup"]')

    expect(midiSetup).toBeInTheDocument()
    expect(midiSetup).toHaveTextContent("Mocked MidiSetup")
  })

  it("should have proper DOM structure", () => {
    const { container } = render(<MidiConfigurationModalComponent data-oid="4sv-zdv" />)

    // Check nesting structure
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.tagName).toBe("DIV")

    const innerDiv = outerDiv.firstChild as HTMLElement
    expect(innerDiv.tagName).toBe("DIV")

    const midiSetup = innerDiv.firstChild as HTMLElement
    expect(midiSetup).toHaveAttribute("data-testid", "midi-setup")
  })

  it("should maintain container constraints", () => {
    const { container } = render(<MidiConfigurationModalComponent data-oid="rsomxzw" />)

    const wrapper = container.firstChild as HTMLElement
    const scrollArea = wrapper.firstChild as HTMLElement

    // Verify the structure maintains the height constraints
    expect(wrapper).toHaveClass("max-h-[80vh]")
    expect(scrollArea).toHaveClass("max-h-[60vh]")
  })

  it("should allow content to be scrollable", () => {
    const { container } = render(<MidiConfigurationModalComponent data-oid="d9sm.rt" />)

    const scrollArea = container.querySelector(".overflow-y-auto")
    expect(scrollArea).toHaveClass("overflow-y-auto")
    expect(scrollArea).not.toHaveClass("overflow-hidden")
  })

  it("should have padding on the right for scrollbar", () => {
    const { container } = render(<MidiConfigurationModalComponent data-oid="bc_ipx7" />)

    const scrollArea = container.querySelector(".overflow-y-auto")
    expect(scrollArea).toHaveClass("pr-2")
  })

  it("should not have horizontal overflow", () => {
    const { container } = render(<MidiConfigurationModalComponent data-oid="z7-tsdf" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass("overflow-hidden")
  })
})
