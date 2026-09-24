import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/ui/design-system/cn";

const panelVariants = cva(
  "overflow-hidden rounded-[var(--ops-radius-md)] border text-[var(--ops-text)]",
  {
    variants: {
      tone: {
        default: "border-[var(--ops-border)] bg-[var(--ops-surface-1)]",
        raised: "border-[var(--ops-border-strong)] bg-[var(--ops-surface-2)]",
        info: "border-[color-mix(in_srgb,var(--ops-info)_55%,var(--ops-border))] bg-[var(--ops-surface-1)]",
        warning:
          "border-[color-mix(in_srgb,var(--ops-warning)_60%,var(--ops-border))] bg-[var(--ops-surface-1)]",
        critical:
          "border-[color-mix(in_srgb,var(--ops-critical)_65%,var(--ops-border))] bg-[var(--ops-surface-1)]",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

type PanelProps = React.ComponentProps<"section"> &
  VariantProps<typeof panelVariants>;

function Panel({ className, tone, ...props }: PanelProps) {
  return (
    <section
      data-slot="panel"
      data-tone={tone ?? "default"}
      className={cn(panelVariants({ className, tone }))}
      {...props}
    />
  );
}

function PanelHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="panel-header"
      className={cn(
        "flex items-start justify-between gap-4 border-b border-[var(--ops-border)] px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

function PanelTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="panel-title"
      className={cn(
        "text-base font-semibold leading-[1.35] tracking-[-0.01em] text-[var(--ops-text)]",
        className,
      )}
      {...props}
    />
  );
}

function PanelDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="panel-description"
      className={cn(
        "text-sm leading-[1.45] text-[var(--ops-text-muted)]",
        className,
      )}
      {...props}
    />
  );
}

function PanelContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-content"
      className={cn("px-4 py-4", className)}
      {...props}
    />
  );
}

function PanelFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      data-slot="panel-footer"
      className={cn(
        "flex items-center justify-end gap-2 border-t border-[var(--ops-border)] px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Panel,
  PanelContent,
  PanelDescription,
  PanelFooter,
  PanelHeader,
  PanelTitle,
  panelVariants,
  type PanelProps,
};
