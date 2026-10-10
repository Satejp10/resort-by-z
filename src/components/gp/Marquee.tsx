"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGpStore } from "@/lib/store";

interface MarqueeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Drag (marquee) selection for mouse pointers.
 * A left-button drag over the grid draws a selection rectangle and
 * live-selects every photo tile it intersects. Clicks that end a marquee
 * gesture are suppressed so the tile doesn't toggle/open afterwards.
 */
export function useMarqueeSelect(
  containerRef: React.RefObject<HTMLElement | null>,
  onIds: (ids: string[]) => void
) {
  const [rect, setRect] = useState<MarqueeRect | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const activeRef = useRef(false);
  const suppressRef = useRef(false);
  const onIdsRef = useRef(onIds);
  useEffect(() => {
    onIdsRef.current = onIds;
  }, [onIds]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const start = startRef.current;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!activeRef.current) {
        if (Math.hypot(dx, dy) < 6) return; // still a click, not a drag
        activeRef.current = true;
      }
      const r: MarqueeRect = {
        x: Math.min(start.x, e.clientX),
        y: Math.min(start.y, e.clientY),
        w: Math.abs(dx),
        h: Math.abs(dy),
      };
      setRect(r);
      const container = containerRef.current;
      if (!container) return;
      const ids: string[] = [];
      container
        .querySelectorAll<HTMLElement>("[data-photo-id]")
        .forEach((el) => {
          const b = el.getBoundingClientRect();
          if (
            b.right > r.x &&
            b.left < r.x + r.w &&
            b.bottom > r.y &&
            b.top < r.y + r.h
          ) {
            const id = el.getAttribute("data-photo-id");
            if (id) ids.push(id);
          }
        });
      onIdsRef.current(ids);
    };
    const up = () => {
      if (startRef.current === null) return;
      if (activeRef.current) {
        // the browser will still fire a click on the tile — swallow it
        suppressRef.current = true;
        window.setTimeout(() => {
          suppressRef.current = false;
        }, 120);
      }
      startRef.current = null;
      activeRef.current = false;
      setRect(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [containerRef]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || e.pointerType !== "mouse") return;
    startRef.current = { x: e.clientX, y: e.clientY };
    activeRef.current = false;
  }, []);

  const suppressClick = useCallback(() => suppressRef.current, []);

  return { rect, onPointerDown, suppressClick };
}

/**
 * Wraps a grid area with marquee selection. Render-prop receives the
 * click-suppressor that must be forwarded to JustifiedGrid.
 */
export function MarqueeArea({
  children,
  className,
}: {
  children: (api: { suppressClick: () => boolean }) => ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const selectMany = useGpStore((s) => s.selectMany);
  const { rect, onPointerDown, suppressClick } = useMarqueeSelect(
    ref,
    selectMany
  );

  return (
    <div ref={ref} className={className} onPointerDown={onPointerDown}>
      {children({ suppressClick })}
      {rect && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-30 rounded-[2px] border border-gp-blue bg-gp-blue/20"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
          }}
        />
      )}
    </div>
  );
}
