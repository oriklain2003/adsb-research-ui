import { useState } from "react";
import { Rnd } from "react-rnd";
import { useFlightSearch } from "../hooks/useFlightSearch";
import type { FlightSummary } from "../types/aircraft";

interface HexSearchPanelProps {
  onSelectFlight: (hex: string, startTs: string, endTs: string) => void;
  onClose: () => void;
}

function formatDuration(startTs: string, endTs: string): string {
  const ms = new Date(endTs).getTime() - new Date(startTs).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAlt(alt: number | null): string {
  if (alt == null) return "\u2014";
  return `FL${Math.round(alt / 100)}`;
}

function FlightRow({
  flight,
  onSelect,
}: {
  flight: FlightSummary;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-700/50 transition-colors"
    >
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-medium text-gray-200">
          {flight.flight?.trim() || "No callsign"}
        </span>
        <span className="text-xs text-gray-400">
          {formatAlt(flight.max_alt)}
        </span>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{formatDate(flight.start_ts)}</span>
        <span>{formatDuration(flight.start_ts, flight.end_ts)}</span>
      </div>
    </button>
  );
}

export default function HexSearchPanel({
  onSelectFlight,
  onClose,
}: HexSearchPanelProps) {
  const [input, setInput] = useState("");
  const [searchHex, setSearchHex] = useState<string | null>(null);
  const { aircraft, flights, loading, error } = useFlightSearch(searchHex);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim().toLowerCase();
    if (trimmed) setSearchHex(trimmed);
  };

  return (
    <Rnd
      default={{
        x: 16,
        y: 80,
        width: 320,
        height: 460,
      }}
      minWidth={280}
      minHeight={200}
      bounds="parent"
      dragHandleClassName="drag-handle"
      className="rounded-lg bg-gray-800/90 shadow-lg backdrop-blur-sm border border-gray-700/50 z-20"
      style={{ animation: "fadeIn 0.15s ease-out" }}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="drag-handle flex items-center justify-between px-3 py-2 border-b border-gray-700/50 cursor-move shrink-0">
          <span className="text-sm font-bold text-gray-200">Flight Search</span>
          <button
            onClick={onClose}
            className="ml-2 text-lg leading-none text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close panel"
          >
            {"\u00D7"}
          </button>
        </div>

        {/* Search input */}
        <form onSubmit={handleSubmit} className="px-3 py-2 shrink-0">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ICAO hex (e.g. 4b1613)"
              className="flex-1 bg-gray-700/60 text-sm text-gray-200 placeholder-gray-500 px-2.5 py-1.5 rounded border border-gray-600/50 focus:outline-none focus:border-blue-500/50"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-blue-600/80 hover:bg-blue-600 text-white rounded transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Aircraft identity */}
        {aircraft && (
          <div className="px-3 pb-1.5 shrink-0 border-b border-gray-700/30">
            <div className="text-sm text-gray-200">
              {aircraft.registration && (
                <span className="font-medium">{aircraft.registration}</span>
              )}
              {aircraft.icao_type && (
                <span className="text-gray-400 ml-1.5">{aircraft.icao_type}</span>
              )}
              {aircraft.type_description && (
                <span className="text-gray-500 ml-1.5 text-xs">
                  {aircraft.type_description}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Flight list */}
        <div className="overflow-y-auto flex-1 min-h-0 px-1.5 py-1">
          {loading && (
            <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
              Loading...
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-20 text-red-400 text-sm">
              {error}
            </div>
          )}
          {!loading && !error && searchHex && flights.length === 0 && (
            <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
              No flights found
            </div>
          )}
          {flights.map((f, i) => (
            <FlightRow
              key={`${f.start_ts}-${i}`}
              flight={f}
              onSelect={() => onSelectFlight(searchHex!, f.start_ts, f.end_ts)}
            />
          ))}
        </div>
      </div>
    </Rnd>
  );
}
