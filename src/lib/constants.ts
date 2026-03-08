export const API_URL = import.meta.env.VITE_API_URL ?? "";

export const POLL_INTERVAL = 7_000; // 7 seconds

export const DEFAULT_VIEW = {
  longitude: 35,
  latitude: 40,
  zoom: 4,
  pitch: 0,
  bearing: 0,
} as const;

export const DARK_MATTER_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export const WS_URL =
  import.meta.env.VITE_WS_URL ??
  `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/live`;

export const STALE_FADE_START_MS = 30_000; // Start fading at 30s with no update
export const STALE_FADE_END_MS = 60_000; // Fully disappear at 60s
export const EVICTION_GRACE_MS = 5_000; // Extra time after fade-out before removing from map
export const TRANSITION_DURATION_MS = 7_000; // Client-side position interpolation duration
