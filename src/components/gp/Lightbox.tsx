"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useGpStore, photoById } from "@/lib/store";
import { fullDateTime, type AnyPhoto } from "@/lib/photo-utils";
import { Msr } from "./Msr";
import { ResortMark } from "./ResortMark";
import { downloadPhotos } from "./GpHeader";
import { ConfirmDialog } from "./ConfirmDialog";

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 px-5 py-2.5">
      <Msr name={icon} className="mt-0.5 text-[20px] text-gp-text2" />
      <div className="min-w-0 flex-1">
        {label && (
          <div className="text-[12px] text-gp-text2">{label}</div>
        )}
        <div className="break-words text-[14px] text-gp-text">{children}</div>
      </div>
    </div>
  );
}

export function Lightbox() {
  const lightbox = useGpStore((s) => s.lightbox);
  const closeLightbox = useGpStore((s) => s.closeLightbox);
  const navigateLightbox = useGpStore((s) => s.navigateLightbox);
  const setLightboxIndex = useGpStore((s) => s.setLightboxIndex);
  const infoOpen = useGpStore((s) => s.infoOpen);
  const setInfoOpen = useGpStore((s) => s.setInfoOpen);
  const favorites = useGpStore((s) => s.favorites);
  const toggleFavorite = useGpStore((s) => s.toggleFavorite);
  const trashed = useGpStore((s) => s.trashed);
  const restorePhotos = useGpStore((s) => s.restorePhotos);
  const deleteForever = useGpStore((s) => s.deleteForever);
  const trashPhotos = useGpStore((s) => s.trashPhotos);
  const uploads = useGpStore((s) => s.uploads);

  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [slideshow, setSlideshow] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const photo = useMemo<AnyPhoto | null>(() => {
    if (!lightbox) return null;
    const p = photoById(lightbox.ids[lightbox.index], uploads);
    return (p as AnyPhoto) ?? null;
  }, [lightbox, uploads]);

  const isFavorite = photo ? favorites.includes(photo.id) : false;
  const isTrashed = photo ? trashed.includes(photo.id) : false;

  const close = useCallback(() => {
    closeLightbox();
    setZoom(false);
    setOffset({ x: 0, y: 0 });
    setSlideshow(false);
    setConfirmDelete(false);
  }, [closeLightbox]);

  /* slideshow: auto-advance every 3.5s while playing */
  useEffect(() => {
    if (!slideshow || !lightbox) return;
    const t = window.setTimeout(() => navigateLightbox(1), 3500);
    return () => window.clearTimeout(t);
  }, [slideshow, lightbox, lightbox?.index, navigateLightbox]);

  /* keyboard navigation */
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          if (infoOpen) setInfoOpen(false);
          else close();
          break;
        case "ArrowRight":
          e.preventDefault();
          navigateLightbox(1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          navigateLightbox(-1);
          break;
        case "i":
        case "I":
          setInfoOpen(!infoOpen);
          break;
        case "f":
        case "F":
          if (photo) toggleFavorite(photo.id);
          break;
        case " ":
          e.preventDefault();
          setSlideshow((v) => !v);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, infoOpen, close, navigateLightbox, setInfoOpen, photo, toggleFavorite]);

  /* reset zoom when the photo changes (adjust state during render) */
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  if (lightbox && prevIndex !== lightbox.index) {
    setPrevIndex(lightbox.index);
    setZoom(false);
    setOffset({ x: 0, y: 0 });
  }

  /* filmstrip auto-scroll */
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(
      `[data-idx="${lightbox?.index}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [lightbox?.index, lightbox?.ids.length]);

  if (!lightbox || !photo) return null;

  const n = lightbox.ids.length;
  const date = new Date(photo.date);
  const dateText = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const onImgClick = (e: React.MouseEvent) => {
    if (zoom) {
      setZoom(false);
      setOffset({ x: 0, y: 0 });
      return;
    }
    if (slideshow) setSlideshow(false);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ox = ((e.clientX - rect.left) / rect.width) * 100;
    const oy = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${ox}% ${oy}%`);
    setZoom(true);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!zoom) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    setOffset({ x: e.clientX - drag.x, y: e.clientY - drag.y });
  };
  const onPointerUp = () => setDrag(null);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-gp-viewer"
      role="dialog"
      aria-label="Photo viewer"
    >
      {/* top bar */}
      <div className="flex h-16 shrink-0 items-center px-2 sm:px-4">
        <button className="gp-icon-btn" onClick={close} aria-label="Close viewer">
          <Msr name="arrow_back" className="text-[24px]" />
        </button>
        <div className="ml-2 min-w-0">
          <div className="truncate text-[14px] font-medium text-gp-text">
            {dateText}
          </div>
          {photo.location && (
            <div className="truncate text-[12px] text-gp-text2">
              {photo.location}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center">
          <button
            className="gp-icon-btn hidden sm:inline-flex"
            aria-label="Cast"
            onClick={() => toast("No cast devices found")}
          >
            <Msr name="cast" className="text-[22px]" />
          </button>
          <button
            className={`gp-icon-btn ${infoOpen ? "bg-gp-hover" : ""}`}
            aria-label="Toggle info panel"
            aria-pressed={infoOpen}
            onClick={() => setInfoOpen(!infoOpen)}
          >
            <Msr name="info" className="text-[22px]" />
          </button>
          <button
            className={`gp-icon-btn ${slideshow ? "text-gp-blue" : ""}`}
            aria-label={slideshow ? "Pause slideshow" : "Play slideshow"}
            aria-pressed={slideshow}
            title={slideshow ? "Pause slideshow (Space)" : "Play slideshow (Space)"}
            onClick={() => setSlideshow((v) => !v)}
          >
            <Msr name={slideshow ? "pause" : "slideshow"} className="text-[22px]" />
          </button>
          <button
            className="gp-icon-btn"
            aria-label="Download"
            title="Download"
            onClick={() => downloadPhotos([photo.id])}
          >
            <Msr name="download" className="text-[22px]" />
          </button>
          <button
            className="gp-icon-btn"
            aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
            onClick={() => {
              toggleFavorite(photo.id);
              toast(
                isFavorite ? "Removed from favorites" : "Added to favorites"
              );
            }}
          >
            <Msr
              name="favorite"
              fill={isFavorite}
              className={`text-[22px] ${isFavorite ? "text-[#d93025]" : ""}`}
            />
          </button>
          <button
            className="gp-icon-btn"
            aria-label="Share"
            onClick={() => toast("Photo link copied to clipboard")}
          >
            <Msr name="share" className="text-[22px]" />
          </button>
          <button
            className="gp-icon-btn"
            aria-label="More actions"
            onClick={() => {
              if (!isTrashed) {
                trashPhotos([photo.id]);
                toast("Moved to trash", {
                  action: { label: "Undo", onClick: () => restorePhotos([photo.id]) },
                });
              }
            }}
            title={isTrashed ? "Already in trash" : "Move to trash"}
          >
            <Msr
              name="delete"
              className={`text-[22px] ${isTrashed ? "text-gp-text2/50" : ""}`}
            />
          </button>
        </div>
      </div>

        {/* main area */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <img
          key={photo.id}
          src={photo.file}
          alt={photo.desc}
          draggable={false}
          onClick={onImgClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`gp-fade-in max-h-full max-w-full select-none object-contain ${
            zoom ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
          }`}
          style={{
            transform: `scale(${zoom ? 2.5 : 1}) translate(${offset.x / (zoom ? 2.5 : 1)}px, ${offset.y / (zoom ? 2.5 : 1)}px)`,
            transformOrigin: origin,
            transition: drag ? "none" : "transform 0.22s ease-out",
          }}
        />

        {n > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-gp-text2 hover:bg-gp-hover"
              aria-label="Previous photo"
              onClick={() => navigateLightbox(-1)}
            >
              <Msr name="chevron_left" className="text-[30px]" />
            </button>
            <button
              className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-gp-text2 hover:bg-gp-hover"
              aria-label="Next photo"
              onClick={() => navigateLightbox(1)}
            >
              <Msr name="chevron_right" className="text-[30px]" />
            </button>
          </>
        )}

        {/* trash-mode actions */}
        {isTrashed && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3 gp-slide-up">
            <button
              className="h-10 rounded-full bg-gp-blue px-5 text-[14px] font-medium text-white hover:bg-gp-blue-hover"
              onClick={() => {
                restorePhotos([photo.id]);
                toast("Item restored");
              }}
            >
              Restore
            </button>
            <button
              className="h-10 rounded-full border border-gp-divider bg-gp-surface px-5 text-[14px] text-[#d93025] hover:bg-gp-hover"
              onClick={() => setConfirmDelete(true)}
            >
              Delete forever
            </button>
          </div>
        )}
      </div>

      {/* filmstrip */}
      <div className="fade-x flex h-[76px] shrink-0 items-center gap-1 overflow-x-auto px-4">
        <div ref={stripRef} className="mx-auto flex items-center gap-1">
          {lightbox.ids.map((id, i) => {
            const p = photoById(id, uploads) as AnyPhoto | undefined;
            if (!p) return null;
            const active = i === lightbox.index;
            return (
              <button
                key={id}
                data-idx={i}
                onClick={() => setLightboxIndex(i)}
                className={`h-[52px] shrink-0 overflow-hidden rounded-[3px] transition-opacity ${
                  active ? "opacity-100" : "opacity-55 hover:opacity-90"
                }`}
                style={{ width: (p.w / p.h) * 52 }}
                aria-label={`View photo ${i + 1}`}
              >
                <img
                  src={p.thumb}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className={`h-full w-full object-cover ${
                    active ? "ring-2 ring-gp-blue" : ""
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* info panel — full-height sheet; on phones it covers ~92vw */}
      {infoOpen && (
        <aside
          className="gp-zoom-in absolute bottom-0 right-0 top-0 z-10 flex w-[92vw] max-w-[360px] flex-col border-l border-gp-divider bg-gp-surface pb-[env(safe-area-inset-bottom)]"
          aria-label="Photo details"
        >
          <div className="flex h-14 shrink-0 items-center justify-between px-4">
            <span className="text-[16px] font-medium text-gp-text">Details</span>
            <button
              className="gp-icon-btn !h-9 !w-9"
              aria-label="Close details"
              onClick={() => setInfoOpen(false)}
            >
              <Msr name="close" className="text-[20px]" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pb-6">
            <div className="px-5 pb-4">
              <img
                src={photo.thumb}
                alt={photo.desc}
                className="w-full rounded-lg"
              />
              {photo.desc && (
                <div className="mt-3 text-[14px] text-gp-text">{photo.desc}</div>
              )}
            </div>
            <InfoRow icon="schedule" label="Date">
              {fullDateTime(photo.date)}
            </InfoRow>
            <InfoRow icon="photo_camera" label="Camera">
              <div>{photo.camera}</div>
              {photo.exif && (
                <div className="mt-0.5 text-[13px] text-gp-text2">{photo.exif}</div>
              )}
            </InfoRow>
            <InfoRow icon="image" label="Details">
              {photo.w} × {photo.h} · {((photo.w * photo.h) / 1e6).toFixed(1)} MP
            </InfoRow>
            {photo.filename && (
              <InfoRow icon="tag" label="File name">
                {photo.filename}
              </InfoRow>
            )}
            {photo.location && (
              <div className="px-5 py-2.5">
                <div className="mb-2 flex items-center gap-3">
                  <Msr name="place" className="text-[20px] text-[#d93025]" />
                  <div className="text-[14px] text-gp-text">{photo.location}</div>
                </div>
                {/* stylized map */}
                <div className="relative h-32 overflow-hidden rounded-lg bg-[linear-gradient(135deg,#e8f0e4_0%,#dce9f7_50%,#e6efff_100%)] dark:bg-[linear-gradient(135deg,#2b3238_0%,#262d3c_50%,#1f2833_100%)]">
                  <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(#9aa0a655_1px,transparent_1px),linear-gradient(90deg,#9aa0a655_1px,transparent_1px)] [background-size:28px_28px]" />
                  <div className="absolute left-[38%] top-[30%] h-10 w-16 rotate-12 rounded-full bg-[#c8dcf5]/60 dark:bg-[#3a4a63]/60" />
                  <div className="absolute bottom-[18%] right-[16%] h-8 w-12 -rotate-6 rounded-full bg-[#cfe6cf]/60 dark:bg-[#334539]/60" />
                  <Msr
                    name="place"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[80%] text-[32px] text-[#d93025] drop-shadow"
                  />
                </div>
              </div>
            )}
            {photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 px-5 py-3">
                {photo.tags.map((t) => (
                  <span
                    key={t}
                    className="h-7 rounded-full bg-gp-chip px-3 text-[12px] leading-7 text-gp-text"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 px-5 pt-2 text-[12px] text-gp-text2/70">
              <ResortMark size={14} /> Backed up · Resort sync
            </div>
          </div>
        </aside>
      )}

      {/* delete-forever confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete permanently?"
        description="This item will be deleted forever and can't be restored."
        confirmLabel="Delete forever"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          const wasFirst = lightbox.index === 0;
          deleteForever([photo.id]);
          if (n <= 1) close();
          else if (wasFirst) setLightboxIndex(0);
          else setLightboxIndex(lightbox.index - 1);
          toast("Item deleted forever");
        }}
      />
    </div>
  );
}
