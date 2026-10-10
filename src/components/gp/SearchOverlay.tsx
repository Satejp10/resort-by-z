"use client";

import { useEffect, useMemo, useRef } from "react";
import { PHOTOS } from "@/data/photos";
import { SEARCH_CHIPS } from "@/data/albums";
import { useGpStore } from "@/lib/store";
import { matchesQuery, type AnyPhoto } from "@/lib/photo-utils";
import { JustifiedGrid } from "./JustifiedGrid";
import { Msr } from "./Msr";

export function SearchOverlay() {
  const open = useGpStore((s) => s.searchOpen);
  const query = useGpStore((s) => s.searchQuery);
  const setSearchQuery = useGpStore((s) => s.setSearchQuery);
  const closeSearch = useGpStore((s) => s.closeSearch);
  const uploads = useGpStore((s) => s.uploads);
  const trashed = useGpStore((s) => s.trashed);
  const selected = useGpStore((s) => s.selected);
  const selectionMode = useGpStore((s) => s.selectionMode);
  const togglePhotoSelection = useGpStore((s) => s.togglePhotoSelection);
  const openLightbox = useGpStore((s) => s.openLightbox);
  const setView = useGpStore((s) => s.setView);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeSearch]);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const gone = new Set(trashed);
    return ([...uploads, ...PHOTOS] as AnyPhoto[])
      .filter((p) => !gone.has(p.id) && matchesQuery(p, query))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [query, uploads, trashed]);

  if (!open) return null;

  const openPhoto = (photo: AnyPhoto, context: AnyPhoto[]) => {
    const ids = context.map((p) => p.id);
    openLightbox(ids, ids.indexOf(photo.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gp-bg">
      {/* search bar row */}
      <div className="flex h-16 shrink-0 items-center gap-2 px-2 sm:px-4">
        <button
          className="gp-icon-btn"
          aria-label="Close search"
          onClick={closeSearch}
        >
          <Msr name="arrow_back" className="text-[24px]" />
        </button>
        <div className="flex h-12 flex-1 items-center gap-3 rounded-full bg-gp-chip px-4 md:max-w-[840px]">
          <Msr name="search" className="text-[22px] text-gp-text2" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                setView({ type: "search-results", query: query.trim() });
                closeSearch();
              }
            }}
            placeholder="Search your photos…"
            className="h-full flex-1 bg-transparent text-[16px] text-gp-text placeholder:text-gp-text2 focus:outline-none"
            aria-label="Search your photos"
          />
          {query && (
            <button
              className="gp-icon-btn !h-8 !w-8"
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
            >
              <Msr name="close" className="text-[20px]" />
            </button>
          )}
        </div>
      </div>

      {/* chips */}
      <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-6">
        <span className="mr-1 flex h-8 items-center text-[13px] text-gp-text2">
          Try:
        </span>
        {SEARCH_CHIPS.map((c) => (
          <button
            key={c.label}
            className="h-8 rounded-full bg-gp-chip px-4 text-[14px] text-gp-text hover:bg-gp-hover"
            onClick={() => setSearchQuery(c.label)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* live results */}
      <div className="flex-1 overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {query.trim().length >= 2 ? (
          results.length > 0 ? (
            <>
              <div className="px-4 pb-2 pt-1 text-[14px] font-medium text-gp-text2 sm:px-6">
                {results.length} {results.length === 1 ? "result" : "results"}
              </div>
              <JustifiedGrid
                photos={results}
                selected={selected}
                selectionMode={selectionMode}
                onOpen={openPhoto}
                onToggle={togglePhotoSelection}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 pt-24 text-center">
              <Msr name="search" className="text-[56px] text-gp-text2/40" />
              <div className="text-[18px] text-gp-text">No results</div>
              <div className="text-[14px] text-gp-text2">
                Try different keywords — people, places, or things
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-2 pt-20 text-center">
            <Msr name="search" className="text-[72px] text-gp-text2/40" />
            <div className="text-[20px] text-gp-text">
              Search your memories
            </div>
            <div className="max-w-[420px] text-[14px] text-gp-text2">
              Find photos by what&apos;s in them — places, pets, food and more
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
