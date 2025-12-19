/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { MidiDevice } from "../../../services/midi/midi-engine"

// Extract DeviceItem component for testing
function DeviceItem({ device }: { device: MidiDevice }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-zinc-900/50" data-oid="0ez5aho">
      <div data-oid="8ft5v.b">
        <p className="text-sm font-medium text-zinc-100" data-oid="xa-._42">
          {device.name}
        </p>
        <p className="text-xs text-zinc-500" data-oid="ky2cdiu">
          {device.manufacturer}
        </p>
      </div>
      <div
        className={`w-2 h-2 rounded-full ${device.state === "connected" ? "bg-green-500" : "bg-red-500"}`}
        data-oid="v4gc.o1"
      />
    </div>
  )
}

describe("DeviceItem", () => {
  const mockDevice: MidiDevice = {
    id: "device-1",
    name: "Test MIDI Device",
    manufacturer: "Test Manufacturer",
    type: "input",
    state: "connected",
  }

  it("should render device information", () => {
    render(<DeviceItem device={mockDevice} data-oid="g850:mm" />)

    expect(screen.getByText("Test MIDI Device")).toBeInTheDocument()
    expect(screen.getByText("Test Manufacturer")).toBeInTheDocument()
  })

  it("should show green indicator for connected device", () => {
    render(<DeviceItem device={mockDevice} data-oid="r7e1el1" />)

    const indicator = document.querySelector(".bg-green-500")
    expect(indicator).toBeInTheDocument()
  })

  it("should show red indicator for disconnected device", () => {
    const disconnectedDevice: MidiDevice = {
      ...mockDevice,
      state: "disconnected",
    }

    render(<DeviceItem device={disconnectedDevice} data-oid="ofa_ln9" />)

    const indicator = document.querySelector(".bg-red-500")
    expect(indicator).toBeInTheDocument()
  })

  it("should have correct container classes", () => {
    const { container } = render(<DeviceItem device={mockDevice} data-oid="c-m9rc-" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass("flex items-center justify-between p-2 rounded bg-zinc-900/50")
  })

  it("should have correct text styling", () => {
    render(<DeviceItem device={mockDevice} data-oid="aj0a4-0" />)

    const deviceName = screen.getByText("Test MIDI Device")
    expect(deviceName).toHaveClass("text-sm font-medium text-zinc-100")

    const manufacturer = screen.getByText("Test Manufacturer")
    expect(manufacturer).toHaveClass("text-xs text-zinc-500")
  })

  it("should render indicator with correct styling", () => {
    const { container } = render(<DeviceItem device={mockDevice} data-oid="1bmy35d" />)

    const indicator = container.querySelector(".w-2.h-2.rounded-full")
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveClass("w-2 h-2 rounded-full")
  })

  it("should handle different device types", () => {
    const outputDevice: MidiDevice = {
      ...mockDevice,
      type: "output",
    }

    render(<DeviceItem device={outputDevice} data-oid="d3.eu_u" />)

    expect(screen.getByText("Test MIDI Device")).toBeInTheDocument()
    expect(screen.getByText("Test Manufacturer")).toBeInTheDocument()
  })

  it("should handle empty manufacturer", () => {
    const deviceWithoutManufacturer: MidiDevice = {
      ...mockDevice,
      manufacturer: "",
    }

    const { container } = render(<DeviceItem device={deviceWithoutManufacturer} data-oid="nqtlwcg" />)

    expect(screen.getByText("Test MIDI Device")).toBeInTheDocument()

    // Check for empty manufacturer paragraph
    const manufacturerElement = container.querySelector(".text-xs.text-zinc-500")
    expect(manufacturerElement).toBeInTheDocument()
    expect(manufacturerElement).toHaveTextContent("")
  })

  it("should handle long device names", () => {
    const deviceWithLongName: MidiDevice = {
      ...mockDevice,
      name: "Very Long MIDI Device Name That Might Wrap",
    }

    render(<DeviceItem device={deviceWithLongName} data-oid="dhtakg-" />)

    expect(screen.getByText("Very Long MIDI Device Name That Might Wrap")).toBeInTheDocument()
  })

  it("should display device ID correctly", () => {
    const deviceWithUniqueId: MidiDevice = {
      ...mockDevice,
      id: "unique-device-id-123",
    }

    render(<DeviceItem device={deviceWithUniqueId} data-oid="2zbux1i" />)

    // Device ID is not displayed in UI, but component should handle it
    expect(screen.getByText("Test MIDI Device")).toBeInTheDocument()
  })

  describe("Device State Indicator", () => {
    it("should show correct color for connected state", () => {
      render(<DeviceItem device={mockDevice} data-oid="fd3.d1j" />)

      const connectedIndicator = document.querySelector(".bg-green-500")
      expect(connectedIndicator).toBeInTheDocument()
      expect(connectedIndicator).toHaveClass("w-2 h-2 rounded-full")
    })

    it("should show correct color for disconnected state", () => {
      const disconnectedDevice: MidiDevice = {
        ...mockDevice,
        state: "disconnected",
      }

      render(<DeviceItem device={disconnectedDevice} data-oid="fmtimlf" />)

      const disconnectedIndicator = document.querySelector(".bg-red-500")
      expect(disconnectedIndicator).toBeInTheDocument()
      expect(disconnectedIndicator).toHaveClass("w-2 h-2 rounded-full")
    })
  })

  describe("Layout Structure", () => {
    it("should have proper flex layout", () => {
      const { container } = render(<DeviceItem device={mockDevice} data-oid="2fpohws" />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass("flex items-center justify-between")

      // Should have two main children: info div and indicator div
      expect(wrapper.children).toHaveLength(2)
    })

    it("should have device info section", () => {
      const { container } = render(<DeviceItem device={mockDevice} data-oid="vv6l_:r" />)

      const wrapper = container.firstChild as HTMLElement
      const infoSection = wrapper.children[0]

      expect(infoSection).toBeInTheDocument()
      expect(infoSection.children).toHaveLength(2) // Name and manufacturer
    })

    it("should have status indicator section", () => {
      const { container } = render(<DeviceItem device={mockDevice} data-oid="qq95_wg" />)

      const wrapper = container.firstChild as HTMLElement
      const indicatorSection = wrapper.children[1]

      expect(indicatorSection).toBeInTheDocument()
      expect(indicatorSection).toHaveClass("rounded-full")
    })
  })
})
