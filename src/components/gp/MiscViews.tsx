"use client";

import { toast } from "sonner";
import { useGpStore } from "@/lib/store";
import { Msr } from "./Msr";

export function SharingView() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-4 sm:px-6">
      <h1 className="mb-6 text-[22px] font-normal text-gp-text">Sharing</h1>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <Msr name="group" className="text-[64px] text-gp-text2/50" />
        <div className="text-[20px] text-gp-text">
          Share your favorite memories
        </div>
        <div className="max-w-[420px] text-[14px] text-gp-text2">
          Create a shared album to collect photos with friends and family —
          everyone can view, save and add their own.
        </div>
        <button
          className="mt-2 flex h-10 items-center gap-2 rounded-full bg-gp-blue px-5 text-[14px] font-medium text-white hover:bg-gp-blue-hover"
          onClick={() => toast("Shared albums are demo-only in this preview")}
        >
          <Msr name="add" className="text-[20px]" />
          New shared album
        </button>
      </div>
    </div>
  );
}

const UTILITIES = [
  { icon: "cloud_upload", title: "Free up storage", desc: "Remove backed-up photos from this device" },
  { icon: "auto_awesome", title: "Animations, collages & movies", desc: "Auto-create highlights from your photos" },
  { icon: "photo_filter", title: "Enhance your photos", desc: "Adjust brightness, contrast and more" },
  { icon: "archive", title: "Archive tips", desc: "Hide photos from your main grid" },
];

export function UtilitiesView() {
  const setView = useGpStore((s) => s.setView);
  return (
    <div className="mx-auto max-w-[900px] px-4 pb-10 pt-4 sm:px-6">
      <h1 className="mb-6 text-[22px] font-normal text-gp-text">Utilities</h1>
      <div className="space-y-2">
        {UTILITIES.map((u) => (
          <button
            key={u.title}
            className="flex w-full items-center gap-4 rounded-xl border border-gp-divider bg-gp-surface p-4 text-left transition-colors hover:bg-gp-hover"
            onClick={() => toast("Utilities are demo-only in this preview")}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gp-blue-soft text-gp-blue">
              <Msr name={u.icon} className="text-[24px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-medium text-gp-text">
                {u.title}
              </span>
              <span className="block text-[13px] text-gp-text2">{u.desc}</span>
            </span>
            <Msr name="chevron_right" className="ml-auto text-[24px] text-gp-text2" />
          </button>
        ))}
      </div>
      <button
        className="mt-6 text-[13px] text-gp-blue hover:underline"
        onClick={() => setView({ type: "gallery" })}
      >
        ← Back to photos
      </button>
    </div>
  );
}
