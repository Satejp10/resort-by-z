"use client";

import { useMemo, useState } from "react";
import { useGpStore } from "@/lib/store";
import {
  computeJustifiedRows,
  targetRowHeight,
  useContainerWidth,
  type AnyPhoto,
} from "@/lib/photo-utils";
import { Msr } from "./Msr";

interface TileProps {
  photo: AnyPhoto;
  widthPx: number;
  selected: boolean;
  selectionMode: boolean;
  onOpen: (photo: AnyPhoto) => void;
  onToggle: (id: string) => void;
  trashMode?: boolean;
  onRestore?: (id: string) => void;
  onDeleteForever?: (id: string) => void;
  suppressClick?: () => boolean;
}

function PhotoTile({
  photo,
  widthPx,
  selected,
  selectionMode,
  onOpen,
  onToggle,
  trashMode,
  onRestore,
  onDeleteForever,
  suppressClick,
}: TileProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      data-photo-id={photo.id}
      className="group relative shrink-0 overflow-hidden bg-gp-chip"
      style={{ width: widthPx }}
    >
      <img
        src={photo.thumb}
        alt={photo.desc}
        width={photo.w}
        height={photo.h}
        loading="lazy"
        decoding="async"
        draggable={false}
        ref={(el) => {
          if (el?.complete) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        className={`block h-full w-full cursor-pointer select-none object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => {
          if (suppressClick?.()) return;
          if (selectionMode) onToggle(photo.id);
          else onOpen(photo);
        }}
      />

      {/* selection tint */}
      {selected && (
        <div className="pointer-events-none absolute inset-0 bg-gp-blue/30" />
      )}

      {/* checkmark circle (not shown in trash view) */}
      {!trashMode && (
        <button
          aria-label={selected ? "Deselect photo" : "Select photo"}
          className={`absolute left-1.5 top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border transition-opacity ${
            selected
              ? "border-gp-blue bg-gp-blue opacity-100"
              : "border-white/70 bg-white/90 opacity-0 group-hover:opacity-100 focus:opacity-100"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(photo.id);
          }}
        >
          {selected ? (
            <Msr name="check" className="text-[15px] text-white" />
          ) : (
            <span className="h-[9px] w-[9px] rounded-full border border-black/40 bg-transparent" />
          )}
        </button>
      )}

      {/* trash hover actions */}
      {trashMode && onRestore && onDeleteForever && (
        <div className="absolute bottom-1.5 right-1.5 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            aria-label="Restore photo"
            title="Restore"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gp-text shadow hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onRestore(photo.id);
            }}
          >
            <Msr name="restore_from_trash" className="text-[20px]" />
          </button>
          <button
            aria-label="Delete forever"
            title="Delete forever"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#d93025] shadow hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteForever(photo.id);
            }}
          >
            <Msr name="delete_forever" className="text-[20px]" />
          </button>
        </div>
      )}
    </div>
  );
}

interface GridProps {
  photos: AnyPhoto[];
  selected: string[];
  selectionMode: boolean;
  onOpen: (photo: AnyPhoto, context: AnyPhoto[]) => void;
  onToggle: (id: string) => void;
  trashMode?: boolean;
  onRestore?: (id: string) => void;
  onDeleteForever?: (id: string) => void;
  suppressClick?: () => boolean;
}

/**
 * Justified grid — rows with a target height, photos scaled
 * by aspect ratio to fill the row width exactly.
 */
export function JustifiedGrid({
  photos,
  selected,
  selectionMode,
  onOpen,
  onToggle,
  trashMode,
  onRestore,
  onDeleteForever,
  suppressClick,
}: GridProps) {
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const density = useGpStore((s) => s.density);
  const targetH = targetRowHeight(width, density);
  const rows = useMemo(
    () => computeJustifiedRows(photos, width, targetH),
    [photos, width, targetH]
  );

  return (
    <div ref={ref} className="w-full" style={{ minHeight: 1 }}>
      {rows.map((row, ri) => (
        <div
          key={ri}
          className="flex gap-[3px] pb-[3px]"
          style={{ height: Math.floor(row.height) }}
        >
          {row.photos.map((p) => (
            <PhotoTile
              key={p.id}
              photo={p}
              widthPx={(p.w / p.h) * row.height}
              selected={selected.includes(p.id)}
              selectionMode={selectionMode}
              onOpen={(photo) => onOpen(photo, photos)}
              onToggle={onToggle}
              trashMode={trashMode}
              onRestore={onRestore}
              onDeleteForever={onDeleteForever}
              suppressClick={suppressClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
