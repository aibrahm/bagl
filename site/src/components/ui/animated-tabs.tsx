// Adapted from EasyUI's AnimatedTabs (MIT, see THIRD_PARTY.md). Here it is a
// row of toggle buttons (the playground's example picker): the selected one has
// aria-pressed, and a Toast-outlined indicator slides to it. The row scrolls
// sideways on a narrow screen.
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTransitions } from "@/lib/motion-tokens";

export interface TabItem {
  id: string;
  label: string;
}

export interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string | null;
  onChange: (tabId: string) => void;
  label: string;
  className?: string;
}

export function AnimatedTabs({ tabs, activeTab, onChange, label, className }: AnimatedTabsProps) {
  const indicator = `tab-indicator-${React.useId()}`;
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex items-center gap-1 overflow-x-auto overscroll-x-contain p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex-none whitespace-nowrap rounded-sm px-3 py-1.5 text-sm transition-colors duration-150 active:opacity-70",
              isActive ? "font-semibold text-text" : "text-muted hover:text-text",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={indicator}
                aria-hidden
                className="absolute inset-0 rounded-sm border border-accent bg-[color-mix(in_oklch,var(--accent)_14%,transparent)]"
                transition={motionTransitions.springMorph}
              />
            )}
            <span className="relative">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
