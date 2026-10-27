// Adapted from EasyUI's Button (MIT, see THIRD_PARTY.md). The variants are the
// three buttons in the Bagl brand reference: Ink ("Get started"), outlined
// ("Documentation") and Toast ("Examples"), plus a quiet one for toolbars.
import React, { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTransitions } from "@/lib/motion-tokens";

export type ButtonVariant = "primary" | "outline" | "accent" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-text text-bg border border-text hover:bg-[color-mix(in_oklch,var(--text),var(--bg)_15%)]",
  outline: "bg-transparent text-text border border-text hover:bg-line-soft",
  accent: "bg-accent text-on-accent border border-accent hover:bg-[color-mix(in_oklch,var(--accent),var(--ink)_10%)]",
  ghost: "bg-transparent text-text border border-transparent hover:bg-line-soft",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 text-sm gap-1.5",
  md: "min-h-10 px-4 text-[0.9375rem] gap-2",
  lg: "min-h-12 px-6 text-base gap-2.5",
};

export const buttonClass = (variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) =>
  cn(
    "relative inline-flex items-center justify-center rounded-sm font-semibold no-underline select-none",
    "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading = false, leftIcon, rightIcon, disabled, className, children, type = "button", ...props }, ref) => {
    const isDisabled = disabled || isLoading;
    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        transition={motionTransitions.springSnappy}
        aria-busy={isLoading || undefined}
        className={buttonClass(variant, size, className)}
        {...props}
      >
        {isLoading ? <Loader2 aria-hidden className="size-4 flex-none animate-spin motion-reduce:animate-none" /> : leftIcon ? <span className="flex-none">{leftIcon}</span> : null}
        {children ? <span>{children}</span> : null}
        {!isLoading && rightIcon ? <span className="flex-none">{rightIcon}</span> : null}
      </motion.button>
    );
  },
);
Button.displayName = "Button";

/** The same look on a link, for "Get started" and the like. */
export function ButtonLink({ variant = "primary", size = "md", className, children, ...props }: React.ComponentProps<"a"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <motion.a whileTap={{ scale: 0.97 }} transition={motionTransitions.springSnappy} className={buttonClass(variant, size, className)} {...(props as HTMLMotionProps<"a">)}>
      {children}
    </motion.a>
  );
}
