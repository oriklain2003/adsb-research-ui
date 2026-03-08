/**
 * useAircraftData — manages the live aircraft dataset with client-side interpolation.
 *
 * ## Why client-side interpolation?
 *
 * deck.gl's built-in `transitions` config interpolates attribute values between
 * old and new buffers matched **by array index**. After the page is idle, stale
 * aircraft are evicted from the Map and a fresh WebSocket snapshot repopulates it
 * in a different insertion order. deck.gl then animates each index's old position
 * to its new position — even though those are different aircraft — causing all
 * planes to visibly swap positions.
 *
 * We avoid this by doing interpolation ourselves, keyed by ICAO hex (aircraft
 * identity) rather than array index:
 *
 * 1. Each `AircraftDisplay` stores `fromLon/fromLat/fromTrack` (the position the
 *    aircraft was displayed at when the snapshot arrived) and `transitionStart`.
 * 2. If a transition was already in-flight when a new snapshot arrives, the "from"
 *    position is computed from the current interpolated position (lerp at elapsed t),
 *    so the aircraft smoothly redirects rather than jumping.
 * 3. New aircraft (first appearance or reappearance after eviction) set from === target,
 *    so they appear instantly at their real position with no false transition.
 * 4. A `requestAnimationFrame` loop runs at ~30 fps for `TRANSITION_DURATION_MS`
 *    after each snapshot, incrementing `animTick` to trigger `updateTriggers` in
 *    the IconLayer so `getPosition`/`getAngle` accessors re-evaluate the lerp.
 */
import { useState, useEffect, useRef } from "react";
import type { AircraftDisplay } from "../types/aircraft";
import { useWebSocket, type WsState } from "./useWebSocket";
import { unwrapAngle } from "../lib/interpolation";
import { altitudeToColor } from "../lib/colors";
import {
  WS_URL,
  STALE_FADE_END_MS,
  EVICTION_GRACE_MS,
  TRANSITION_DURATION_MS,
} from "../lib/constants";

const EVICTION_THRESHOLD_MS = STALE_FADE_END_MS + EVICTION_GRACE_MS;

/** Linear interpolation between two values. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface AircraftDataResult {
  aircraft: AircraftDisplay[];
  activeCount: number;
  wsState: WsState;
  colorTick: number;
  lastSnapshotAt: number;
  /** Monotonically increasing counter driven by rAF; used as an updateTrigger. */
  animTick: number;
  /** Whether the live feed is connected. */
  liveEnabled: boolean;
  /** Toggle the live feed on/off. */
  setLiveEnabled: (enabled: boolean) => void;
}

export function useAircraftData(): AircraftDataResult {
  const [liveEnabled, setLiveEnabled] = useState(true);
  const { state, data, ts } = useWebSocket(WS_URL, liveEnabled);
  const stableMapRef = useRef<Map<string, AircraftDisplay>>(new Map());
  const [stableData, setStableData] = useState<AircraftDisplay[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [colorTick, setColorTick] = useState(0);
  const [lastSnapshotAt, setLastSnapshotAt] = useState(0);
  const [animTick, setAnimTick] = useState(0);

  // Clear aircraft when disconnected
  useEffect(() => {
    if (!liveEnabled) {
      stableMapRef.current.clear();
      setStableData([]);
      setActiveCount(0);
    }
  }, [liveEnabled]);

  // Process new snapshot — only runs when WebSocket delivers new data
  useEffect(() => {
    if (data.length === 0) return;

    const now = Date.now();
    const map = stableMapRef.current;
    const snapshotHexes = new Set<string>();

    for (const ac of data) {
      if (ac.lat == null || ac.lon == null) continue;
      snapshotHexes.add(ac.hex);

      const prev = map.get(ac.hex);

      // Compute "from" position: current interpolated position if mid-transition
      let fromLon: number;
      let fromLat: number;
      let fromTrack: number;

      if (prev) {
        const elapsed = now - prev.transitionStart;
        const t = Math.min(1, elapsed / TRANSITION_DURATION_MS);
        fromLon = lerp(prev.fromLon, prev.lon!, t);
        fromLat = lerp(prev.fromLat, prev.lat!, t);
        fromTrack = lerp(prev.fromTrack, prev.track ?? 0, t);
      } else {
        // New aircraft: start at its actual position (no transition)
        fromLon = ac.lon;
        fromLat = ac.lat;
        fromTrack = ac.track ?? 0;
      }

      // Unwrap target track relative to current displayed heading
      const targetTrack = ac.track ?? 0;
      const track = prev ? unwrapAngle(fromTrack, targetTrack) : targetTrack;

      map.set(ac.hex, {
        ...ac,
        track,
        opacity: 255,
        receivedAt: now,
        baseColor: altitudeToColor(ac.alt_baro, ac.on_ground),
        fromLon,
        fromLat,
        fromTrack,
        transitionStart: now,
      });
    }

    // Evict aircraft that have been fully invisible for the grace period
    const evictionCutoff = now - EVICTION_THRESHOLD_MS;
    for (const [hex, entry] of map) {
      if (entry.receivedAt < evictionCutoff) {
        map.delete(hex);
      }
    }

    setStableData(Array.from(map.values()));
    setActiveCount(snapshotHexes.size);
    setLastSnapshotAt(now);
  }, [data, ts]);

  // Animation loop: tick at ~30fps for TRANSITION_DURATION_MS after each snapshot
  useEffect(() => {
    if (lastSnapshotAt === 0) return;

    let active = true;
    let rafId: number;
    let lastFrame = 0;
    const endTime = lastSnapshotAt + TRANSITION_DURATION_MS;

    function tick(timestamp: number) {
      if (!active || Date.now() >= endTime) return;
      if (timestamp - lastFrame >= 33) {
        setAnimTick((t) => t + 1);
        lastFrame = timestamp;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, [lastSnapshotAt]);

  // Color tick: increment counter every 3s so updateTriggers refreshes getColor
  useEffect(() => {
    const id = setInterval(() => setColorTick((c) => c + 1), 3000);
    return () => clearInterval(id);
  }, []);

  return {
    aircraft: stableData,
    activeCount,
    wsState: state,
    colorTick,
    lastSnapshotAt,
    animTick,
    liveEnabled,
    setLiveEnabled,
  };
}
