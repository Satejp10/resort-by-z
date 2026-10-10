"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useGpStore, type ThemeMode, type Density } from "@/lib/store";
import { Msr } from "./Msr";

function OptionRow({
  icon,
  label,
  desc,
  selected,
  onClick,
}: {
  icon: string;
  label: string;
  desc?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      className="flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gp-hover"
      onClick={onClick}
    >
      <Msr name={icon} className="text-[22px] text-gp-text2" />
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] text-gp-text">{label}</span>
        {desc && (
          <span className="block text-[12px] text-gp-text2">{desc}</span>
        )}
      </span>
      <span
        aria-hidden
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-gp-blue" : "border-gp-text2/50"
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-gp-blue" />}
      </span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-4 text-[12px] font-medium uppercase tracking-wide text-gp-text2">
      {children}
    </div>
  );
}

const THEME_OPTIONS: {
  value: ThemeMode;
  icon: string;
  label: string;
  desc: string;
}[] = [
  {
    value: "system",
    icon: "brightness_auto",
    label: "System default",
    desc: "Follows your device theme",
  },
  {
    value: "light",
    icon: "light_mode",
    label: "Light theme",
    desc: "White surfaces and a bright grid",
  },
  {
    value: "dark",
    icon: "dark_mode",
    label: "Dark theme",
    desc: "Dark #202124 surfaces, easier on the eyes",
  },
];

const DENSITY_OPTIONS: {
  value: Density;
  icon: string;
  label: string;
  desc: string;
}[] = [
  {
    value: "comfortable",
    icon: "photo",
    label: "Comfortable",
    desc: "Larger rows, fewer per screen",
  },
  {
    value: "compact",
    icon: "apps",
    label: "Compact",
    desc: "Smaller rows, more photos per screen",
  },
];

export function SettingsDialog() {
  const open = useGpStore((s) => s.settingsOpen);
  const setOpen = useGpStore((s) => s.setSettingsOpen);
  const theme = useGpStore((s) => s.theme);
  const setTheme = useGpStore((s) => s.setTheme);
  const density = useGpStore((s) => s.density);
  const setDensity = useGpStore((s) => s.setDensity);
  const reduceMotion = useGpStore((s) => s.reduceMotion);
  const setReduceMotion = useGpStore((s) => s.setReduceMotion);
  const setShortcutsOpen = useGpStore((s) => s.setShortcutsOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-[400px] gap-0 rounded-2xl border-gp-divider bg-gp-surface p-4 text-gp-text"
        showCloseButton={false}
      >
        <DialogTitle className="px-2 pb-1 text-[18px] font-medium text-gp-text">
          Settings
        </DialogTitle>

        <div className="max-h-[min(70vh,calc(100dvh-13rem))] overflow-y-auto pb-2">
          <SectionLabel>Theme</SectionLabel>
          <div role="radiogroup" aria-label="Theme" className="space-y-0.5">
            {THEME_OPTIONS.map((o) => (
              <OptionRow
                key={o.value}
                icon={o.icon}
                label={o.label}
                desc={o.desc}
                selected={theme === o.value}
                onClick={() => setTheme(o.value)}
              />
            ))}
          </div>

          <SectionLabel>Grid density</SectionLabel>
          <div role="radiogroup" aria-label="Grid density" className="space-y-0.5">
            {DENSITY_OPTIONS.map((o) => (
              <OptionRow
                key={o.value}
                icon={o.icon}
                label={o.label}
                desc={o.desc}
                selected={density === o.value}
                onClick={() => setDensity(o.value)}
              />
            ))}
          </div>

          <SectionLabel>Accessibility</SectionLabel>
          <button
            role="switch"
            aria-checked={reduceMotion}
            className="flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gp-hover"
            onClick={() => setReduceMotion(!reduceMotion)}
          >
            <Msr name="speed" className="text-[22px] text-gp-text2" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] text-gp-text">
                Reduce animations
              </span>
              <span className="block text-[12px] text-gp-text2">
                Minimize transitions and motion
              </span>
            </span>
            <span
              aria-hidden
              className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                reduceMotion ? "bg-gp-blue" : "bg-gp-text2/40"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                  reduceMotion ? "left-[22px]" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <SectionLabel>More</SectionLabel>
          <button
            className="flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gp-hover"
            onClick={() => {
              setOpen(false);
              setShortcutsOpen(true);
            }}
          >
            <Msr name="keyboard" className="text-[22px] text-gp-text2" />
            <span className="flex-1 text-[14px] text-gp-text">
              Keyboard shortcuts
            </span>
            <span className="text-[12px] text-gp-text2">?</span>
          </button>
          <button
            className="flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gp-hover"
            onClick={() => {
              try {
                localStorage.removeItem("gp-ente-photos");
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
          >
            <Msr name="refresh" className="text-[22px] text-gp-text2" />
            <span className="flex-1 text-[14px] text-gp-text">
              Reset demo data
            </span>
          </button>
        </div>

        <div className="flex justify-end pt-1">
          <button
            className="h-9 rounded-full px-6 text-[14px] font-medium text-gp-blue hover:bg-gp-blue/10"
            onClick={() => {
              setOpen(false);
              toast("Settings saved");
            }}
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
