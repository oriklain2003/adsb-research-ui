import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../lib/constants";
import type { NearbyFlightResult } from "../types/aircraft";

interface NearbySearchModalProps {
  lat: number;
  lon: number;
  time: string;
  excludeHex: string;
  onSelect: (result: NearbyFlightResult) => void;
  onClose: () => void;
}

function formatOverlap(startTs: string, endTs: string): string {
  const start = new Date(startTs);
  const end = new Date(endTs);
  const durationMin = (end.getTime() - start.getTime()) / 60_000;
  if (durationMin < 1) return "<1 min";
  if (durationMin < 60) return `${Math.round(durationMin)} min`;
  const h = Math.floor(durationMin / 60);
  const m = Math.round(durationMin % 60);
  return `${h}h ${m}m`;
}

export default function NearbySearchModal({
  lat,
  lon,
  time,
  excludeHex,
  onSelect,
  onClose,
}: NearbySearchModalProps) {
  const [radiusNm, setRadiusNm] = useState(5);
  const [timeWindowMin, setTimeWindowMin] = useState(60);
  const [results, setResults] = useState<NearbyFlightResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(() => {
    setLoading(true);
    fetch(
      `${API_URL}/api/aircraft/nearby?lat=${lat}&lon=${lon}&time=${encodeURIComponent(time)}&distance_nm=${radiusNm}&time_window_min=${timeWindowMin}&exclude_hex=${excludeHex}`,
    )
      .then((res) => res.json())
      .then((data: NearbyFlightResult[]) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Nearby search failed:", err);
        setLoading(false);
      });
  }, [lat, lon, time, radiusNm, timeWindowMin, excludeHex]);

  // Auto-trigger search on mount
  useEffect(() => {
    search();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-xl w-96 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-200">
            Find Nearby Flights
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-lg leading-none"
            aria-label="Close"
          >
            {"\u00D7"}
          </button>
        </div>

        {/* Config row */}
        <div className="px-4 py-2.5 border-b border-gray-700/50 flex items-center gap-3">
          <label className="text-xs text-gray-400 flex items-center gap-1.5">
            Radius
            <input
              type="number"
              min="1"
              value={radiusNm}
              onChange={(e) => setRadiusNm(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 text-gray-200 rounded px-2 py-1 w-16 text-sm"
            />
            <span className="text-gray-500">NM</span>
          </label>
          <label className="text-xs text-gray-400 flex items-center gap-1.5">
            Window
            <input
              type="number"
              min="1"
              value={timeWindowMin}
              onChange={(e) => setTimeWindowMin(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 text-gray-200 rounded px-2 py-1 w-16 text-sm"
            />
            <span className="text-gray-500">min</span>
          </label>
          <button
            onClick={search}
            className="text-xs text-gray-200 bg-blue-600/80 hover:bg-blue-600 px-3 py-1 rounded transition-colors shrink-0"
          >
            Search
          </button>
        </div>

        {/* Results list */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <p className="text-xs text-gray-400 text-center py-8">
              Searching...
            </p>
          )}
          {!loading && results.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">
              No nearby flights found
            </p>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={r.hex}
                onClick={() => onSelect(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700/50 transition-colors border-b border-gray-700/30 last:border-b-0"
              >
                <div className="text-gray-200 text-sm font-medium">
                  {r.flight?.trim() || r.hex}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
                  {r.icao_type && <span>{r.icao_type}</span>}
                  <span>{r.distance_nm.toFixed(1)} NM</span>
                  <span>{formatOverlap(r.start_ts, r.end_ts)}</span>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
