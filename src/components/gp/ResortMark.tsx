"use client";

import { cn } from "@/lib/utils";

/**
 * Resort product mark — a sun rising over twin peaks inside a rounded
 * gradient tile.
 */
export function ResortMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-label="Resort logo"
      role="img"
    >
      <defs>
        <linearGradient id="resort-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#19b8c4" />
          <stop offset="1" stopColor="#1a73e8" />
        </linearGradient>
      </defs>
      {/* tile */}
      <rect x="1" y="1" width="22" height="22" rx="6.5" fill="url(#resort-tile)" />
      {/* sun */}
      <circle cx="8.1" cy="7.4" r="2.1" fill="#ffffff" />
      {/* twin peaks */}
      <path
        d="M3.9 18.1 L9.6 10.9 L12.9 14.3 L15.7 11.4 L20.1 18.1 Z"
        fill="#ffffff"
      />
      {/* subtle waterline */}
      <rect x="5.2" y="19.3" width="13.6" height="1.2" rx="0.6" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
