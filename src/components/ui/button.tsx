import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Button — the core interactive control.
 *
 * a11y rule enforced by tokens: `primary` (emerald) and `accent` (gold)
 * use navy ink (`text-on-primary` / `text-on-accent`) — never white text.
 * `secondary` (royal blue) and `gradient`/`destructive` use white text.
 */
const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-heading font-semibold select-none",
    "transition-[background-color,box-shadow,transform,color,opacity] duration-fast ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "hover:-translate-y-px active:translate-y-0",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[1.1em]",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary shadow-sm hover:bg-primary-hover hover:shadow-md active:bg-primary-active",
        secondary:
          "bg-secondary text-on-secondary shadow-sm hover:bg-secondary-hover hover:shadow-md active:bg-secondary-active",
        accent:
          "bg-accent text-on-accent shadow-sm hover:bg-accent-hover hover:shadow-md active:bg-accent-active",
        gradient:
          "bg-gradient-brand text-white shadow-md hover:shadow-glow [background-size:140%_140%] hover:[background-position:100%_50%] transition-[background-position,box-shadow,transform] duration-base",
        dark:
          "bg-ink text-ink-inverse shadow-sm hover:bg-navy-700 active:bg-navy-900",
        outline:
          "border border-line-strong bg-surface text-ink hover:bg-background-subtle hover:shadow-sm",
        ghost: "text-ink hover:bg-background-subtle",
        link: "text-secondary underline-offset-4 hover:underline",
        destructive:
          "bg-danger text-on-danger shadow-sm hover:brightness-95 hover:shadow-md active:brightness-90",
      },
      size: {
        sm: "h-9 rounded-button px-3 text-caption",
        md: "h-11 rounded-button px-5 text-body",
        lg: "h-13 rounded-md px-7 text-lead",
        icon: "size-11 rounded-button",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element (e.g. an <a>) while keeping button styles. */
  asChild?: boolean;
  /** Show a spinner and disable interaction. Ignored when `asChild`. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    // With asChild the child must be a single element; don't inject a spinner.
    if (asChild) {
      return (
        <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props}>
          {children}
        </Comp>
      );
    }
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
