"use client";

import React, { useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  activeTabId,
  onTabChange,
  className = "",
}) => {
  const [localActiveTab, setLocalActiveTab] = useState(
    defaultTabId || tabs[0]?.id,
  );

  const isControlled = activeTabId !== undefined;
  const activeTab = isControlled ? activeTabId : localActiveTab;

  const handleTabClick = (tabId: string) => {
    if (!isControlled) {
      setLocalActiveTab(tabId);
    }
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Tabs Header */}
      <div className="border-b border-[var(--border)]">
        <nav className="-mb-px flex gap-8" aria-label="Tabs" role="tablist">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;

            const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
              if (e.key === "ArrowRight") {
                const nextTab = tabs[index + 1] || tabs[0];
                handleTabClick(nextTab.id);
                document.getElementById(`tab-${nextTab.id}`)?.focus();
              } else if (e.key === "ArrowLeft") {
                const prevTab = tabs[index - 1] || tabs[tabs.length - 1];
                handleTabClick(prevTab.id);
                document.getElementById(`tab-${prevTab.id}`)?.focus();
              }
            };

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabClick(tab.id)}
                onKeyDown={handleKeyDown}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent-600)] ${
                  isActive
                    ? "border-[var(--color-accent-600)] text-[var(--color-accent-600)] font-semibold"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tabs Content */}
      <div className="mt-6">
        {tabs.map((tab) => {
          if (tab.id !== activeTab) return null;
          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              tabIndex={0}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};
