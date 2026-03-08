import { useState, useEffect } from "react";
import type { JammingGridCell } from "../types/anomaly";
import { API_URL } from "../lib/constants";

interface JammingGridResult {
  cells: JammingGridCell[];
  hours: string[];
  loading: boolean;
}

export function useJammingGrid(
  runId: number | null,
  selectedHour: string | null,
): JammingGridResult {
  const [cells, setCells] = useState<JammingGridCell[]>([]);
  const [hours, setHours] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch available hours
  useEffect(() => {
    if (runId == null) {
      setHours([]);
      return;
    }

    const controller = new AbortController();
    fetch(`${API_URL}/api/anomalies/jamming-grid/hours?run_id=${runId}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<string[]>;
      })
      .then(setHours)
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch jamming grid hours:", err);
        }
      });

    return () => controller.abort();
  }, [runId]);

  // Fetch grid cells for selected hour
  useEffect(() => {
    if (runId == null || selectedHour == null) {
      setCells([]);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const params = new URLSearchParams({
      run_id: String(runId),
      hour: selectedHour,
    });

    fetch(`${API_URL}/api/anomalies/jamming-grid?${params}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<JammingGridCell[]>;
      })
      .then((data) => {
        setCells(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch jamming grid:", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [runId, selectedHour]);

  return { cells, hours, loading };
}
