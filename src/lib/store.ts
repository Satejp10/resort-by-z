"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PHOTOS, type Photo } from "@/data/photos";

export type ThemeMode = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";

export type View =
  | { type: "gallery" }
  | { type: "favorites" }
  | { type: "archive" }
  | { type: "trash" }
  | { type: "albums" }
  | { type: "album"; id: string }
  | { type: "explore" }
  | { type: "explore-category"; id: string }
  | { type: "sharing" }
  | { type: "utilities" }
  | { type: "search-results"; query: string };

export interface Upload {
  id: string;
  file: string;
  thumb: string;
  w: number;
  h: number;
  date: string;
  desc: string;
  location: string;
  tags: string[];
  camera: string;
  exif: string;
  filename: string;
}

interface LightboxState {
  ids: string[];
  index: number;
}

interface GpState {
  view: View;
  setView: (v: View) => void;

  selected: string[];
  selectionMode: boolean;
  togglePhotoSelection: (id: string) => void;
  selectMany: (ids: string[]) => void;
  clearSelection: () => void;

  favorites: string[];
  toggleFavorite: (id: string) => void;
  setFavoriteMany: (ids: string[], on: boolean) => void;

  trashed: string[];
  trashPhotos: (ids: string[]) => void;
  restorePhotos: (ids: string[]) => void;
  deleteForever: (ids: string[]) => void;

  archived: string[];
  archivePhotos: (ids: string[]) => void;
  unarchivePhotos: (ids: string[]) => void;

  uploads: Upload[];
  addUploads: (u: Upload[]) => void;

  visibleIds: string[];
  setVisibleIds: (ids: string[]) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  searchOpen: boolean;
  searchQuery: string;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (q: string) => void;

  lightbox: LightboxState | null;
  openLightbox: (ids: string[], index: number) => void;
  closeLightbox: () => void;
  navigateLightbox: (delta: number) => void;
  setLightboxIndex: (index: number) => void;

  infoOpen: boolean;
  setInfoOpen: (open: boolean) => void;

  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;

  density: Density;
  setDensity: (d: Density) => void;

  reduceMotion: boolean;
  setReduceMotion: (on: boolean) => void;

  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
}

const toggleIn = (arr: string[], id: string) =>
  arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

export const useGpStore = create<GpState>()(
  persist(
    (set, get) => ({
      view: { type: "gallery" },
      setView: (v) => set({ view: v, selected: [], selectionMode: false }),

      selected: [],
      selectionMode: false,
      togglePhotoSelection: (id) => {
        const { selected } = get();
        const next = toggleIn(selected, id);
        set({ selected: next, selectionMode: next.length > 0 });
      },
      selectMany: (ids) =>
        set({ selected: Array.from(new Set(ids)), selectionMode: ids.length > 0 }),
      clearSelection: () => set({ selected: [], selectionMode: false }),

      favorites: [],
      toggleFavorite: (id) => set((s) => ({ favorites: toggleIn(s.favorites, id) })),
      setFavoriteMany: (ids, on) =>
        set((s) => ({
          favorites: on
            ? Array.from(new Set([...s.favorites, ...ids]))
            : s.favorites.filter((f) => !ids.includes(f)),
        })),

      trashed: [],
      trashPhotos: (ids) =>
        set((s) => ({
          trashed: Array.from(new Set([...s.trashed, ...ids])),
          selected: [],
          selectionMode: false,
        })),
      restorePhotos: (ids) =>
        set((s) => ({ trashed: s.trashed.filter((t) => !ids.includes(t)) })),
      deleteForever: (ids) =>
        set((s) => ({
          trashed: s.trashed.filter((t) => !ids.includes(t)),
          favorites: s.favorites.filter((f) => !ids.includes(f)),
          archived: s.archived.filter((a) => !ids.includes(a)),
          selected: [],
          selectionMode: false,
        })),

      archived: [],
      archivePhotos: (ids) =>
        set((s) => ({
          archived: Array.from(new Set([...s.archived, ...ids])),
          selected: [],
          selectionMode: false,
        })),
      unarchivePhotos: (ids) =>
        set((s) => ({ archived: s.archived.filter((a) => !ids.includes(a)) })),

      uploads: [],
      addUploads: (u) => set((s) => ({ uploads: [...u, ...s.uploads] })),

      visibleIds: [],
      setVisibleIds: (ids) => set({ visibleIds: ids }),

      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      searchOpen: false,
      searchQuery: "",
      openSearch: () => set({ searchOpen: true }),
      closeSearch: () => set({ searchOpen: false, searchQuery: "" }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      lightbox: null,
      openLightbox: (ids, index) =>
        set({ lightbox: { ids: [...ids], index }, infoOpen: false }),
      closeLightbox: () => set({ lightbox: null, infoOpen: false }),
      navigateLightbox: (delta) => {
        const lb = get().lightbox;
        if (!lb) return;
        const n = lb.ids.length;
        set({ lightbox: { ...lb, index: (lb.index + delta + n) % n } });
      },
      setLightboxIndex: (index) => {
        const lb = get().lightbox;
        if (!lb) return;
        set({ lightbox: { ...lb, index } });
      },

      infoOpen: false,
      setInfoOpen: (open) => set({ infoOpen: open }),

      theme: "system",
      setTheme: (t) => set({ theme: t }),

      density: "comfortable",
      setDensity: (d) => set({ density: d }),

      reduceMotion: false,
      setReduceMotion: (on) => set({ reduceMotion: on }),

      settingsOpen: false,
      setSettingsOpen: (open) => set({ settingsOpen: open }),

      shortcutsOpen: false,
      setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
    }),
    {
      name: "gp-ente-photos",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
      migrate: (persisted: unknown) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        // v0 stored theme as "light" | "dark"; v1 adds "system" + settings
        if (p.theme !== "light" && p.theme !== "dark" && p.theme !== "system") {
          p.theme = "system";
        }
        if (p.density !== "comfortable" && p.density !== "compact") {
          p.density = "comfortable";
        }
        if (typeof p.reduceMotion !== "boolean") p.reduceMotion = false;
        return p;
      },
      partialize: (s) => ({
        favorites: s.favorites,
        trashed: s.trashed,
        archived: s.archived,
        sidebarOpen: s.sidebarOpen,
        theme: s.theme,
        density: s.density,
        reduceMotion: s.reduceMotion,
      }),
    }
  )
);

/** Rehydrate persisted state after mount (avoids SSR mismatch). */
export async function rehydrateGp() {
  return useGpStore.persist.rehydrate();
}

export function photoById(id: string, uploads: Upload[]): Photo | Upload | undefined {
  return (
    (uploads as (Photo | Upload)[]).find((p) => p.id === id) ??
    PHOTOS.find((p) => p.id === id)
  );
}
