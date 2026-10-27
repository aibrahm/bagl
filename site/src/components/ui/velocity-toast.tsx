// Adapted from EasyUI's VelocityToast (MIT, see THIRD_PARTY.md): it enters
// with a spring, its progress bar pauses while the pointer is on it, and it
// closes itself. Restyled as an Ink panel with a Toast progress bar.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, X } from "lucide-react";
import { motionTransitions } from "@/lib/motion-tokens";

export interface VelocityToastProps {
  open: boolean;
  onDismiss: () => void;
  title: string;
  duration?: number;
}

export function VelocityToast({ open, onDismiss, title, duration = 3000 }: VelocityToastProps) {
  const [paused, setPaused] = useState(false);
  const progress = useMotionValue(100);
  const width = useTransform(progress, (v) => `${v}%`);
  const remaining = useRef(duration);

  useEffect(() => {
    if (open) {
      remaining.current = duration;
      progress.set(100);
    }
  }, [open, duration, progress]);

  useEffect(() => {
    if (!open || paused) return;
    const start = performance.now() - (duration - remaining.current);
    let frame = 0;
    const tick = () => {
      const left = Math.max(0, duration - (performance.now() - start));
      remaining.current = left;
      progress.set(Math.pow(left / duration, 1.05) * 100);
      if (left <= 0) onDismiss();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, paused, duration, progress, onDismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] z-50 flex justify-center px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={motionTransitions.springSnappy}
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
            className="code-surface pointer-events-auto relative flex min-w-[16rem] max-w-md items-center gap-3 overflow-clip rounded-sm py-3 ps-3 pe-2 shadow-lg"
          >
            <span className="grid size-7 flex-none place-items-center rounded-sm bg-accent text-on-accent">
              <Check aria-hidden className="size-4" />
            </span>
            <p className="flex-1 text-sm font-semibold">{title}</p>
            <button type="button" onClick={onDismiss} aria-label="Close the message" className="grid size-8 flex-none place-items-center rounded-sm text-muted hover:text-text active:opacity-70">
              <X aria-hidden className="size-4" />
            </button>
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-line">
              <motion.span className="block h-full bg-accent" style={{ width }} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
