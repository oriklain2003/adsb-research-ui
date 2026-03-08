import type { TrailPoint } from "../types/aircraft";

interface PlaybackInfoCardProps {
  point: TrailPoint | null;
  accentColor?: string;
  typeDescription?: string | null;
  dbFlagsOverride?: number | null;
  onRemove?: () => void;
}

function fmt(val: number | null | undefined, decimals = 0, unit = ""): string {
  if (val == null) return "\u2014";
  const s = decimals > 0 ? val.toFixed(decimals) : String(Math.round(val));
  return unit ? `${s} ${unit}` : s;
}

function formatTs(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getTypeColor(dbFlags: number | null | undefined): string {
  if (dbFlags == null) return "text-gray-200";
  if ((dbFlags & 1) !== 0) return "text-red-400"; // military
  if ((dbFlags & 8) !== 0) return "text-blue-400"; // LADD
  return "text-gray-200";
}

function formatDbFlags(dbFlags: number | null | undefined): string {
  if (dbFlags == null || dbFlags === 0) return "\u2014";
  const tags: string[] = [];
  if (dbFlags & 1) tags.push("Military");
  if (dbFlags & 2) tags.push("Interesting");
  if (dbFlags & 4) tags.push("PIA");
  if (dbFlags & 8) tags.push("LADD");
  return tags.length > 0 ? tags.join(", ") : "\u2014";
}

const FIELDS: {
  label: string;
  get: (p: TrailPoint) => string;
}[] = [
  { label: "Time", get: (p) => formatTs(p.ts) },
  { label: "Callsign", get: (p) => p.flight ?? "\u2014" },
  { label: "Latitude", get: (p) => fmt(p.lat, 4) },
  { label: "Longitude", get: (p) => fmt(p.lon, 4) },
  { label: "Baro Alt", get: (p) => fmt(p.alt_baro, 0, "ft") },
  { label: "Geo Alt", get: (p) => fmt(p.alt_geom, 0, "ft") },
  { label: "Speed", get: (p) => fmt(p.gs, 0, "kt") },
  { label: "Track", get: (p) => (p.track != null ? `${Math.round(p.track)}\u00B0` : "\u2014") },
  { label: "On Ground", get: (p) => (p.on_ground == null ? "\u2014" : p.on_ground ? "Yes" : "No") },
  { label: "NIC", get: (p) => fmt(p.nic) },
  { label: "NACp", get: (p) => fmt(p.nac_p) },
  { label: "NACv", get: (p) => fmt(p.nac_v) },
  { label: "RSSI", get: (p) => fmt(p.rssi, 1, "dBFS") },
];

export default function PlaybackInfoCard({
  point,
  accentColor,
  typeDescription,
  dbFlagsOverride,
  onRemove,
}: PlaybackInfoCardProps) {
  if (!point) return null;

  return (
    <div className={`w-52 bg-gray-800/90 backdrop-blur-sm border ${accentColor ?? "border-gray-700/50"} rounded-lg shadow-lg overflow-hidden`}>
      <div className="px-3 py-1.5 border-b border-gray-700/50 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
          Flight Data
        </span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-500 hover:text-gray-300 text-sm leading-none"
            aria-label="Remove flight"
          >
            {"\u00D7"}
          </button>
        )}
      </div>
      <div className="px-3 py-2 space-y-0.5">
        {FIELDS.map((f) => (
          <div key={f.label} className="flex justify-between text-sm">
            <span className="text-gray-400">{f.label}</span>
            <span className="text-gray-200 tabular-nums">{f.get(point)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Type</span>
          <span className={`${getTypeColor(dbFlagsOverride ?? point.db_flags)} tabular-nums`}>
            {typeDescription ?? "\u2014"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Flags</span>
          <span className={`${getTypeColor(dbFlagsOverride ?? point.db_flags)} tabular-nums`}>
            {formatDbFlags(dbFlagsOverride ?? point.db_flags)}
          </span>
        </div>
      </div>
    </div>
  );
}
