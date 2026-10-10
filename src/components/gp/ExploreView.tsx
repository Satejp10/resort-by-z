"use client";

import { useMemo } from "react";
import { EXPLORE_CATEGORIES, PEOPLE_PETS, PLACES, photosWithAnyTags } from "@/data/albums";
import { PHOTOS } from "@/data/photos";
import { useGpStore } from "@/lib/store";
import { Msr } from "./Msr";

export function ExploreView() {
  const setView = useGpStore((s) => s.setView);

  const circles = useMemo(
    () =>
      PEOPLE_PETS.map((c) => {
        const members = photosWithAnyTags(c.tags);
        return { ...c, cover: members[0]?.thumb, count: members.length };
      }),
    []
  );

  const places = useMemo(
    () =>
      PLACES.map((p) => {
        const members = PHOTOS.filter((ph) =>
          p.match.some((m) => ph.location.includes(m))
        );
        return { ...p, cover: members[0]?.thumb, count: members.length };
      }).filter((p) => p.count > 0),
    []
  );

  const categories = useMemo(
    () =>
      EXPLORE_CATEGORIES.map((c) => {
        const members = photosWithAnyTags(c.tags);
        return { ...c, cover: members[0]?.thumb, count: members.length };
      }).filter((c) => c.count > 0),
    []
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-4 sm:px-6">
      <h1 className="mb-6 text-[22px] font-normal text-gp-text">Explore</h1>

      {/* People & pets */}
      <section aria-label="People and pets" className="mb-8">
        <div className="mb-3 text-[16px] font-medium text-gp-text">
          People &amp; pets
        </div>
        <div className="flex gap-6 overflow-x-auto pb-2">
          {circles.map((c) => (
            <button
              key={c.name}
              className="group flex w-[84px] shrink-0 flex-col items-center gap-1"
              onClick={() => {
                const cat = EXPLORE_CATEGORIES.find((ec) =>
                  ec.tags.some((t) => c.tags.includes(t))
                );
                setView({
                  type: "explore-category",
                  id: cat?.id ?? (c.kind === "pet" ? "animals" : "people"),
                });
              }}
            >
              <div className="h-[76px] w-[76px] overflow-hidden rounded-full bg-gp-chip">
                {c.cover ? (
                  <img
                    src={c.cover}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Msr
                      name={c.kind === "pet" ? "pets" : "person"}
                      className="text-[36px] text-gp-text2/50"
                    />
                  </div>
                )}
              </div>
              <div className="truncate text-[13px] text-gp-text group-hover:text-gp-blue">
                {c.name}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Places */}
      {places.length > 0 && (
        <section aria-label="Places" className="mb-8">
          <div className="mb-3 text-[16px] font-medium text-gp-text">Places</div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {places.map((p) => (
              <button
                key={p.label}
                className="group w-[200px] shrink-0 text-left"
                onClick={() =>
                  setView({
                    type: "search-results",
                    query: p.label,
                  })
                }
              >
                <div className="h-[140px] overflow-hidden rounded-xl bg-gp-chip">
                  {p.cover && (
                    <img
                      src={p.cover}
                      alt={p.label}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[14px] text-gp-text group-hover:text-gp-blue">
                    {p.label}
                  </span>
                  <span className="text-[12px] text-gp-text2">
                    {p.count} {p.count === 1 ? "photo" : "photos"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section aria-label="Categories">
        <div className="mb-3 text-[16px] font-medium text-gp-text">Categories</div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <button
              key={c.id}
              className="group relative overflow-hidden rounded-xl bg-gp-chip"
              onClick={() => setView({ type: "explore-category", id: c.id })}
              aria-label={`Category ${c.label}`}
            >
              <div className="aspect-[4/3] w-full">
                {c.cover && (
                  <img
                    src={c.cover}
                    alt={c.label}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-8 text-left">
                <div className="text-[16px] font-medium text-white">{c.label}</div>
                <div className="text-[12px] text-white/80">
                  {c.count} {c.count === 1 ? "photo" : "photos"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
