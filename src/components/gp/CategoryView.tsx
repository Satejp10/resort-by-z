"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PHOTOS, type Photo } from "@/data/photos";
import { ALBUMS, photosWithAnyTags } from "@/data/albums";
import { useGpStore, type View } from "@/lib/store";
import { byDateDesc, matchesQuery, type AnyPhoto } from "@/lib/photo-utils";
import { JustifiedGrid } from "./JustifiedGrid";
import { MarqueeArea } from "./Marquee";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./GalleryView";
import { Msr } from "./Msr";

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      className="gp-icon-btn"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Msr name="arrow_back" className="text-[24px]" />
    </button>
  );
}

/**
 * Generic grid page used by favorites / archive / trash / album /
 * explore-category / search-results.
 */
export function CategoryView({ view }: { view: View }) {
  const uploads = useGpStore((s) => s.uploads);
  const trashed = useGpStore((s) => s.trashed);
  const archived = useGpStore((s) => s.archived);
  const favorites = useGpStore((s) => s.favorites);
  const selected = useGpStore((s) => s.selected);
  const selectionMode = useGpStore((s) => s.selectionMode);
  const togglePhotoSelection = useGpStore((s) => s.togglePhotoSelection);
  const openLightbox = useGpStore((s) => s.openLightbox);
  const setVisibleIds = useGpStore((s) => s.setVisibleIds);
  const setView = useGpStore((s) => s.setView);
  const restorePhotos = useGpStore((s) => s.restorePhotos);
  const deleteForever = useGpStore((s) => s.deleteForever);
  const unarchivePhotos = useGpStore((s) => s.unarchivePhotos);

  /* pending destructive confirmations */
  const [confirmOne, setConfirmOne] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const all = useMemo(() => [...uploads, ...PHOTOS] as AnyPhoto[], [uploads]);

  const photos = useMemo(() => {
    switch (view.type) {
      case "favorites":
        return all
          .filter((p) => favorites.includes(p.id) && !trashed.includes(p.id))
          .sort(byDateDesc);
      case "trash":
        return all.filter((p) => trashed.includes(p.id)).sort(byDateDesc);
      case "archive":
        return all.filter((p) => archived.includes(p.id)).sort(byDateDesc);
      case "album": {
        if (view.id === "__favorites__")
          return all
            .filter((p) => favorites.includes(p.id) && !trashed.includes(p.id))
            .sort(byDateDesc);
        const def = ALBUMS.find((a) => a.id === view.id);
        if (!def) return [];
        return photosWithAnyTags(def.tags).sort(byDateDesc);
      }
      case "explore-category": {
        // defined inline to avoid circular import shape issues
        const CATS: Record<string, { label: string; tags: string[] }> = {
          beaches: { label: "Beaches", tags: ["beach", "ocean", "vacation"] },
          food: {
            label: "Food & drink",
            tags: ["food", "pasta", "coffee", "cafe", "latte", "cake", "birthday", "dessert", "restaurant"],
          },
          animals: { label: "Animals", tags: ["dog", "cat", "pets", "Milo", "Luna", "animals"] },
          nature: { label: "Nature", tags: ["nature", "waterfall", "hiking", "forest", "landscape", "lake", "mountains"] },
          cities: { label: "Cities", tags: ["city", "street", "neon", "urban", "paris", "eiffel"] },
          snow: { label: "Snow", tags: ["winter", "snow", "cabin"] },
          sunsets: { label: "Sunsets", tags: ["sunset", "summer", "vacation"] },
          people: { label: "People", tags: ["friends", "people", "picnic"] },
        };
        const cat = CATS[view.id];
        return cat ? photosWithAnyTags(cat.tags).sort(byDateDesc) : [];
      }
      case "search-results":
        return all
          .filter((p) => !trashed.includes(p.id) && matchesQuery(p, view.query))
          .sort(byDateDesc);
      default:
        return [];
    }
  }, [view, all, favorites, trashed, archived]);

  useEffect(() => {
    setVisibleIds(photos.map((p) => p.id));
  }, [photos, setVisibleIds]);

  const openPhoto = (photo: AnyPhoto, context: AnyPhoto[]) => {
    const ids = context.map((p) => p.id);
    openLightbox(ids, ids.indexOf(photo.id));
  };

  const title = useMemo(() => {
    switch (view.type) {
      case "favorites":
        return "Favorites";
      case "trash":
        return "Trash";
      case "archive":
        return "Archive";
      case "album":
        return view.id === "__favorites__"
          ? "Favorites"
          : ALBUMS.find((a) => a.id === view.id)?.title ?? "Album";
      case "explore-category": {
        const CATS: Record<string, string> = {
          beaches: "Beaches",
          food: "Food & drink",
          animals: "Animals",
          nature: "Nature",
          cities: "Cities",
          snow: "Snow",
          sunsets: "Sunsets",
          people: "People",
        };
        return CATS[view.id] ?? "Category";
      }
      case "search-results":
        return `Results for “${view.query}”`;
      default:
        return "";
    }
  }, [view]);

  const back = () => {
    switch (view.type) {
      case "album":
        setView({ type: "albums" });
        break;
      case "explore-category":
        setView({ type: "explore" });
        break;
      case "search-results":
        setView({ type: "gallery" });
        break;
      default:
        setView({ type: "gallery" });
    }
  };

  const subtitle =
    view.type === "trash"
      ? "Items in trash are deleted forever after 60 days"
      : view.type === "archive"
        ? "Archived photos are hidden from your main grid"
        : undefined;

  const empty = photos.length === 0;

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-4 sm:px-6">
      <div className="mb-4 flex items-center gap-2">
        {view.type !== "favorites" && (
          <BackButton onClick={back} label="Go back" />
        )}
        <div>
          <h1 className="text-[22px] font-normal text-gp-text">{title}</h1>
          {subtitle && (
            <div className="text-[13px] text-gp-text2">{subtitle}</div>
          )}
        </div>
        <div className="ml-2 text-[13px] text-gp-text2">
          {photos.length} {photos.length === 1 ? "item" : "items"}
        </div>

        {view.type === "trash" && !empty && (
          <button
            className="ml-auto h-9 rounded-full border border-gp-divider px-4 text-[14px] text-gp-text hover:bg-gp-hover"
            onClick={() => setConfirmEmpty(true)}
          >
            Empty trash
          </button>
        )}
        {view.type === "archive" && !empty && (
          <button
            className="ml-auto h-9 rounded-full border border-gp-divider px-4 text-[14px] text-gp-text hover:bg-gp-hover"
            onClick={() => {
              const count = photos.length;
              unarchivePhotos(photos.map((p) => p.id));
              toast(`Unarchived ${count} items`);
            }}
          >
            Unarchive all
          </button>
        )}
      </div>

      {empty ? (
        <EmptyState
          icon={
            view.type === "trash"
              ? "delete"
              : view.type === "favorites"
                ? "favorite"
                : view.type === "archive"
                  ? "archive"
                  : "photo_library"
          }
          title={
            view.type === "trash"
              ? "Nothing in trash"
              : view.type === "favorites"
                ? "No favorites yet"
                : view.type === "archive"
                  ? "No archived photos"
                  : view.type === "search-results"
                    ? "No results"
                    : "Nothing here yet"
          }
          subtitle={
            view.type === "search-results"
              ? "Try searching for people, places, or things"
              : undefined
          }
        />
      ) : (
        <MarqueeArea>
          {({ suppressClick }) => (
            <JustifiedGrid
              photos={photos}
              selected={selected}
              selectionMode={selectionMode && view.type !== "trash"}
              onOpen={openPhoto}
              onToggle={togglePhotoSelection}
              trashMode={view.type === "trash"}
              suppressClick={suppressClick}
              onRestore={
                view.type === "trash"
                  ? (id) => {
                      restorePhotos([id]);
                      toast("Item restored");
                    }
                  : undefined
              }
              onDeleteForever={
                view.type === "trash"
                  ? (id) => setConfirmOne(id)
                  : undefined
              }
            />
          )}
        </MarqueeArea>
      )}

      {/* delete-forever (single item) confirmation */}
      <ConfirmDialog
        open={confirmOne !== null}
        title="Delete permanently?"
        description="This item will be deleted forever and can't be restored."
        confirmLabel="Delete forever"
        onCancel={() => setConfirmOne(null)}
        onConfirm={() => {
          if (confirmOne) {
            deleteForever([confirmOne]);
            toast("Item deleted forever");
          }
          setConfirmOne(null);
        }}
      />

      {/* empty-trash confirmation */}
      <ConfirmDialog
        open={confirmEmpty}
        title="Empty trash?"
        description={`${photos.length} item${
          photos.length === 1 ? "" : "s"
        } will be deleted forever and can't be restored.`}
        confirmLabel="Delete forever"
        onCancel={() => setConfirmEmpty(false)}
        onConfirm={() => {
          const count = photos.length;
          deleteForever(photos.map((p) => p.id));
          setConfirmEmpty(false);
          toast(`Deleted ${count} items forever`);
        }}
      />
    </div>
  );
}

export type { Photo };
