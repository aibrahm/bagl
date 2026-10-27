// Adapted from EasyUI's CommandMenu (MIT, see THIRD_PARTY.md): a search box
// over the docs that opens with Ctrl or Cmd + K, filters as you type, and moves
// with the arrow keys. Changed to take its items as a prop, to open in a native
// modal <dialog> (which keeps focus inside it and makes the page behind it inert),
// and to follow the combobox pattern so a screen reader announces the selected result.
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTransitions } from "@/lib/motion-tokens";

export interface CommandItem {
  id: string;
  title: string;
  group: string;
  href: string;
  keywords?: string;
}

export interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}

function score(item: CommandItem, q: string) {
  const title = item.title.toLowerCase();
  if (title.startsWith(q)) return 0;
  if (title.includes(q)) return 1;
  if ((item.keywords ?? "").toLowerCase().includes(q)) return 2;
  if (item.group.toLowerCase().includes(q)) return 3;
  return -1;
}

export function CommandMenu({ open, onClose, items }: CommandMenuProps) {
  return <AnimatePresence>{open && <Palette key="palette" onClose={onClose} items={items} />}</AnimatePresence>;
}

function Palette({ onClose, items }: Omit<CommandMenuProps, "open">) {
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const uid = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items
      .map((item, i) => ({ item, i, s: score(item, q) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => a.s - b.s || a.i - b.i)
      .map((r) => r.item);
  }, [items, query]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const before = document.activeElement as HTMLElement | null;
    d.showModal();
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", onCancel);
    return () => {
      d.removeEventListener("cancel", onCancel);
      before?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const go = (item: CommandItem | undefined) => {
    if (!item) return;
    onClose();
    window.location.assign(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (s + 1) % (results.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => (s - 1 + results.length) % (results.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[selected]);
    }
  };

  const optionId = (i: number) => `${uid}-option-${i}`;

  return (
    <dialog
      ref={dialog}
      aria-label="Search the docs"
      onClick={(e) => e.target === dialog.current && onClose()}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 pt-[min(5rem,10vh)] backdrop:bg-transparent"
    >
      <motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 bg-[color-mix(in_oklch,var(--ink)_55%,transparent)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={motionTransitions.springSnappy}
        className="relative mx-auto flex max-h-[min(32rem,80dvh)] w-[min(36rem,calc(100%-2rem))] flex-col overflow-clip rounded-sm border border-line bg-raised text-text shadow-2xl"
      >
        <div className="flex flex-none items-center gap-2.5 border-b border-line px-4 py-3">
          <Search aria-hidden className="size-4 flex-none text-muted" />
          <input
            autoFocus
            type="text"
            enterKeyHint="go"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${uid}-list`}
            aria-activedescendant={results.length ? optionId(selected) : undefined}
            aria-autocomplete="list"
            aria-label="Search the docs"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages and sections"
            className="w-full bg-transparent text-text placeholder:text-muted focus-visible:outline-none"
          />
          <kbd className="flex-none rounded-sm border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted">Esc</kbd>
        </div>
        <ul ref={list} id={`${uid}-list`} role="listbox" aria-label="Results" className="flex-1 overflow-y-auto overscroll-contain p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted">Nothing matches "{query}".</li>
          ) : (
            results.map((item, i) => {
              const isSelected = i === selected;
              return (
                <li
                  key={item.id}
                  id={optionId(i)}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => go(item)}
                  onPointerMove={() => setSelected(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm",
                    isSelected ? "bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] text-text" : "text-text",
                  )}
                >
                  <span className="min-w-0 truncate">{item.title}</span>
                  <span className="flex flex-none items-center gap-2 text-xs text-muted">
                    {item.group}
                    {isSelected && <CornerDownLeft aria-hidden className="size-3.5" />}
                  </span>
                </li>
              );
            })
          )}
        </ul>
        <div className="flex flex-none items-center gap-4 border-t border-line px-4 py-2 text-xs text-muted">
          <span>
            <kbd className="font-mono">↑ ↓</kbd> to move
          </span>
          <span>
            <kbd className="font-mono">Enter</kbd> to open
          </span>
        </div>
      </motion.div>
    </dialog>
  );
}
