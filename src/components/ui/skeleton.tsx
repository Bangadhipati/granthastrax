import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "gold";
  glow?: boolean;
}

function Skeleton({
  className,
  variant = "default",
  glow = false,
  ...props
}: SkeletonProps) {
  const variantClass =
    variant === "gold"
      ? "skeleton-shimmer-gold"
      : variant === "subtle"
        ? "skeleton-shimmer-subtle"
        : "skeleton-shimmer";

  return (
    <div
      className={cn(
        "rounded-md",
        variantClass,
        glow && "shadow-[0_0_20px_-4px_oklch(0.81_0.13_84/25%)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
