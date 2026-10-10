"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useGpStore, type View } from "@/lib/store";
import { photosWithAnyTags } from "@/data/albums";
import { STORAGE, storagePercent } from "@/lib/app-config";
import { Msr } from "./Msr";

const NAV: { label: string; icon: string; view: View }[] = [
  { label: "Photos", icon: "photo_library", view: { type: "gallery" } },
  { label: "Explore", icon: "explore", view: { type: "explore" } },
  { label: "Sharing", icon: "group", view: { type: "sharing" } },
  { label: "Favorites", icon: "favorite", view: { type: "favorites" } },
  { label: "Utilities", icon: "construction", view: { type: "utilities" } },
  { label: "Archive", icon: "archive", view: { type: "archive" } },
  { label: "Trash", icon: "delete", view: { type: "trash" } },
];

function navActive(view: View, item: View): boolean {
  if (view.type === "album") return false;
  if (view.type === "explore-category") return item.type === "explore";
  return view.type === item.type;
}

function NavRow({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-12 w-full items-center gap-4 rounded-full px-6 text-left text-[14px] transition-colors ${
        active
          ? "bg-gp-hover font-medium text-gp-blue"
          : "text-gp-text hover:bg-gp-hover"
      }`}
      onClick={onClick}
    >
      <Msr
        name={icon}
        fill={active && (icon === "favorite" || icon === "delete")}
        className={`text-[22px] ${active ? "text-gp-blue" : "text-gp-text2"}`}
      />
      {label}
    </button>
  );
}

const SIDEBAR_ALBUMS: { id: string; title: string; tags: string[] }[] = [
  { id: "milo", title: "Milo", tags: ["dog", "Milo"] },
  { id: "beach", title: "Beach days", tags: ["beach", "ocean"] },
  { id: "paris", title: "Paris 2026", tags: ["paris", "eiffel"] },
  { id: "winter", title: "Winter cabin", tags: ["winter", "snow", "cabin"] },
];

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const view = useGpStore((s) => s.view);
  const setView = useGpStore((s) => s.setView);
  const favorites = useGpStore((s) => s.favorites);

  const rows = useMemo(
    () => [
      {
        id: "__favorites__",
        title: "Favorites",
        count: favorites.length,
        cover: photosWithAnyTags(["beach", "ocean"])[0]?.thumb,
        go: () => setView({ type: "favorites" }),
      },
      ...SIDEBAR_ALBUMS.map((a) => {
        const members = photosWithAnyTags(a.tags);
        return {
          id: a.id,
          title: a.title,
          count: members.length,
          cover: members[0]?.thumb,
          go: () => setView({ type: "album", id: a.id }),
        };
      }),
    ],
    [favorites.length, setView]
  );

  return (
    <div className="px-3 py-2">
      <div className="space-y-0.5">
        {NAV.map((item) => (
          <NavRow
            key={item.label}
            label={item.label}
            icon={item.icon}
            active={navActive(view, item.view)}
            onClick={() => {
              setView(item.view);
              onNavigate?.();
            }}
          />
        ))}
      </div>

      <div className="mx-6 my-2 border-t border-gp-divider" />

      <div className="px-3">
        <div className="px-3 py-1 text-[14px] font-medium text-gp-text">
          Albums
        </div>
        <button
          className="flex h-11 w-full items-center gap-3 rounded-full px-3 text-left text-[14px] text-gp-text hover:bg-gp-hover"
          onClick={() => {
            setView({ type: "albums" });
            onNavigate?.();
          }}
        >
          <Msr name="photo_album" className="text-[22px] text-gp-text2" />
          View all albums
        </button>
        {rows.map((a) => (
          <button
            key={a.id}
            className="flex h-11 w-full items-center gap-3 rounded-full px-3 text-left hover:bg-gp-hover"
            onClick={() => {
              a.go();
              onNavigate?.();
            }}
          >
            {a.cover ? (
              <img
                src={a.cover}
                alt=""
                className="h-8 w-8 rounded-[4px] object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-gp-chip">
                <Msr name="favorite" className="text-[16px] text-gp-text2" />
              </span>
            )}
            <span className="flex-1 truncate text-[14px] text-gp-text">
              {a.title}
            </span>
            <span className="text-[12px] text-gp-text2">{a.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StorageWidget() {
  /* Mirrors the nav-row structure (px-3 container + px-6 inner) so the
     text, bar and button align on the same 36px inset as the nav icons
     and album covers above. */
  return (
    <div className="shrink-0 px-3 pb-4 pt-3">
      <div className="px-6">
        <div className="text-[12px] text-gp-text2">
          {STORAGE.usedGb} GB of {STORAGE.totalGb} GB used
        </div>
        <div
          className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gp-chip"
          role="progressbar"
          aria-label="Storage used"
          aria-valuenow={storagePercent()}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gp-blue"
            style={{ width: `${storagePercent()}%` }}
          />
        </div>
        <button
          className="mt-3 flex h-9 w-full items-center justify-center rounded-full border border-gp-blue text-[13px] font-medium text-gp-blue hover:bg-gp-blue/10"
          onClick={() => toast("Storage plans are demo-only in this preview")}
        >
          Get more storage
        </button>
      </div>
    </div>
  );
}

export function GpSidebar({ isMobile }: { isMobile: boolean }) {
  const sidebarOpen = useGpStore((s) => s.sidebarOpen);
  const setSidebarOpen = useGpStore((s) => s.setSidebarOpen);

  if (isMobile) {
    return (
      <>
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 z-30 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
        <nav
          aria-label="Main navigation"
          className={`fixed bottom-0 left-0 top-16 z-40 flex w-[min(16rem,82vw)] flex-col bg-gp-surface pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex-1 overflow-y-auto">
            <SidebarBody onNavigate={() => setSidebarOpen(false)} />
          </div>
          <StorageWidget />
        </nav>
      </>
    );
  }

  const width = sidebarOpen ? 256 : 0;
  return (
    <nav
      aria-label="Main navigation"
      style={{ width }}
      className="shrink-0 overflow-hidden bg-gp-surface transition-[width] duration-200"
    >
      <div style={{ width: 256 }} className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <SidebarBody />
        </div>
        <StorageWidget />
      </div>
    </nav>
  );
}
