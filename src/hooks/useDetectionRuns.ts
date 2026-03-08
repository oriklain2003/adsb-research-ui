import { useState, useEffect } from "react";
import type { DetectionRun } from "../types/anomaly";
import { API_URL } from "../lib/constants";

interface DetectionRunsResult {
  runs: DetectionRun[];
  latestRun: DetectionRun | null;
  loading: boolean;
}

export function useDetectionRuns(): DetectionRunsResult {
  const [runs, setRuns] = useState<DetectionRun[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();

    fetch(`${API_URL}/api/anomalies/runs`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<DetectionRun[]>;
      })
      .then((data) => {
        setRuns(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch detection runs:", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const latestRun = runs.find((r) => r.status === "completed") ?? null;

  return { runs, latestRun, loading };
}
