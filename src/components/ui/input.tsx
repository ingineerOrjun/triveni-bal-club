import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md border border-line bg-surface px-3 py-2",
          "text-body text-ink placeholder:text-soft",
          "shadow-sm transition-[border-color,box-shadow] duration-fast ease-out",
          "outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger",
          "file:mr-3 file:border-0 file:bg-transparent file:text-caption file:font-semibold file:text-ink",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
