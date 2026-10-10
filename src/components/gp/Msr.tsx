"use client";

import { ICONS, type IconName } from "@/data/icon-codepoints";
import { cn } from "@/lib/utils";

/**
 * Material Symbols Rounded icon — rendered from the locally-subset font
 * via PUA codepoints (no external CDN dependency).
 */
export function Msr({
  name,
  className,
  fill,
  style,
  size,
}: {
  name: IconName | string;
  className?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  size?: number;
}) {
  const cp = (ICONS as Record<string, number>)[name as string];
  return (
    <span
      aria-hidden="true"
      className={cn("msr", fill && "msr-fill", className)}
      style={{ ...(size ? { fontSize: size } : {}), ...style }}
    >
      {cp !== undefined ? String.fromCodePoint(cp) : "\uFFFD"}
    </span>
  );
}
