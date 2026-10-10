"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { useGpStore, rehydrateGp, type Upload } from "@/lib/store";
import { applyThemeToDocument } from "@/lib/theme";
import { GpHeader } from "./GpHeader";
import { GpSidebar } from "./GpSidebar";
import { GalleryView } from "./GalleryView";
import { CategoryView } from "./CategoryView";
import { AlbumsView } from "./AlbumsView";
import { ExploreView } from "./ExploreView";
import { SharingView, UtilitiesView } from "./MiscViews";
import { SearchOverlay } from "./SearchOverlay";
import { Lightbox } from "./Lightbox";
import { Msr } from "./Msr";
import { SettingsDialog } from "./SettingsDialog";
import { ShortcutsDialog } from "./ShortcutsDialog";

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
}

async function fileToUpload(file: File, i: number): Promise<Upload> {
  const url = URL.createObjectURL(file);
  const dims = await new Promise<{ w: number; h: number }>((res) => {
    const im = new Image();
    im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
    im.onerror = () => res({ w: 4, h: 3 });
    im.src = url;
  });
  const now = new Date();
  return {
    id: `up-${now.getTime()}-${i}`,
    file: url,
    thumb: url,
    w: dims.w,
    h: dims.h,
    date: now.toISOString(),
    desc: file.name.replace(/\.[^.]+$/, ""),
    location: "",
    tags: ["uploads"],
    camera: "This device",
    exif: "",
    filename: file.name,
  };
}

export function PhotosApp() {
  const view = useGpStore((s) => s.view);
  const lightboxOpen = !!useGpStore((s) => s.lightbox);
  const searchOpen = useGpStore((s) => s.searchOpen);
  const setView = useGpStore((s) => s.setView);
  const addUploads = useGpStore((s) => s.addUploads);
  const theme = useGpStore((s) => s.theme);

  const isMobile = useIsMobile();
  const mainRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  /* rehydrate persisted state + theme */
  useEffect(() => {
    rehydrateGp().then(() => {
      applyThemeToDocument(useGpStore.getState().theme);
      document.documentElement.classList.toggle(
        "reduce-motion",
        useGpStore.getState().reduceMotion
      );
      setHydrated(true);
    });
  }, []);

  /* keep <html> class in sync when theme changes */
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  /* follow OS color scheme changes while in "system" mode */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (useGpStore.getState().theme === "system") applyThemeToDocument("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const reduceMotion = useGpStore((s) => s.reduceMotion);
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [reduceMotion]);

  /* app-wide keyboard shortcuts: "/" opens search, "?" shows help,
     Ctrl/Cmd+A selects all, Esc exits selection */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        !!t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable);
      const s = useGpStore.getState();

      if (typing) return;

      if (e.key === "/") {
        e.preventDefault();
        s.openSearch();
        return;
      }
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        s.setShortcutsOpen(true);
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "a" || e.key === "A")
      ) {
        if (s.lightbox || s.searchOpen) return;
        e.preventDefault();
        if (s.visibleIds.length > 0) {
          s.selectMany(s.visibleIds);
        }
        return;
      }
      if (e.key === "Escape") {
        if (s.searchOpen || s.lightbox) return; // handled by those overlays
        if (s.selectionMode) {
          e.preventDefault();
          s.clearSelection();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* mobile: drawer always starts closed regardless of persisted state */
  useEffect(() => {
    if (isMobile && useGpStore.getState().sidebarOpen) {
      useGpStore.getState().setSidebarOpen(false);
    }
  }, [isMobile]);

  /* scroll to top on view change */
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [view]);

  const onMainScroll = useCallback(() => {
    setScrolled((mainRef.current?.scrollTop ?? 0) > 80);
  }, []);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const uploads: Upload[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith("image/")) continue;
      uploads.push(await fileToUpload(f, i));
    }
    if (uploads.length === 0) return;
    addUploads(uploads);
    setView({ type: "gallery" });
    toast(
      `Upload complete — ${uploads.length} item${uploads.length > 1 ? "s" : ""} added to today`
    );
    if (fileRef.current) fileRef.current.value = "";
  };

  const showFab = scrolled && !lightboxOpen && !searchOpen;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gp-bg">
      <GpHeader
        onUploadClick={() => fileRef.current?.click()}
        scrolled={scrolled}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => onUpload(e.target.files)}
        aria-hidden
      />

      <div className="flex min-h-0 flex-1">
        <GpSidebar isMobile={isMobile} />

        <main
          ref={mainRef}
          onScroll={onMainScroll}
          className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
          id="main-content"
        >
          {!hydrated ? null : (
            <>
              {view.type === "gallery" && <GalleryView />}
              {view.type === "favorites" && <CategoryView view={view} />}
              {view.type === "archive" && <CategoryView view={view} />}
              {view.type === "trash" && <CategoryView view={view} />}
              {view.type === "album" && <CategoryView view={view} />}
              {view.type === "explore-category" && <CategoryView view={view} />}
              {view.type === "search-results" && <CategoryView view={view} />}
              {view.type === "albums" && <AlbumsView />}
              {view.type === "explore" && <ExploreView />}
              {view.type === "sharing" && <SharingView />}
              {view.type === "utilities" && <UtilitiesView />}
            </>
          )}
        </main>
      </div>

      {/* scroll-to-top — bottom-center pill, Resort style */}
      {showFab && (
        <button
          aria-label="Scroll to top"
          className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-gp-surface text-gp-text2 shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 gp-zoom-in"
          onClick={() =>
            mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })
          }
        >
          <Msr name="keyboard_arrow_up" className="text-[26px]" />
        </button>
      )}

      <SearchOverlay />
      <Lightbox />
      <SettingsDialog />
      <ShortcutsDialog />

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#323232",
            color: "#ffffff",
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: "inherit",
            boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
          },
          actionButtonStyle: {
            color: "#8ab4f8",
            fontWeight: 500,
          },
        }}
      />
    </div>
  );
}
