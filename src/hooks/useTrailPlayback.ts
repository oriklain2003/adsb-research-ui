import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { TrailPoint } from "../types/aircraft";

export interface PlaybackState {
  playing: boolean;
  currentIndex: number;
  currentPoint: TrailPoint | null;
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

export function useTrailPlayback(trail: TrailPoint[]): PlaybackState {
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeedState] = useState(1);

  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  // Accumulated *real* milliseconds of the current inter-point gap
  const accumulatedRef = useRef(0);
  // Refs so the rAF closure always reads latest values without re-registering
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;

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

  // Base speed multiplier: compress total flight duration into ~TARGET_1X_SECONDS
  const baseMultiplier = useMemo(
    () => (totalDuration > 0 ? totalDuration / (TARGET_1X_SECONDS * 1000) : 1),
    [totalDuration],
  );

  const progress =
    totalDuration > 0 && timestamps.length >= 2
      ? (timestamps[Math.min(currentIndex, timestamps.length - 1)] -
          timestamps[0]) /
        totalDuration
      : 0;

  const currentPoint =
    trail.length > 0 ? trail[Math.min(currentIndex, trail.length - 1)] : null;

  // Reset when trail changes
  useEffect(() => {
    setCurrentIndex(0);
    setPlaying(false);
    accumulatedRef.current = 0;
    indexRef.current = 0;
  }, [trail]);

  // Animation loop — only depends on `playing` and stable refs
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
      accumulatedRef.current += advance;

      let idx = indexRef.current;
      // Consume accumulated time across point gaps
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
        return; // don't schedule another frame
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
    };
    // trail & timestamps are stable (useMemo); baseMultiplier derived from them
    // speed is read via ref; currentIndex via ref. Only `playing` triggers restart.
  }, [playing, trail, timestamps, baseMultiplier]);

  const play = useCallback(() => {
    if (indexRef.current >= trail.length - 1) {
      setCurrentIndex(0);
      indexRef.current = 0;
      accumulatedRef.current = 0;
    }
    setPlaying(true);
  }, [trail.length]);

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
      const targetTime = timestamps[0] + p * totalDuration;
      let idx = 0;
      for (let i = 0; i < timestamps.length - 1; i++) {
        if (timestamps[i + 1] > targetTime) break;
        idx = i + 1;
      }
      setCurrentIndex(idx);
      indexRef.current = idx;
      accumulatedRef.current = 0;
    },
    [trail.length, timestamps, totalDuration],
  );

  const setSpeed = useCallback((s: number) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  return {
    playing,
    currentIndex,
    currentPoint,
    progress,
    speed,
    play,
    pause,
    togglePlay,
    seek,
    setSpeed,
  };
}
