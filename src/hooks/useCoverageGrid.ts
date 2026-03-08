import { useState, useEffect } from "react";
import type { CoverageGridCell } from "../types/anomaly";
import { API_URL } from "../lib/constants";

interface CoverageGridResult {
  cells: CoverageGridCell[];
  loading: boolean;
}

export function useCoverageGrid(runId: number | null): CoverageGridResult {
  const [cells, setCells] = useState<CoverageGridCell[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (runId == null) {
      setCells([]);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    fetch(`${API_URL}/api/anomalies/coverage-grid?run_id=${runId}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<CoverageGridCell[]>;
      })
      .then((data) => {
        setCells(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch coverage grid:", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [runId]);

  return { cells, loading };
}
