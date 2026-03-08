import { useState, useEffect } from "react";
import type { AircraftDetail, FlightSummary } from "../types/aircraft";
import { API_URL } from "../lib/constants";

interface FlightSearchResult {
  aircraft: AircraftDetail | null;
  flights: FlightSummary[];
  loading: boolean;
  error: string | null;
}

export function useFlightSearch(hex: string | null): FlightSearchResult {
  const [aircraft, setAircraft] = useState<AircraftDetail | null>(null);
  const [flights, setFlights] = useState<FlightSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hex) {
      setAircraft(null);
      setFlights([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setAircraft(null);
    setFlights([]);

    const controller = new AbortController();

    Promise.all([
      fetch(`${API_URL}/api/aircraft/${hex}`, { signal: controller.signal })
        .then((res) => {
          if (res.status === 404) return null;
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<AircraftDetail>;
        }),
      fetch(`${API_URL}/api/aircraft/${hex}/flights`, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<FlightSummary[]>;
        }),
    ])
      .then(([acData, flightsData]) => {
        setAircraft(acData);
        setFlights(flightsData);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Flight search failed:", err);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [hex]);

  return { aircraft, flights, loading, error };
}
