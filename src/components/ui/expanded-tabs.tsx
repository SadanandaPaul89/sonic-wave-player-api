import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  title: string;
  icon: React.ComponentType<any>;
}

interface Separator {
  type: "separator";
}

type TabItem = Tab | Separator;

interface ExpandedTabsProps {
  tabs: TabItem[];
  activeColor?: string;
  className?: string;
  onTabChange?: (index: number) => void;
  defaultActive?: number;
}

export function ExpandedTabs({ 
  tabs, 
  activeColor = "text-primary", 
  className, 
  onTabChange,
  defaultActive = 0 
}: ExpandedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultActive);

  const handleTabClick = (index: number, tab: TabItem) => {
    if ("type" in tab && tab.type === "separator") return;
    setActiveTab(index);
    onTabChange?.(index);
  };

  return (
    <div className={cn(
      "flex flex-col gap-1 p-2 bg-card rounded-lg border border-border shadow-sm min-w-[200px]",
      className
    )}>
      {tabs.map((tab, index) => {
        if ("type" in tab && tab.type === "separator") {
          return (
            <div 
              key={`separator-${index}`} 
              className="h-px bg-border my-1" 
            />
          );
        }

        const isActive = activeTab === index;
        const Icon = (tab as Tab).icon;

        return (
          <button
            key={index}
            onClick={() => handleTabClick(index, tab)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 hover:bg-accent hover:text-accent-foreground group",
              isActive 
                ? `bg-primary/10 ${activeColor} font-medium` 
                : "text-muted-foreground"
            )}
          >
            <Icon 
              className={cn(
                "h-4 w-4 transition-colors duration-200",
                isActive ? activeColor : "text-muted-foreground group-hover:text-accent-foreground"
              )} 
            />
            <span className="text-sm">{(tab as Tab).title}</span>
            {isActive && (
              <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}