import { useState, createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType>({
  activeTab: "",
  setActiveTab: () => {},
});

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex border-b border-gray-200 gap-1", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  onClick,
}: {
  value: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => {
        setActiveTab(value);
        onClick?.();
      }}
      data-active={isActive}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-text-secondary hover:text-text-primary",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return <div className={cn("pt-4", className)}>{children}</div>;
}
