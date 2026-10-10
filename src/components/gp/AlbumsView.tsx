"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { photosWithAnyTags, ALBUMS } from "@/data/albums";
import { useGpStore } from "@/lib/store";
import { Msr } from "./Msr";

export function AlbumsView() {
  const setView = useGpStore((s) => s.setView);
  const favorites = useGpStore((s) => s.favorites);

  const albums = useMemo(() => {
    const list = [
      {
        id: "__favorites__",
        title: "Favorites",
        subtitle: "Your starred photos",
        count: favorites.length,
        cover: photosWithAnyTags(["beach", "ocean"])[0]?.thumb,
      },
      ...ALBUMS.map((a) => {
        const members = photosWithAnyTags(a.tags);
        return {
          id: a.id,
          title: a.title,
          subtitle: a.subtitle,
          count: members.length,
          cover: members[2]?.thumb ?? members[0]?.thumb,
        };
      }),
    ];
    return list;
  }, [favorites.length]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-4 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-normal text-gp-text">Albums</h1>
        <button
          className="flex h-9 items-center gap-2 rounded-full bg-gp-blue px-4 text-[14px] font-medium text-white hover:bg-gp-blue-hover"
          onClick={() => toast("Album creation is demo-only in this preview")}
        >
          <Msr name="add" className="text-[20px]" />
          New album
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {albums.map((a) => (
          <button
            key={a.id}
            className="group text-left"
            onClick={() =>
              setView(
                a.id === "__favorites__"
                  ? { type: "favorites" }
                  : { type: "album", id: a.id }
              )
            }
          >
            <div className="aspect-square overflow-hidden rounded-lg bg-gp-chip">
              {a.cover ? (
                <img
                  src={a.cover}
                  alt={a.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Msr name="favorite" className="text-[40px] text-gp-text2/40" />
                </div>
              )}
            </div>
            <div className="mt-2 truncate text-[14px] font-medium text-gp-text">
              {a.title}
            </div>
            <div className="text-[12px] text-gp-text2">
              {a.count} {a.count === 1 ? "item" : "items"}
              {a.subtitle ? ` · ${a.subtitle}` : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
