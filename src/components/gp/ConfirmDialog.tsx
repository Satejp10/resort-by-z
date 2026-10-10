"use client";

import { useEffect } from "react";

/** Confirmation dialog (used for destructive actions). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div
        className="gp-zoom-in w-full max-w-[360px] rounded-2xl bg-gp-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[18px] font-medium text-gp-text">{title}</h2>
        {description && (
          <p className="mt-2 text-[14px] leading-relaxed text-gp-text2">
            {description}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="h-9 rounded-full px-5 text-[14px] font-medium text-gp-blue hover:bg-gp-blue/10"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`h-9 rounded-full px-5 text-[14px] font-medium ${
              danger
                ? "bg-[#d93025] text-white hover:bg-[#b3261e]"
                : "bg-gp-blue text-white hover:bg-gp-blue-hover"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
