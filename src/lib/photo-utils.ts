"use client";

import type { Photo } from "@/data/photos";
import type { Upload } from "@/lib/store";

export type AnyPhoto = Photo | Upload;

export function byDateDesc(a: AnyPhoto, b: AnyPhoto) {
  return b.date.localeCompare(a.date);
}

/** Format the "day" header the way the reference gallery app does. */
export function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7)
    return d.toLocaleDateString("en-US", { weekday: "long" });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(
    "en-US",
    sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }
  );
}

export function fullDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

export function monthLabel(key: string): string {
  const d = new Date(key + "-01");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export interface DayGroup {
  date: string; // YYYY-MM-DD
  label: string;
  photos: AnyPhoto[];
}

export interface MonthGroup {
  key: string;
  label: string;
  days: DayGroup[];
}

/** Group photos into months -> days, newest first. */
export function groupByDay(photos: AnyPhoto[]): MonthGroup[] {
  const sorted = [...photos].sort(byDateDesc);
  const months: MonthGroup[] = [];
  const monthIdx = new Map<string, number>();
  for (const p of sorted) {
    const mk = monthKey(p.date);
    const day = p.date.slice(0, 10);
    if (!monthIdx.has(mk)) {
      monthIdx.set(mk, months.length);
      months.push({ key: mk, label: monthLabel(mk), days: [] });
    }
    const m = months[monthIdx.get(mk)!];
    let dg = m.days.find((d) => d.date === day);
    if (!dg) {
      dg = { date: day, label: dayLabel(day + "T12:00:00"), photos: [] };
      m.days.push(dg);
    }
    dg.photos.push(p);
  }
  return months;
}

/* ---------------- justified (Flickr-style) row layout ---------------- */

export interface JustifiedRow {
  photos: AnyPhoto[];
  height: number;
  last?: boolean;
}

/**
 * Compute justified rows: photos accumulate in a row until packing them
 * to the container width brings the row height to <= targetHeight.
 * The final (partial) row fills the container width up to maxLastHeight —
 * this is what makes sparse days render large, like the reference app.
 */
export function computeJustifiedRows(
  photos: AnyPhoto[],
  containerWidth: number,
  targetHeight: number,
  gap = 3
): JustifiedRow[] {
  if (containerWidth <= 0) return [];
  const rows: JustifiedRow[] = [];
  let cur: AnyPhoto[] = [];

  const rowHeight = (list: AnyPhoto[]) => {
    const aspectSum = list.reduce((s, p) => s + p.w / p.h, 0);
    return (containerWidth - gap * (list.length - 1)) / aspectSum;
  };

  for (const p of photos) {
    cur.push(p);
    const h = rowHeight(cur);
    if (h <= targetHeight) {
      rows.push({ photos: cur, height: h });
      cur = [];
    }
  }
  if (cur.length > 0) {
    // final partial row: if it's the only row of the group (sparse day),
    // let it fill the width generously; otherwise cap proportionally
    const isOnlyRow = rows.length === 0;
    const cap = isOnlyRow ? 640 : Math.max(targetHeight * 2, targetHeight + 40);
    rows.push({
      photos: cur,
      height: Math.min(rowHeight(cur), cap),
      last: true,
    });
  }
  return rows;
}

export function targetRowHeight(
  width: number,
  density: "comfortable" | "compact" = "comfortable"
): number {
  const base =
    width >= 1280 ? 210 : width >= 900 ? 185 : width >= 640 ? 165 : 135;
  return density === "compact" ? Math.round(base * 0.72) : base;
}

/** Container width hook via ResizeObserver. */
import { useEffect, useRef, useState } from "react";

export function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/* ---------------- search ---------------- */

/**
 * Resolve a free-text query against a photo.
 *
 * ML-search extension point (planned, not yet implemented): when semantic
 * search lands — e.g. "rain", "dog on a beach" — the only change needed is
 * to grow the haystack below with new signal fields on the photo record:
 *   - `faces?: string[]`     (face-cluster names from face grouping)
 *   - `concepts?: string[]`  (scene/object labels from an image tagger)
 *   - `ocr?: string`         (text in image)
 * Keep this a single pipeline so the SearchOverlay, search-results view and
 * chips all resolve identically.
 */
export function matchesQuery(p: AnyPhoto, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return false;
  const hay = [p.desc, p.location, p.camera, ...(p.tags ?? [])]
    .join(" ")
    .toLowerCase();
  return needle.split(/\s+/).every((w) => hay.includes(w));
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} kB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
