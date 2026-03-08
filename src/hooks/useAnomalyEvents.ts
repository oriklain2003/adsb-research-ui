import { useState, useEffect } from "react";
import type { AnomalyEvent } from "../types/anomaly";
import { API_URL } from "../lib/constants";

interface AnomalyEventsResult {
  events: AnomalyEvent[];
  loading: boolean;
  error: string | null;
}

export function useAnomalyEvents(
  runId: number | null,
  category?: string,
): AnomalyEventsResult {
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (runId == null) {
      setEvents([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const controller = new AbortController();

    const params = new URLSearchParams({ run_id: String(runId) });
    if (category) params.set("category", category);

    fetch(`${API_URL}/api/anomalies?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<AnomalyEvent[]>;
      })
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch anomaly events:", err);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [runId, category]);

  return { events, loading, error };
}
