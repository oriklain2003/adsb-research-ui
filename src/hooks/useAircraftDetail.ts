import { useState, useEffect } from "react";
import type { AircraftDetail } from "../types/aircraft";
import { API_URL } from "../lib/constants";

interface AircraftDetailResult {
  detail: AircraftDetail | null;
  loading: boolean;
}

export function useAircraftDetail(hex: string | null): AircraftDetailResult {
  const [detail, setDetail] = useState<AircraftDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hex) {
      setDetail(null);
      return;
    }

    setDetail(null);
    setLoading(true);

    const controller = new AbortController();

    fetch(`${API_URL}/api/aircraft/${hex}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: AircraftDetail) => {
        setDetail(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch aircraft detail:", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [hex]);

  return { detail, loading };
}
