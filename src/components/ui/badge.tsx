import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-pill border font-heading font-semibold",
    "px-3 py-0.5 text-caption leading-normal whitespace-nowrap",
    "[&_svg]:size-3.5 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "border-transparent bg-primary text-on-primary",
        accent: "border-transparent bg-accent text-on-accent",
        soft: "border-transparent bg-primary-soft text-primary-active",
        neutral: "border-line bg-background-subtle text-soft",
        outline: "border-line-strong bg-transparent text-ink",
        success: "border-transparent bg-success-bg text-emerald-700",
        warning: "border-transparent bg-warning-bg text-gold-700",
        danger: "border-transparent bg-danger-bg text-danger",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
