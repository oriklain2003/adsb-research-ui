import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { TrailPoint } from "../types/aircraft";

export interface PlaybackState {
  playing: boolean;
  currentIndex: number;
  currentPoint: TrailPoint | null;
  currentTime: number;
  progress: number;
  speed: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (progress: number) => void;
  setSpeed: (speed: number) => void;
}

/**
 * Minimum playback speed multiplier so that the default 1x finishes a
 * multi-hour flight in a reasonable time (~60 s at 1x).
 */
const TARGET_1X_SECONDS = 60;

/** Find the index of the last timestamp <= time. Clamps to bounds. */
function findIndexForTime(timestamps: number[], time: number): number {
  if (timestamps.length === 0) return 0;
  if (time <= timestamps[0]) return 0;
  if (time >= timestamps[timestamps.length - 1]) return timestamps.length - 1;
  let idx = 0;
  for (let i = 0; i < timestamps.length - 1; i++) {
    if (timestamps[i + 1] > time) {
      idx = i;
      break;
    }
    idx = i + 1;
  }
  return idx;
}

export function useTrailPlayback(
  trail: TrailPoint[],
  overrideTimeRange?: { startTime: number; endTime: number },
): PlaybackState {
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeedState] = useState(1);
  // Absolute playback time (epoch ms in flight-time).
  // Tracked as state so seeking/animation outside the trail range updates the slider.
  const [playbackTime, setPlaybackTime] = useState(0);

  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  // Accumulated *real* milliseconds of the current inter-point gap (non-override mode)
  const accumulatedRef = useRef(0);
  // Refs so the rAF closure always reads latest values without re-registering
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;
  const playbackTimeRef = useRef(0);
  playbackTimeRef.current = playbackTime;
  const overrideRef = useRef(overrideTimeRange);
  overrideRef.current = overrideTimeRange;

  // Parse timestamps once per trail identity
  const timestamps = useMemo(
    () => trail.map((p) => new Date(p.ts).getTime()),
    [trail],
  );

  const totalDuration = useMemo(
    () =>
      timestamps.length >= 2
        ? timestamps[timestamps.length - 1] - timestamps[0]
        : 0,
    [timestamps],
  );

  // Effective duration: use override range if provided, else trail's own range
  const effectiveDuration = useMemo(
    () =>
      overrideTimeRange
        ? overrideTimeRange.endTime - overrideTimeRange.startTime
        : totalDuration,
    [overrideTimeRange, totalDuration],
  );

  // Base speed multiplier: compress total flight duration into ~TARGET_1X_SECONDS
  const baseMultiplier = useMemo(
    () =>
      effectiveDuration > 0
        ? effectiveDuration / (TARGET_1X_SECONDS * 1000)
        : 1,
    [effectiveDuration],
  );

  const effectiveStart = overrideTimeRange?.startTime ?? timestamps[0] ?? 0;
  const effectiveEnd = overrideTimeRange?.endTime ?? (timestamps[timestamps.length - 1] ?? 0);

  // When override is active, use tracked playbackTime (allows seeking outside trail range).
  // Otherwise derive from the trail index as before.
  const currentTime = overrideTimeRange
    ? playbackTime
    : timestamps.length > 0
      ? timestamps[Math.min(currentIndex, timestamps.length - 1)]
      : 0;

  const progress = effectiveDuration > 0
    ? Math.max(0, Math.min(1, (currentTime - effectiveStart) / effectiveDuration))
    : 0;

  const currentPoint =
    trail.length > 0 ? trail[Math.min(currentIndex, trail.length - 1)] : null;

  // Reset when trail changes
  useEffect(() => {
    const t0 = timestamps[0] ?? 0;
    setCurrentIndex(0);
    setPlaying(false);
    accumulatedRef.current = 0;
    indexRef.current = 0;
    playbackTimeRef.current = t0;
    setPlaybackTime(t0);
  }, [trail, timestamps]);

  // Animation loop
  useEffect(() => {
    if (!playing || trail.length < 2) return;

    lastFrameRef.current = performance.now();
    let stopped = false;

    const tick = (now: number) => {
      if (stopped) return;

      const dt = now - lastFrameRef.current;
      lastFrameRef.current = now;

      // Advance by dt * baseMultiplier * userSpeed (in "flight-time" ms)
      const advance = dt * baseMultiplier * speedRef.current;

      if (overrideRef.current) {
        // ── Time-based advancement for override mode ──
        playbackTimeRef.current += advance;

        const newIdx = findIndexForTime(timestamps, playbackTimeRef.current);
        if (newIdx !== indexRef.current) {
          indexRef.current = newIdx;
          setCurrentIndex(newIdx);
        }

        // Update playback time state so the slider moves
        setPlaybackTime(playbackTimeRef.current);

        if (playbackTimeRef.current >= overrideRef.current.endTime) {
          playbackTimeRef.current = overrideRef.current.endTime;
          setPlaybackTime(overrideRef.current.endTime);
          setPlaying(false);
          return;
        }
      } else {
        // ── Gap-based advancement (original logic, no override) ──
        accumulatedRef.current += advance;

        let idx = indexRef.current;
        while (idx < timestamps.length - 1) {
          const gap = timestamps[idx + 1] - timestamps[idx];
          if (accumulatedRef.current < gap) break;
          accumulatedRef.current -= gap;
          idx++;
        }

        if (idx !== indexRef.current) {
          indexRef.current = idx;
          setCurrentIndex(idx);
        }

        if (idx >= trail.length - 1) {
          setPlaying(false);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [playing, trail, timestamps, baseMultiplier]);

  const play = useCallback(() => {
    if (indexRef.current >= trail.length - 1) {
      const t0 = overrideTimeRange?.startTime ?? timestamps[0] ?? 0;
      setCurrentIndex(0);
      indexRef.current = 0;
      accumulatedRef.current = 0;
      playbackTimeRef.current = t0;
      setPlaybackTime(t0);
    }
    setPlaying(true);
  }, [trail.length, overrideTimeRange, timestamps]);

  const pause = useCallback(() => setPlaying(false), []);

  const togglePlay = useCallback(() => {
    if (playing) {
      pause();
    } else {
      play();
    }
  }, [playing, play, pause]);

  const seek = useCallback(
    (p: number) => {
      if (trail.length < 2) return;
      const targetTime = effectiveStart + p * effectiveDuration;
      const idx = findIndexForTime(timestamps, targetTime);
      setCurrentIndex(idx);
      indexRef.current = idx;
      accumulatedRef.current = 0;
      playbackTimeRef.current = targetTime;
      setPlaybackTime(targetTime);
    },
    [trail.length, timestamps, effectiveStart, effectiveDuration],
  );

  const setSpeed = useCallback((s: number) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  return {
    playing,
    currentIndex,
    currentPoint,
    currentTime,
    progress,
    speed,
    play,
    pause,
    togglePlay,
    seek,
    setSpeed,
  };
}
