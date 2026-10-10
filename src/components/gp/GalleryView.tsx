"use client";

import { useEffect, useMemo } from "react";
import { PHOTOS } from "@/data/photos";
import { useGpStore } from "@/lib/store";
import { groupByDay, type AnyPhoto } from "@/lib/photo-utils";
import { JustifiedGrid } from "./JustifiedGrid";
import { MarqueeArea } from "./Marquee";
import { Msr } from "./Msr";

export function GalleryView() {
  const uploads = useGpStore((s) => s.uploads);
  const trashed = useGpStore((s) => s.trashed);
  const archived = useGpStore((s) => s.archived);
  const selected = useGpStore((s) => s.selected);
  const selectionMode = useGpStore((s) => s.selectionMode);
  const togglePhotoSelection = useGpStore((s) => s.togglePhotoSelection);
  const openLightbox = useGpStore((s) => s.openLightbox);
  const setVisibleIds = useGpStore((s) => s.setVisibleIds);

  const photos = useMemo(() => {
    const gone = new Set([...trashed, ...archived]);
    return ([...uploads, ...PHOTOS] as AnyPhoto[])
      .filter((p) => !gone.has(p.id))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [uploads, trashed, archived]);

  const months = useMemo(() => groupByDay(photos), [photos]);

  useEffect(() => {
    setVisibleIds(photos.map((p) => p.id));
  }, [photos, setVisibleIds]);

  const currentMonthKey = new Date().toISOString().slice(0, 7);

  const openPhoto = (photo: AnyPhoto, _dayContext: AnyPhoto[]) => {
    // lightbox navigates the whole gallery timeline, not just the day group
    const ids = photos.map((p) => p.id);
    openLightbox(ids, ids.indexOf(photo.id));
  };

  if (photos.length === 0) {
    return (
      <EmptyState
        icon="photo_library"
        title="Your memories will appear here"
        subtitle="Upload photos to get started"
      />
    );
  }

  return (
    <MarqueeArea className="pb-8">
      {({ suppressClick }) => (
        <>
          {months.map((m) => (
            <section key={m.key} aria-label={m.label}>
              {m.key !== currentMonthKey && (
                <div className="px-4 pb-1 pt-6 text-[20px] font-medium text-gp-text">
                  {m.label}
                </div>
              )}
              {m.days.map((d) => (
                <div key={d.date} className="pt-2">
                  {/* sticky date header — pins while the day scrolls past */}
                  <div className="sticky top-0 z-10 bg-gp-bg px-4 py-2">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[14px] font-medium text-gp-text">
                        {d.label}
                      </span>
                      <span className="text-[12px] text-gp-text2">
                        {d.photos.length}{" "}
                        {d.photos.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>
                  <JustifiedGrid
                    photos={d.photos}
                    selected={selected}
                    selectionMode={selectionMode}
                    onOpen={openPhoto}
                    onToggle={togglePhotoSelection}
                    suppressClick={suppressClick}
                  />
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </MarqueeArea>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <Msr name={icon} className="text-[64px] text-gp-text2/50" />
      <div className="text-[20px] text-gp-text">{title}</div>
      {subtitle && (
        <div className="max-w-[420px] text-[14px] text-gp-text2">{subtitle}</div>
      )}
      {action}
    </div>
  );
}
