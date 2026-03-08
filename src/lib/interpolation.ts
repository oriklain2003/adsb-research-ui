import { STALE_FADE_START_MS, STALE_FADE_END_MS } from "./constants";

/**
 * Compute opacity (0-255) based on how long since last update.
 * 255 = fresh, linearly fades to 0 between STALE_FADE_START_MS and STALE_FADE_END_MS.
 */
export function computeOpacity(receivedAt: number, now: number): number {
  const age = now - receivedAt;
  if (age <= STALE_FADE_START_MS) return 255;
  if (age >= STALE_FADE_END_MS) return 0;
  const t = (age - STALE_FADE_START_MS) / (STALE_FADE_END_MS - STALE_FADE_START_MS);
  return Math.round(255 * (1 - t));
}

/** Unwrap `to` angle so it's within 180° of `from` (shortest rotation path). */
export function unwrapAngle(from: number, to: number): number {
  let delta = to - from;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return from + delta;
}
