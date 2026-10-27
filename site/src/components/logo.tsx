import { SYMBOL, SYMBOL_SMALL, SYMBOL_TRANSFORM, WORDMARK, WORDMARK_TRANSFORM } from "@/brand/paths";
import { cn } from "@/lib/utils";

// The brand kit's logo drawn inline, so it follows the theme: a Toast bagel and
// an Ink wordmark on Cream, and all Cream on dark surfaces (the kit's rule).
// The viewBox is cropped to the artwork; the clear space comes from the layout.
const SYMBOL_FILL = "light-dark(var(--toast), var(--cream))";

export function Logo({ className, title = "Bagl" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="32 32 547 204" role="img" aria-label={title} className={cn("h-auto", className)}>
      <path transform={SYMBOL_TRANSFORM} fillRule="evenodd" d={SYMBOL} style={{ fill: SYMBOL_FILL }} />
      <g transform={WORDMARK_TRANSFORM} fill="currentColor">
        {WORDMARK.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** The bagel alone. Use `small` (no seeds) at 16 to 24 px. */
export function BagelMark({ className, small = false, label }: { className?: string; small?: boolean; label?: string }) {
  return (
    <svg viewBox="26 26 204 204" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={className}>
      <path fillRule="evenodd" d={small ? SYMBOL_SMALL : SYMBOL} style={{ fill: SYMBOL_FILL }} />
    </svg>
  );
}
