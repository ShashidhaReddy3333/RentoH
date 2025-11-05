import clsx from "clsx";
import React, {
  Children,
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState
} from "react";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  tabsId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProps = {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
};

export function Tabs({ value, defaultValue, onValueChange, className, children }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const tabsId = useId();
  const currentValue = value ?? internalValue;

  const handleChange = useCallback(
    (next: string) => {
      if (value === undefined) {
        setInternalValue(next);
      }
      onValueChange?.(next);
    },
    [value, onValueChange]
  );

  const contextValue = useMemo(
    () => ({
      value: currentValue,
      setValue: handleChange,
      tabsId
    }),
    [currentValue, handleChange, tabsId]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={clsx("flex flex-col gap-4", className)} data-tabs-root="">
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`<${component}> must be used within <Tabs>`);
  }
  return context;
}

type TabsListProps = {
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
};

export function TabsList({ className, children, "aria-label": ariaLabel }: TabsListProps) {
  const { tabsId } = useTabsContext("TabsList");
  const count = Children.count(children);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx(
        "relative flex flex-wrap gap-2 rounded-lg bg-surface-muted/70 p-1.5 sm:grid sm:auto-cols-fr sm:grid-flow-col",
        className
      )}
      data-tab-count={count}
      id={`${tabsId}-tablist`}
    >
      {children}
    </div>
  );
}

type TabsTriggerProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
};

export function TabsTrigger({ value, children, className, icon }: TabsTriggerProps) {
  const { value: active, setValue, tabsId } = useTabsContext("TabsTrigger");
  const isActive = active === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${tabsId}-tab-${value}`}
      aria-controls={`${tabsId}-panel-${value}`}
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => setValue(value)}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted",
        isActive
          ? "bg-white text-brand-blue shadow-sm"
          : "text-ink-muted hover:text-brand-blue hover:bg-white/60",
        className
      )}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  );
}

type TabsContentProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
};

export function TabsContent({ value, className, children }: TabsContentProps) {
  const { value: active, tabsId } = useTabsContext("TabsContent");
  const isActive = active === value;

  return (
    <div
      role="tabpanel"
      id={`${tabsId}-panel-${value}`}
      aria-labelledby={`${tabsId}-tab-${value}`}
      hidden={!isActive}
      className={clsx("focus-visible:outline-none", className)}
      tabIndex={0}
    >
      {isActive ? children : null}
    </div>
  );
}
