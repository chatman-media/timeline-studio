import React from "react"

import { vi } from "vitest"

// Shared state for select components
const selectStates = new Map<string, string>()

// Mock UI components
export const mockUIComponents = () => {
  // Mock i18n
  vi.mock("react-i18next", () => ({
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  }))

  // Mock UI components
  vi.mock("@/components/ui/alert", () => ({
    Alert: ({ children, className }: any) => (
      <div className={className} role="alert" data-oid="h621whe">
        {children}
      </div>
    ),

    AlertDescription: ({ children }: any) => <div data-oid="o9lmuqn">{children}</div>,
  }))

  vi.mock("@/components/ui/badge", () => ({
    Badge: ({ children, variant }: any) => (
      <span data-variant={variant} data-oid="l9wogh0">
        {children}
      </span>
    ),
  }))

  vi.mock("@/components/ui/button", () => ({
    Button: ({ children, onClick, disabled, variant, size, className }: any) => (
      <button
        onClick={onClick}
        disabled={disabled}
        data-variant={variant}
        data-size={size}
        className={className}
        data-oid="tw939pn"
      >
        {children}
      </button>
    ),
  }))

  vi.mock("@/components/ui/card", () => ({
    Card: ({ children, className }: any) => (
      <div className={className} data-oid="ggo2bgi">
        {children}
      </div>
    ),

    CardContent: ({ children, className }: any) => (
      <div className={className} data-oid="_4l8zw6">
        {children}
      </div>
    ),

    CardHeader: ({ children, className }: any) => (
      <div className={className} data-oid="-1ynps_">
        {children}
      </div>
    ),

    CardTitle: ({ children, className }: any) => (
      <h3 className={className} data-oid="e75yrai">
        {children}
      </h3>
    ),
  }))

  vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ open, onOpenChange, children }: any) => {
      // If open is undefined, default to true for components that always show
      const isOpen = open !== undefined ? open : true
      return isOpen ? (
        <div data-testid="dialog" onClick={() => onOpenChange?.(false)} data-oid="cxt_xn2">
          {children}
        </div>
      ) : null
    },
    DialogContent: ({ children, className }: any) => (
      <div className={className} data-oid="mdv3oxf">
        {children}
      </div>
    ),

    DialogDescription: ({ children }: any) => <div data-oid="afesls_">{children}</div>,

    DialogFooter: ({ children }: any) => <div data-oid="b7infd1">{children}</div>,

    DialogHeader: ({ children }: any) => <div data-oid="_z-zq2q">{children}</div>,

    DialogTitle: ({ children }: any) => <h2 data-oid="n.3fj8a">{children}</h2>,
  }))

  vi.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: any) => <div data-oid=":_9mvq.">{children}</div>,

    DropdownMenuContent: ({ children }: any) => (
      <div data-testid="dropdown-content" data-oid="s_ig7w2">
        {children}
      </div>
    ),

    DropdownMenuItem: ({ children, onClick, className }: any) => (
      <div onClick={onClick} className={className} data-oid="gt-tgr9">
        {children}
      </div>
    ),

    DropdownMenuTrigger: ({ children, _asChild }: any) => (
      <div data-testid="dropdown-trigger" data-oid="tpvgu8w">
        {children}
      </div>
    ),
  }))

  vi.mock("@/components/ui/label", () => ({
    Label: ({ children, htmlFor, className }: any) => (
      <label htmlFor={htmlFor} className={className} data-oid="z7bquhv">
        {children}
      </label>
    ),
  }))

  vi.mock("@/components/ui/progress", () => ({
    Progress: ({ value, className }: any) => (
      <div className={className} data-value={value} data-testid="progress" data-oid="u5p_8.7" />
    ),
  }))

  vi.mock("@/components/ui/scroll-area", () => ({
    ScrollArea: ({ children, className }: any) => (
      <div className={className} data-oid="-cev07.">
        {children}
      </div>
    ),
  }))

  // Unified select mock implementation
  vi.mock("@/components/ui/select", () => {
    // Create a context to share state between Select components
    const SelectContext = React.createContext<any>(null)

    return {
      Select: ({ value, onValueChange, children, defaultValue }: any) => {
        const [internalValue, setInternalValue] = React.useState(value || defaultValue || "")

        // Update internal value when prop value changes
        React.useEffect(() => {
          if (value !== undefined && value !== internalValue) {
            setInternalValue(value)
          }
        }, [value])

        const handleValueChange = (newValue: string) => {
          setInternalValue(newValue)
          onValueChange?.(newValue)
        }

        return (
          <SelectContext.Provider value={{ value: internalValue, onValueChange: handleValueChange }} data-oid="h0o.hjm">
            <div data-value={internalValue} data-testid="select" data-oid="9:q_xk5">
              {children}
            </div>
          </SelectContext.Provider>
        )
      },
      SelectContent: ({ children }: any) => {
        const context = React.useContext(SelectContext)
        return (
          <div data-testid="select-content" data-oid="szr1-1d">
            {React.Children.map(children, (child) =>
              React.isValidElement(child) ? React.cloneElement(child as any, { ...context }) : child,
            )}
          </div>
        )
      },
      SelectItem: ({ value, children, onValueChange }: any) => (
        <div data-value={value} data-testid="select-item" onClick={() => onValueChange?.(value)} data-oid=":ll9q06">
          {children}
        </div>
      ),

      SelectTrigger: ({ children, id, className }: any) => (
        <div id={id} className={className} data-testid="select-trigger" data-oid="co9lcam">
          {children}
        </div>
      ),

      SelectValue: ({ placeholder }: any) => {
        const context = React.useContext(SelectContext)
        return (
          <span data-testid="select-value" data-oid="laya_i3">
            {context?.value || placeholder}
          </span>
        )
      },
    }
  })

  vi.mock("@/components/ui/slider", () => ({
    Slider: ({ value, onValueChange, min, max, step, className }: any) => (
      <input
        type="range"
        value={value?.[0] || 0}
        onChange={(e) => onValueChange?.([Number.parseFloat(e.target.value)])}
        min={min}
        max={max}
        step={step}
        className={className}
        data-testid="slider"
        data-oid="ny0jwx:"
      />
    ),
  }))

  vi.mock("@/components/ui/switch", () => ({
    Switch: ({ checked, onCheckedChange, "aria-label": ariaLabel }: any) => (
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        aria-label={ariaLabel}
        data-testid="switch"
        data-oid="dt-w6z5"
      />
    ),
  }))

  vi.mock("@/components/ui/tabs", () => {
    const TabsContext = React.createContext<any>(null)

    return {
      Tabs: ({ children, defaultValue, value, onValueChange, className }: any) => {
        const [activeTab, setActiveTab] = React.useState(value || defaultValue || "")

        const handleValueChange = (newValue: string) => {
          setActiveTab(newValue)
          onValueChange?.(newValue)
        }

        return (
          <TabsContext.Provider value={{ activeTab, setActiveTab: handleValueChange }} data-oid="q71lazh">
            <div className={className} data-default-value={defaultValue} data-value={activeTab} data-oid="53kfhfy">
              {children}
            </div>
          </TabsContext.Provider>
        )
      },
      TabsContent: ({ children, value, className }: any) => {
        const context = React.useContext(TabsContext)
        const isActive = context?.activeTab === value

        return isActive ? (
          <div
            className={className}
            data-tab-content={value}
            role="tabpanel"
            aria-labelledby={`trigger-${value}`}
            data-state={isActive ? "active" : "inactive"}
            data-oid="h1vcx.w"
          >
            {children}
          </div>
        ) : null
      },
      TabsList: ({ children, className }: any) => (
        <div className={className} role="tablist" data-oid="dox-k39">
          {children}
        </div>
      ),

      TabsTrigger: ({ children, value }: any) => {
        const context = React.useContext(TabsContext)
        const isActive = context?.activeTab === value

        return (
          <button
            data-tab={value}
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? "active" : "inactive"}
            onClick={() => context?.setActiveTab(value)}
            id={`trigger-${value}`}
            aria-controls={`content-${value}`}
            data-oid="d6a1yn1"
          >
            {children}
          </button>
        )
      },
    }
  })

  vi.mock("@/components/ui/textarea", () => ({
    Textarea: ({ value, onChange, placeholder, className, rows }: any) => (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        rows={rows}
        data-testid="textarea"
        data-oid="4c_c2lm"
      />
    ),
  }))
}

// Reset select states between tests
export const resetSelectStates = () => {
  selectStates.clear()
}

// Get current select value for testing
export const getSelectValue = (selectId: string) => {
  return selectStates.get(selectId)
}
