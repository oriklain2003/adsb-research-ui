import { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import type { JammingGridCell, JammingCellFlight } from "../types/anomaly";
import { API_URL } from "../lib/constants";

interface JammingCellDetailPanelProps {
  cell: JammingGridCell;
  onClose: () => void;
  onReplay: (hex: string, startTs: string, endTs: string) => void;
}

export default function JammingCellDetailPanel({
  cell,
  onClose,
  onReplay,
}: JammingCellDetailPanelProps) {
  const [flights, setFlights] = useState<JammingCellFlight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    const params = new URLSearchParams({
      lat_cell: String(cell.lat_cell),
      lon_cell: String(cell.lon_cell),
      hour: cell.hour_start,
    });

    fetch(`${API_URL}/api/anomalies/jamming-grid/flights?${params}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<JammingCellFlight[]>;
      })
      .then((data) => {
        setFlights(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch jamming cell flights:", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [cell.lat_cell, cell.lon_cell, cell.hour_start]);

  return (
    <Rnd
      default={{
        x: window.innerWidth - 320,
        y: window.innerHeight / 2 - 200,
        width: 290,
        height: 380,
      }}
      minWidth={250}
      minHeight={220}
      bounds="parent"
      dragHandleClassName="drag-handle"
      className="rounded-lg bg-gray-800/90 shadow-lg backdrop-blur-sm border border-gray-700/50 z-20"
      style={{ animation: "fadeIn 0.15s ease-out" }}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="drag-handle flex items-center justify-between px-3 py-2 border-b border-gray-700/50 cursor-move shrink-0">
          <span className="text-xs font-bold text-gray-200">
            Jamming Cell
          </span>
          <button
            onClick={onClose}
            className="ml-2 text-lg leading-none text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close panel"
          >
            {"\u00D7"}
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 min-h-0 px-3 py-2">
          {/* Big jamming percentage */}
          <div className="text-center mb-3">
            <div className="text-3xl font-bold text-yellow-400 tabular-nums">
              {cell.jamming_pct.toFixed(1)}%
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
              Degraded Reports
            </div>
          </div>

          <div className="space-y-0.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Grid Cell</span>
              <span className="text-gray-200 tabular-nums">
                {cell.lat_cell.toFixed(1)}, {cell.lon_cell.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Reports</span>
              <span className="text-gray-200 tabular-nums">
                {cell.total_reports.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Degraded</span>
              <span className="text-gray-200 tabular-nums">
                {cell.degraded_reports.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Aircraft</span>
              <span className="text-gray-200 tabular-nums">
                {cell.unique_aircraft}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Hour</span>
              <span className="text-gray-200 text-xs">
                {new Date(cell.hour_start).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Affected Flights */}
          <div className="mt-3 border-t border-gray-700/50 pt-2">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
              Affected Flights
            </div>
            {loading ? (
              <div className="text-xs text-gray-500 text-center py-2">Loading...</div>
            ) : flights.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-2">No flights found</div>
            ) : (
              <div className="space-y-1">
                {flights.map((f) => (
                  <div
                    key={f.hex}
                    className="flex items-center justify-between gap-1.5 text-xs rounded px-1.5 py-1 bg-gray-700/40"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-gray-200 font-mono truncate">
                        {f.flight?.trim() || f.hex}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        {f.hex} &middot; {f.degraded_reports}/{f.total_reports} degraded
                      </span>
                    </div>
                    <button
                      onClick={() => onReplay(f.hex, f.first_ts, f.last_ts)}
                      className="shrink-0 px-1.5 py-0.5 rounded bg-yellow-600/30 text-yellow-400 hover:bg-yellow-600/50 transition-colors text-[10px] font-medium"
                    >
                      Replay
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Rnd>
  );
}
