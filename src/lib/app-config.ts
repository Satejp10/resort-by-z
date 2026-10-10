/**
 * Single source of truth for product identity and account-level figures.
 *
 * ML-search note (designing ahead, not implementing yet): upcoming features
 * are face grouping ("People & pets" clusters) and natural-word search
 * ("rain", "sunset on the beach", …). Keep this in mind when touching UI:
 *   - SearchOverlay chips / Search pipeline   -> future query suggestions
 *     will come from the same signal sources (see `matchesQuery` in
 *     photo-utils.ts, which is the single place queries resolve today).
 *   - ExploreView "People & pets" circles     -> future face-cluster grid;
 *     the circle rail is already horizontally scrollable on mobile.
 *   - Any new ML-driven section should render from a data module shaped
 *     like data/albums.ts (id + label + members) so views stay dumb.
 */

export const APP_NAME = "Resort";

export const APP_TAGLINE =
  "Your memories, beautifully organized — private by default.";

export const STORAGE = {
  /** GB consumed by photos, videos and other items. */
  usedGb: 69,
  /** Total plan capacity in GB. */
  totalGb: 100,
} as const;

export const storagePercent = () =>
  Math.round((STORAGE.usedGb / STORAGE.totalGb) * 100);
