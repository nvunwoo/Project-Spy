import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/ui/design-system/cn";

const buttonVariants = cva(
  "inline-flex min-h-12 min-w-12 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--ops-radius-md)] border px-4 text-[0.9375rem] font-medium leading-none transition-[background-color,border-color,color,opacity] duration-[var(--ops-duration-fast)] ease-[var(--ops-ease-standard)] outline-none focus-visible:border-[var(--ops-info-strong)] focus-visible:ring-2 focus-visible:ring-[var(--ops-info-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ops-bg)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-45 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-[var(--ops-info)] bg-[var(--ops-info)] text-[var(--ops-bg)] hover:border-[var(--ops-info-strong)] hover:bg-[var(--ops-info-strong)] active:bg-[var(--ops-info)]",
        primary:
          "border-[var(--ops-info)] bg-[var(--ops-info)] text-[var(--ops-bg)] hover:border-[var(--ops-info-strong)] hover:bg-[var(--ops-info-strong)] active:bg-[var(--ops-info)]",
        secondary:
          "border-[var(--ops-border-strong)] bg-[var(--ops-surface-2)] text-[var(--ops-text)] hover:border-[var(--ops-info)] hover:bg-[var(--ops-surface-1)]",
        outline:
          "border-[var(--ops-border-strong)] bg-transparent text-[var(--ops-text)] hover:border-[var(--ops-info)] hover:bg-[var(--ops-surface-2)]",
        ghost:
          "border-transparent bg-transparent text-[var(--ops-text-muted)] hover:bg-[var(--ops-surface-2)] hover:text-[var(--ops-text)]",
        dangerous:
          "border-[var(--ops-critical)] bg-[var(--ops-critical)] text-[var(--ops-text)] hover:border-[var(--ops-text)] hover:bg-[color-mix(in_srgb,var(--ops-critical)_88%,black)]",
        destructive:
          "border-[var(--ops-critical)] bg-[var(--ops-critical)] text-[var(--ops-text)] hover:border-[var(--ops-text)] hover:bg-[color-mix(in_srgb,var(--ops-critical)_88%,black)]",
      },
      size: {
        default: "h-12 px-4",
        wide: "h-12 min-w-36 px-6",
        icon: "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
