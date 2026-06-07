import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — the core interactive control.
 *
 * a11y rule enforced by tokens: `primary` (emerald) and `accent` (gold)
 * use navy ink (`text-on-primary` / `text-on-accent`) — never white text.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-heading font-semibold select-none",
    "transition-[background-color,box-shadow,transform,color] duration-fast ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-px",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[1.1em]",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary shadow-sm hover:bg-primary-hover active:bg-primary-active",
        accent:
          "bg-accent text-on-accent shadow-sm hover:bg-accent-hover active:bg-accent-active",
        secondary:
          "bg-ink text-ink-inverse shadow-sm hover:bg-navy-700 active:bg-navy-900",
        outline:
          "border border-line-strong bg-surface text-ink hover:bg-background-subtle hover:border-line-strong",
        ghost: "text-ink hover:bg-background-subtle",
        link: "text-primary-active underline-offset-4 hover:underline",
        destructive:
          "bg-danger text-on-danger shadow-sm hover:brightness-95 active:brightness-90",
      },
      size: {
        sm: "h-9 rounded-md px-3 text-caption",
        md: "h-11 rounded-md px-5 text-body",
        lg: "h-13 rounded-lg px-7 text-lead",
        icon: "size-11 rounded-md",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
