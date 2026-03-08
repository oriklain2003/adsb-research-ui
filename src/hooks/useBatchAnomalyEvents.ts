import { useState, useEffect } from "react";
import type { RuleBasedEvent, KalmanEvent, TimePreset } from "../types/batchAnomaly";
import { API_URL } from "../lib/constants";

interface BatchAnomalyEventsResult {
  ruleBasedEvents: RuleBasedEvent[];
  kalmanEvents: KalmanEvent[];
  loading: boolean;
  error: string | null;
}

function presetToStartTs(preset: TimePreset): string {
  const ms: Record<TimePreset, number> = {
    "12h": 12 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "48h": 48 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() - ms[preset]).toISOString();
}

export function useBatchAnomalyEvents(
  enabled: boolean,
  timePreset: TimePreset,
): BatchAnomalyEventsResult {
  const [ruleBasedEvents, setRuleBasedEvents] = useState<RuleBasedEvent[]>([]);
  const [kalmanEvents, setKalmanEvents] = useState<KalmanEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setRuleBasedEvents([]);
      setKalmanEvents([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const controller = new AbortController();

    const startTs = presetToStartTs(timePreset);
    const params = new URLSearchParams({ start_ts: startTs });

    Promise.all([
      fetch(`${API_URL}/api/batch-anomalies/rule-based?${params}`, {
        signal: controller.signal,
      }).then((res) => {
        if (!res.ok) throw new Error(`Rule-based HTTP ${res.status}`);
        return res.json() as Promise<RuleBasedEvent[]>;
      }),
      fetch(`${API_URL}/api/batch-anomalies/kalman?${params}`, {
        signal: controller.signal,
      }).then((res) => {
        if (!res.ok) throw new Error(`Kalman HTTP ${res.status}`);
        return res.json() as Promise<KalmanEvent[]>;
      }),
    ])
      .then(([rb, k]) => {
        setRuleBasedEvents(rb);
        setKalmanEvents(k);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch batch anomaly events:", err);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [enabled, timePreset]);

  return { ruleBasedEvents, kalmanEvents, loading, error };
}
