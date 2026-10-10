"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useGpStore, photoById } from "@/lib/store";
import { resolveTheme, toggleTheme } from "@/lib/theme";
import { Msr } from "./Msr";
import { ResortMark } from "./ResortMark";

/** Trigger a real file download for each id (staggered to avoid blocking). */
export function downloadPhotos(ids: string[]) {
  const uploads = useGpStore.getState().uploads;
  ids.forEach((id, i) => {
    const p = photoById(id, uploads);
    if (!p) return;
    const a = document.createElement("a");
    a.href = p.file;
    a.download = p.filename || `${p.id}.jpg`;
    document.body.appendChild(a);
    window.setTimeout(() => {
      a.click();
      a.remove();
    }, i * 250);
  });
  toast(`Downloading ${ids.length} item${ids.length > 1 ? "s" : ""}`);
}

function GpMenu({
  trigger,
  children,
  align = "right",
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute top-[calc(100%+6px)] z-50 min-w-[220px] rounded-lg border border-gp-divider bg-gp-surface py-2 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          } gp-zoom-in`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  close,
}: {
  icon?: string;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  close: () => void;
}) {
  return (
    <button
      role="menuitem"
      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-[14px] hover:bg-gp-hover ${
        danger ? "text-[#d93025]" : "text-gp-text"
      }`}
      onClick={() => {
        onClick?.();
        close();
      }}
    >
      {icon && <Msr name={icon} className="text-[20px]" />}
      <span className="flex-1">{label}</span>
    </button>
  );
}

export function GpHeader({
  onUploadClick,
  scrolled,
}: {
  onUploadClick: () => void;
  scrolled: boolean;
}) {
  const view = useGpStore((s) => s.view);
  const selected = useGpStore((s) => s.selected);
  const selectionMode = useGpStore((s) => s.selectionMode);
  const clearSelection = useGpStore((s) => s.clearSelection);
  const selectMany = useGpStore((s) => s.selectMany);
  const visibleIds = useGpStore((s) => s.visibleIds);
  const favorites = useGpStore((s) => s.favorites);
  const setFavoriteMany = useGpStore((s) => s.setFavoriteMany);
  const trashPhotos = useGpStore((s) => s.trashPhotos);
  const restorePhotos = useGpStore((s) => s.restorePhotos);
  const archivePhotos = useGpStore((s) => s.archivePhotos);
  const openSearch = useGpStore((s) => s.openSearch);
  const setSidebarOpen = useGpStore((s) => s.setSidebarOpen);
  const sidebarOpen = useGpStore((s) => s.sidebarOpen);
  const theme = useGpStore((s) => s.theme);
  const setTheme = useGpStore((s) => s.setTheme);
  const setSettingsOpen = useGpStore((s) => s.setSettingsOpen);
  const setShortcutsOpen = useGpStore((s) => s.setShortcutsOpen);

  /* ---------------- selection-mode header ---------------- */
  if (selectionMode) {
    const allFav =
      selected.length > 0 && selected.every((id) => favorites.includes(id));
    return (
      <header
        className={`z-40 flex h-16 shrink-0 items-center bg-gp-surface px-2 transition-shadow ${
          scrolled ? "shadow-[0_1px_2px_rgba(0,0,0,0.15)]" : ""
        }`}
      >
        <button
          aria-label="Exit selection"
          className="gp-icon-btn"
          onClick={clearSelection}
        >
          <Msr name="close" className="text-[24px]" />
        </button>
        <span className="ml-2 min-w-0 shrink select-none truncate text-[18px] text-gp-text">
          {selected.length} selected
        </span>
        <div className="ml-auto flex shrink-0 items-center">
          <button
            aria-label="Download"
            title="Download"
            className="gp-icon-btn"
            onClick={() => downloadPhotos(selected)}
          >
            <Msr name="download" className="text-[22px]" />
          </button>
          <button
            aria-label="Share"
            title="Share"
            className="gp-icon-btn"
            onClick={() => toast("Shared album link copied to clipboard")}
          >
            <Msr name="share" className="text-[22px]" />
          </button>
          <button
            aria-label={allFav ? "Remove from favorites" : "Add to favorites"}
            title="Favorite"
            className="gp-icon-btn"
            onClick={() => {
              setFavoriteMany(selected, !allFav);
              toast(
                allFav
                  ? `Removed ${selected.length} item${selected.length > 1 ? "s" : ""} from favorites`
                  : `Added ${selected.length} item${selected.length > 1 ? "s" : ""} to favorites`
              );
              clearSelection();
            }}
          >
            <Msr
              name="favorite"
              fill={allFav}
              className={`text-[22px] ${allFav ? "text-[#d93025]" : ""}`}
            />
          </button>
          <button
            aria-label="Add to album"
            title="Add to album"
            className="gp-icon-btn"
            onClick={() => {
              toast(`Added ${selected.length} item${selected.length > 1 ? "s" : ""} to album`);
              clearSelection();
            }}
          >
            <Msr name="photo_album" className="text-[22px]" />
          </button>
          <button
            aria-label="Archive"
            title="Archive"
            className="gp-icon-btn hidden sm:inline-flex"
            onClick={() => {
              archivePhotos(selected);
              toast(
                `Archived ${selected.length} item${selected.length > 1 ? "s" : ""}`
              );
            }}
          >
            <Msr name="archive" className="text-[22px]" />
          </button>
          <button
            aria-label="Move to trash"
            title="Trash"
            className="gp-icon-btn"
            onClick={() => {
              const ids = [...selected];
              trashPhotos(ids);
              toast(`${ids.length} item${ids.length > 1 ? "s" : ""} moved to trash`, {
                action: {
                  label: "Undo",
                  onClick: () => restorePhotos(ids),
                },
              });
            }}
          >
            <Msr name="delete" className="text-[22px]" />
          </button>
          <GpMenu
            trigger={<Msr name="more_vert" className="text-[22px] text-gp-text2" />}
          >
            {(close) => (
              <>
                <MenuItem
                  icon="select_all"
                  label="Select all visible"
                  close={close}
                  onClick={() => selectMany(visibleIds)}
                />
                <MenuItem
                  icon="close"
                  label="Clear selection"
                  close={close}
                  onClick={clearSelection}
                />
              </>
            )}
          </GpMenu>
        </div>
      </header>
    );
  }

  /* ---------------- normal header ---------------- */
  return (
    <header
      className={`z-40 flex h-16 shrink-0 items-center gap-2 bg-gp-surface px-2 sm:px-4 transition-shadow ${
        scrolled ? "shadow-[0_1px_2px_rgba(0,0,0,0.15)]" : ""
      }`}
    >
      <button
        aria-label={sidebarOpen ? "Close main menu" : "Open main menu"}
        className="gp-icon-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Msr name="menu" className="text-[24px]" />
      </button>

      <button
        className="mr-1 flex shrink-0 items-center gap-2"
        onClick={() => useGpStore.getState().setView({ type: "gallery" })}
        aria-label="Resort home"
      >
        <ResortMark size={26} />
        <span className="hidden text-[21px] font-normal tracking-[0.2px] text-[#5f6368] md:inline dark:text-[#9aa0a6]">
          Resort
        </span>
      </button>

      {/* search pill */}
      <button
        className="ml-1 flex h-12 flex-1 items-center gap-3 rounded-full bg-gp-chip px-4 text-left transition-colors hover:bg-gp-hover hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)] md:ml-4 md:max-w-[692px]"
        onClick={openSearch}
        aria-label="Search your photos"
      >
        <Msr name="search" className="text-[22px] text-gp-text2" />
        <span className="hidden text-[16px] text-gp-text2 sm:inline">Search</span>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {/* visible theme toggle — light / dark / follows system */}
        <button
          aria-label="Switch theme"
          title={
            theme === "system"
              ? `Theme: System (${resolveTheme("system")}) — click to switch`
              : `Theme: ${resolveTheme(theme)} — click to switch`
          }
          className="gp-icon-btn"
          onClick={() => setTheme(toggleTheme(theme))}
        >
          <Msr
            name={
              theme === "system"
                ? "brightness_auto"
                : theme === "light"
                  ? "dark_mode"
                  : "light_mode"
            }
            className="text-[22px]"
          />
        </button>
        <button
          aria-label="Upload"
          title="Upload"
          onClick={onUploadClick}
          className="flex h-9 items-center gap-2 rounded-full bg-gp-blue px-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gp-blue-hover sm:px-4"
        >
          <Msr name="add" className="text-[20px]" />
          <span className="hidden sm:inline">Upload</span>
        </button>
        <button
          aria-label="Settings"
          className="gp-icon-btn hidden lg:inline-flex"
          onClick={() => setSettingsOpen(true)}
        >
          <Msr name="settings" className="text-[22px]" />
        </button>
        <button
          aria-label="Keyboard shortcuts"
          className="gp-icon-btn hidden lg:inline-flex"
          onClick={() => setShortcutsOpen(true)}
        >
          <Msr name="help" className="text-[22px]" />
        </button>

        {/* account avatar */}
        <GpMenu
          trigger={
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1a73e8] to-[#174ea6] text-[14px] font-medium text-white"
              aria-label="Account menu"
            >
              A
            </span>
          }
        >
          {(close) => (
            <div className="px-2">
              <div className="mb-2 border-b border-gp-divider px-2 pb-3 pt-1">
                <div className="text-[14px] font-medium text-gp-text">Alex Rivera</div>
                <div className="text-[13px] text-gp-text2">alex.rivera@resort.app</div>
              </div>
              <MenuItem
                icon={theme === "dark" ? "light_mode" : "dark_mode"}
                label={
                  theme === "system"
                    ? `Use ${resolveTheme("system") === "dark" ? "light" : "dark"} theme`
                    : theme === "dark"
                      ? "Light theme"
                      : "Dark theme"
                }
                close={close}
                onClick={() => setTheme(toggleTheme(theme))}
              />
              <MenuItem
                icon="settings"
                label="Settings"
                close={close}
                onClick={() => setSettingsOpen(true)}
              />
              <MenuItem
                icon="help"
                label="Get help"
                close={close}
                onClick={() => toast("Help is demo-only in this preview")}
              />
              <MenuItem
                icon="send"
                label="Send feedback"
                close={close}
                onClick={() => toast("Thanks for the feedback!")}
              />
            </div>
          )}
        </GpMenu>
      </div>
    </header>
  );
}
