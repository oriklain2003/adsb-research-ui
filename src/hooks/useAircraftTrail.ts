import { useState, useEffect, useRef } from "react";
import type { AircraftDisplay, TrailPoint } from "../types/aircraft";
import { API_URL } from "../lib/constants";

interface AircraftTrailResult {
  trail: TrailPoint[];
  loading: boolean;
}

const MAX_TRAIL_POINTS = 1000;

export function useAircraftTrail(
  hex: string | null,
  aircraft: AircraftDisplay[],
): AircraftTrailResult {
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const lastAppended = useRef<{ lat: number; lon: number } | null>(null);

  // Fetch historical trail on selection change
  useEffect(() => {
    lastAppended.current = null;

    if (!hex) {
      setTrail([]);
      return;
    }

    setTrail([]);
    setLoading(true);

    const controller = new AbortController();

    fetch(`${API_URL}/api/aircraft/${hex}/trail?minutes=120`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: TrailPoint[]) => {
        setTrail(data);
        setLoading(false);
        // Seed lastAppended from the last fetched point
        if (data.length > 0) {
          const last = data[data.length - 1];
          if (last.lat != null && last.lon != null) {
            lastAppended.current = { lat: last.lat, lon: last.lon };
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch aircraft trail:", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [hex]);

  // Append live positions from WebSocket snapshots
  useEffect(() => {
    if (!hex) return;

    const ac = aircraft.find((a) => a.hex === hex);
    if (!ac || ac.lat == null || ac.lon == null) return;

    const prev = lastAppended.current;
    if (prev && prev.lat === ac.lat && prev.lon === ac.lon) return;

    lastAppended.current = { lat: ac.lat, lon: ac.lon };

    const point: TrailPoint = {
      hex: ac.hex,
      ts: new Date().toISOString(),
      lat: ac.lat,
      lon: ac.lon,
      alt_baro: ac.alt_baro,
      alt_geom: null,
      gs: ac.gs,
      track: ac.track,
      on_ground: ac.on_ground,
      nic: null,
      nac_p: null,
      nac_v: null,
      rssi: null,
    };

    setTrail((prev) => {
      const next = [...prev, point];
      return next.length > MAX_TRAIL_POINTS ? next.slice(-MAX_TRAIL_POINTS) : next;
    });
  }, [hex, aircraft]);

  return { trail, loading };
}
