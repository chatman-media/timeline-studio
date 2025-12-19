import React from "react"

const TabsContext = React.createContext<any>(null)

export const Tabs = ({ children, defaultValue, value, onValueChange, className }: any) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue || "")

  const handleValueChange = (newValue: string) => {
    setActiveTab(newValue)
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleValueChange }} data-oid="m1bcrm-">
      <div className={className} data-default-value={defaultValue} data-value={activeTab} data-oid="qbapk:5">
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export const TabsContent = ({ children, value, className }: any) => {
  const context = React.useContext(TabsContext)
  const isActive = context?.activeTab === value

  return isActive ? (
    <div
      className={className}
      data-tab-content={value}
      role="tabpanel"
      aria-labelledby={`trigger-${value}`}
      data-state={isActive ? "active" : "inactive"}
      data-oid="sus1pj0"
    >
      {children}
    </div>
  ) : null
}

export const TabsList = ({ children, className }: any) => (
  <div className={className} role="tablist" data-oid=".5w2qau">
    {children}
  </div>
)

export const TabsTrigger = ({ children, value }: any) => {
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
      data-oid="b_qmr41"
    >
      {children}
    </button>
  )
}
