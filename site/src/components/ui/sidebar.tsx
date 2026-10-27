// Adapted from EasyUI's Sidebar (MIT, see THIRD_PARTY.md): a hover highlight
// that follows the pointer, an active highlight that slides between items, a dot
// for the active sub item, and a drawer on narrow screens that you can drag shut.
// Changed so the items are links (pages and sections of a page), and the drawer
// is a native modal <dialog>, so focus stays inside it and Esc closes it.
import * as React from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { PanelLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

const spring = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 } as const;

export type SidebarChild = { id: string; label: string; href: string };
export type SidebarItem = { id: string; label: string; href: string; children?: SidebarChild[] };
export type SidebarSection = { title?: string; items: SidebarItem[] };

export interface SidebarProps {
  sections: SidebarSection[];
  activeId: string;
  label: string;
  /** Show sub items only under the active item (for long pages). */
  collapse?: boolean;
  className?: string;
}

/** The column on wide screens. Narrow screens get SidebarDrawer instead. */
export function Sidebar({ className, ...content }: SidebarProps) {
  return (
    <aside className={cn("hidden lg:block", className)}>
      <Panel {...content} />
    </aside>
  );
}

/** A button for the header that opens the same navigation as a drawer, below the lg breakpoint. */
export function SidebarDrawer(props: SidebarProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${props.label.toLowerCase()}`}
        className="grid size-10 flex-none place-items-center rounded-sm text-text hover:bg-line-soft active:opacity-70 lg:hidden"
      >
        <PanelLeft aria-hidden className="size-5" />
      </button>
      <AnimatePresence>{open && <Drawer key="drawer" {...props} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function Drawer({ onClose, ...content }: SidebarProps & { onClose: () => void }) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    d.showModal();
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialog}
      aria-label={content.label}
      onClick={(e) => e.target === dialog.current && onClose()}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-transparent lg:hidden"
    >
      <motion.div aria-hidden className="pointer-events-none fixed inset-0 bg-[color-mix(in_oklch,var(--ink)_45%,transparent)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        className="absolute inset-y-0 start-0 flex w-[18rem] max-w-[85vw] flex-col border-e border-line bg-bg shadow-2xl"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={spring}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0 }}
        dragMomentum={false}
        onDragEnd={(_, info: PanInfo) => {
          if (info.offset.x < -80 || info.velocity.x < -400) onClose();
        }}
      >
        <div className="flex flex-none items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-2">
          <p className="text-sm font-semibold">{content.label}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-sm hover:bg-line-soft active:opacity-70">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)]">
          <Panel {...content} onNavigate={onClose} />
        </div>
      </motion.div>
    </dialog>
  );
}

function Panel({ sections, activeId, label, collapse = false, onNavigate }: SidebarProps & { onNavigate?: () => void }) {
  const uid = React.useId();
  const [hoverBox, setHoverBox] = React.useState<{ y: number; h: number } | null>(null);
  const [hovering, setHovering] = React.useState(false);
  const fine = React.useRef(false);
  React.useEffect(() => {
    fine.current = matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  const enter = (e: React.PointerEvent<HTMLElement>) => {
    if (!fine.current) return;
    const el = e.currentTarget;
    setHoverBox({ y: el.offsetTop, h: el.offsetHeight });
    setHovering(true);
  };

  return (
    <nav aria-label={label} onPointerLeave={() => setHovering(false)} className="relative px-2 py-2">
      {hoverBox && (
        <motion.span
          aria-hidden
          initial={false}
          animate={{ y: hoverBox.y, height: hoverBox.h, opacity: hovering ? 1 : 0 }}
          transition={{ y: spring, height: spring, opacity: { duration: 0.15 } }}
          className="pointer-events-none absolute inset-x-2 top-0 rounded-sm bg-line-soft"
        />
      )}
      {sections.map((section, i) => (
        <div key={i} className="space-y-0.5">
          {section.title && <p className="px-2.5 pb-1 pt-4 text-xs font-semibold text-muted first:pt-1">{section.title}</p>}
          {section.items.map((item) => {
            const isActive = activeId === item.id;
            const childActive = !!item.children?.some((c) => c.id === activeId);
            return (
              <div key={item.id}>
                <a
                  href={item.href}
                  onClick={onNavigate}
                  onPointerEnter={enter}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "relative flex min-h-9 items-center rounded-sm px-2.5 py-1.5 text-[0.9375rem] no-underline active:opacity-70",
                    isActive || childActive ? "font-semibold text-text" : "text-muted",
                  )}
                >
                  {isActive && <motion.span layoutId={`${uid}-active`} transition={spring} className="absolute inset-0 rounded-sm bg-[color-mix(in_oklch,var(--accent)_16%,transparent)]" />}
                  <span className="relative">{item.label}</span>
                </a>
                {item.children?.length && (!collapse || isActive || childActive) ? (
                  <div className="ms-[1.1rem] space-y-0.5 border-s border-line py-0.5 ps-2.5">
                    {item.children.map((c) => {
                      const active = c.id === activeId;
                      return (
                        <a
                          key={c.id}
                          href={c.href}
                          onClick={onNavigate}
                          onPointerEnter={enter}
                          aria-current={active ? "location" : undefined}
                          className={cn("relative flex min-h-8 items-center rounded-sm px-2 py-1 text-sm no-underline active:opacity-70", active ? "font-semibold text-text" : "text-muted")}
                        >
                          {active && <motion.span layoutId={`${uid}-dot`} transition={spring} className="absolute -start-[13.5px] top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-accent" />}
                          <span className="relative">{c.label}</span>
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
