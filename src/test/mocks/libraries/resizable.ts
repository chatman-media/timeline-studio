import React from "react"

import { vi } from "vitest"

// Mock ResizablePanel components to prevent infinite re-renders
const MockResizablePanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { defaultSize?: number; minSize?: number; maxSize?: number }
>(function MockResizablePanel({ children, className, ...props }, ref) {
  return React.createElement(
    "div",
    {
      ...props,
      ref,
      className,
      "data-testid": "resizable-panel",
      style: { width: "100%", height: "100%" },
    },
    children,
  )
})

const MockResizablePanelGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { direction?: "horizontal" | "vertical" }
>(function MockResizablePanelGroup({ children, className, direction = "horizontal", ...props }, ref) {
  return React.createElement(
    "div",
    {
      ...props,
      ref,
      className,
      "data-direction": direction,
      style: {
        display: "flex",
        flexDirection: direction === "horizontal" ? "row" : "column",
        width: "100%",
        height: "100%",
      },
    },
    children,
  )
})

const MockResizableHandle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function MockResizableHandle({ className, ...props }, ref) {
    return React.createElement("div", {
      ...props,
      ref,
      className,
      "data-testid": "resizable-handle",
      style: { width: "4px", height: "4px", background: "#ccc" },
    })
  },
)

MockResizablePanel.displayName = "MockResizablePanel"
MockResizablePanelGroup.displayName = "MockResizablePanelGroup"
MockResizableHandle.displayName = "MockResizableHandle"

// Mock the entire @timeline-studio/ui/components/resizable module
vi.mock("@timeline-studio/ui/components/resizable", () => ({
  ResizablePanel: MockResizablePanel,
  ResizablePanelGroup: MockResizablePanelGroup,
  ResizableHandle: MockResizableHandle,
}))

export {
  MockResizableHandle as ResizableHandle,
  MockResizablePanel as ResizablePanel,
  MockResizablePanelGroup as ResizablePanelGroup,
}
