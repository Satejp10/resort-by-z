import { PHOTOS, type Photo } from "./photos";

/** A photo matches a filter if it carries ANY of the given tags. */
export function photosWithAnyTags(tags: string[]): Photo[] {
  const set = new Set(tags);
  return PHOTOS.filter((p) => p.tags.some((t) => set.has(t)));
}

export interface AlbumDef {
  id: string;
  title: string;
  /** filter tags (ANY match); empty for special albums */
  tags: string[];
  subtitle?: string;
}

export const ALBUMS: AlbumDef[] = [
  { id: "milo", title: "Milo", tags: ["dog", "Milo"], subtitle: "Auto album" },
  { id: "beach", title: "Beach days", tags: ["beach", "ocean"], subtitle: "Auto album" },
  { id: "paris", title: "Paris 2026", tags: ["paris", "eiffel"] },
  { id: "winter", title: "Winter cabin", tags: ["winter", "snow", "cabin"] },
  { id: "food", title: "Food & drink", tags: ["food", "pasta", "coffee", "cafe", "latte", "cake", "birthday", "dessert"] },
  { id: "nature", title: "Into the wild", tags: ["nature", "waterfall", "hiking", "forest"] },
];

export interface CircleDef {
  name: string;
  tags: string[];
  kind: "pet" | "person";
}

/**
 * People & pets circles — the future home of ML face-grouping clusters.
 * When face grouping lands, this list is replaced by computed clusters
 * (face id + representative cover + member ids) with the same shape, so
 * ExploreView and the sidebar can render it unchanged.
 */
export const PEOPLE_PETS: CircleDef[] = [
  { name: "Milo", tags: ["dog", "Milo"], kind: "pet" },
  { name: "Luna", tags: ["cat", "Luna"], kind: "pet" },
  { name: "Friends", tags: ["friends", "people"], kind: "person" },
];

export const PLACES: { label: string; match: string[] }[] = [
  { label: "Paris", match: ["Paris, France"] },
  { label: "Tokyo", match: ["Tokyo, Japan"] },
  { label: "San Francisco", match: ["San Francisco"] },
  { label: "Banff", match: ["Banff"] },
  { label: "Maui", match: ["Maui"] },
  { label: "Aspen", match: ["Aspen"] },
];

export interface ExploreCategory {
  id: string;
  label: string;
  tags: string[];
}

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  { id: "beaches", label: "Beaches", tags: ["beach", "ocean", "vacation"] },
  { id: "food", label: "Food & drink", tags: ["food", "pasta", "coffee", "cafe", "latte", "cake", "birthday", "dessert", "restaurant"] },
  { id: "animals", label: "Animals", tags: ["dog", "cat", "pets", "Milo", "Luna", "animals"] },
  { id: "nature", label: "Nature", tags: ["nature", "waterfall", "hiking", "forest", "landscape", "lake", "mountains"] },
  { id: "cities", label: "Cities", tags: ["city", "street", "neon", "urban", "paris", "eiffel"] },
  { id: "snow", label: "Snow", tags: ["winter", "snow", "cabin"] },
  { id: "sunsets", label: "Sunsets", tags: ["sunset", "summer", "vacation"] },
  { id: "people", label: "People", tags: ["friends", "people", "picnic"] },
];

/**
 * Search-overlay suggestion chips — deliberately data-driven so future
 * ML search (people, concepts like "rain", places) can surface dynamic
 * suggestions instead of this static list.
 */
export const SEARCH_CHIPS = [
  { label: "Milo", tags: ["dog", "Milo"] },
  { label: "Luna", tags: ["cat", "Luna"] },
  { label: "Coffee", tags: ["coffee", "cafe", "latte"] },
  { label: "Food", tags: ["food", "pasta", "restaurant", "dinner"] },
  { label: "Beach", tags: ["beach", "ocean"] },
  { label: "Paris", tags: ["paris", "eiffel"] },
  { label: "Winter", tags: ["winter", "snow"] },
  { label: "Nature", tags: ["nature", "hiking", "waterfall"] },
];
