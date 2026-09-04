"use client";

import React, { useState, useRef, useEffect } from "react";

export interface DropdownItem {
  label: string;
  value: string;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-blue-500)] focus-visible:ring-offset-2 rounded"
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "end-0" : "start-0"
          } mt-2 w-56 rounded-[var(--radius-md)] bg-[var(--background)] border border-[var(--border)] shadow-[var(--shadow-lg)] ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden`}
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            {items.map((item, idx) => (
              <button
                key={idx}
                className="w-full text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--card)] hover:text-[var(--text-primary)] transition-colors duration-100 flex items-center justify-between rtl:text-right"
                role="menuitem"
                onClick={() => handleItemClick(item)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
