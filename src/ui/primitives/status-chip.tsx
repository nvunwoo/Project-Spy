import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/ui/design-system/cn";

const statusChipVariants = cva(
  "inline-flex min-h-6 items-center gap-2 rounded-[var(--ops-radius-sm)] border px-2 py-1 font-mono text-xs font-medium leading-none tracking-[0.04em] tabular-nums",
  {
    variants: {
      tone: {
        neutral:
          "border-[var(--ops-border)] bg-[var(--ops-surface-1)] text-[var(--ops-text-muted)]",
        info: "border-[color-mix(in_srgb,var(--ops-info)_55%,transparent)] bg-[color-mix(in_srgb,var(--ops-info)_12%,transparent)] text-[var(--ops-info-strong)]",
        warning:
          "border-[color-mix(in_srgb,var(--ops-warning)_60%,transparent)] bg-[color-mix(in_srgb,var(--ops-warning)_12%,transparent)] text-[var(--ops-warning)]",
        critical:
          "border-[color-mix(in_srgb,var(--ops-critical)_60%,transparent)] bg-[color-mix(in_srgb,var(--ops-critical)_12%,transparent)] text-[var(--ops-critical)]",
        success:
          "border-[color-mix(in_srgb,var(--ops-success)_60%,transparent)] bg-[color-mix(in_srgb,var(--ops-success)_12%,transparent)] text-[var(--ops-success)]",
        blue: "border-[color-mix(in_srgb,var(--team-blue)_65%,transparent)] bg-[color-mix(in_srgb,var(--team-blue)_16%,transparent)] text-[var(--ops-text)]",
        red: "border-[color-mix(in_srgb,var(--team-red)_65%,transparent)] bg-[color-mix(in_srgb,var(--team-red)_16%,transparent)] text-[var(--ops-text)]",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

type StatusChipProps = React.ComponentProps<"span"> &
  VariantProps<typeof statusChipVariants> & {
    showIndicator?: boolean;
  };

function StatusChip({
  children,
  className,
  showIndicator = true,
  tone,
  ...props
}: StatusChipProps) {
  return (
    <span
      data-slot="status-chip"
      data-tone={tone ?? "neutral"}
      className={cn(statusChipVariants({ className, tone }))}
      {...props}
    >
      {showIndicator ? (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current"
        />
      ) : null}
      {children}
    </span>
  );
}

export { StatusChip, statusChipVariants, type StatusChipProps };
