"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useGpStore } from "@/lib/store";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="gp-kbd">{children}</kbd>
  );
}

function Row({
  keys,
  label,
}: {
  keys: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2">
      <span className="text-[14px] text-gp-text">{label}</span>
      <span className="flex items-center gap-1">{keys}</span>
    </div>
  );
}

export function ShortcutsDialog() {
  const open = useGpStore((s) => s.shortcutsOpen);
  const setOpen = useGpStore((s) => s.setShortcutsOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-[380px] gap-0 rounded-2xl border-gp-divider bg-gp-surface p-4 text-gp-text"
        showCloseButton={false}
      >
        <DialogTitle className="px-2 pb-2 text-[18px] font-medium text-gp-text">
          Keyboard shortcuts
        </DialogTitle>

        <div className="max-h-[min(70vh,calc(100dvh-13rem))] overflow-y-auto">
          <Row label="Open search" keys={<Kbd>/</Kbd>} />
          <Row label="Select all photos" keys={<><Kbd>Ctrl</Kbd><Kbd>A</Kbd></>} />
          <Row label="Exit selection" keys={<Kbd>Esc</Kbd>} />
          <Row
            label="Move between photos"
            keys={<><Kbd>←</Kbd><Kbd>→</Kbd></>}
          />
          <Row label="Open photo info" keys={<Kbd>I</Kbd>} />
          <Row label="Favorite a photo" keys={<Kbd>F</Kbd>} />
          <Row label="Close viewer / panel" keys={<Kbd>Esc</Kbd>} />
          <Row label="Zoom photo" keys={<Kbd>double-click</Kbd>} />
          <Row label="Select several" keys={<Kbd>drag</Kbd>} />
        </div>

        <div className="flex justify-end pt-1">
          <button
            className="h-9 rounded-full px-6 text-[14px] font-medium text-gp-blue hover:bg-gp-blue/10"
            onClick={() => setOpen(false)}
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
