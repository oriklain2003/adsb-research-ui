import { Rnd } from "react-rnd";

interface AircraftDetailPanelProps {
  hex: string;
  data: Record<string, unknown> | null;
  loading: boolean;
  onClose: () => void;
}

interface FieldDef {
  label: string;
  value: string | number | boolean | null | undefined;
  unit?: string;
}

interface Section {
  title: string;
  fields: FieldDef[];
}

function formatValue(field: FieldDef): string {
  if (field.value == null) return "\u2014";
  if (typeof field.value === "boolean") return field.value ? "Yes" : "No";
  if (typeof field.value === "number" && field.unit) {
    return `${field.value}${field.unit === "\u00B0" ? "" : " "}${field.unit}`;
  }
  if (field.unit) return `${String(field.value)} ${field.unit}`;
  return String(field.value);
}

function formatCoord(val: unknown, decimals: number): string | null {
  if (val == null) return null;
  if (typeof val === "number") return val.toFixed(decimals);
  return String(val);
}

function buildSections(data: Record<string, unknown>): Section[] {
  return [
    {
      title: "Identity",
      fields: [
        { label: "Flight", value: data.flight as string | null },
        { label: "Hex", value: data.hex as string | null },
        { label: "Registration", value: data.registration as string | null },
        { label: "Type", value: data.icao_type as string | null },
        {
          label: "Description",
          value: data.type_description as string | null,
        },
        { label: "Category", value: data.category as string | null },
      ],
    },
    {
      title: "Position",
      fields: [
        {
          label: "Altitude",
          value: data.alt_baro as number | null,
          unit: "ft",
        },
        {
          label: "Geo Altitude",
          value: data.alt_geom as number | null,
          unit: "ft",
        },
        {
          label: "Ground Speed",
          value: data.gs as number | null,
          unit: "kt",
        },
        { label: "Track", value: data.track as number | null, unit: "\u00B0" },
        {
          label: "Latitude",
          value: formatCoord(data.lat, 4),
        },
        {
          label: "Longitude",
          value: formatCoord(data.lon, 4),
        },
        {
          label: "Baro Rate",
          value: data.baro_rate as number | null,
          unit: "ft/min",
        },
      ],
    },
    {
      title: "Status",
      fields: [
        { label: "Squawk", value: data.squawk as string | null },
        { label: "On Ground", value: data.on_ground as boolean | null },
        { label: "Emergency", value: data.emergency as string | null },
        { label: "Source", value: data.source_type as string | null },
        { label: "Messages", value: data.messages as number | null },
        { label: "Signal", value: data.rssi as number | null, unit: "dBFS" },
      ],
    },
  ];
}

export default function AircraftDetailPanel({
  hex,
  data,
  loading,
  onClose,
}: AircraftDetailPanelProps) {
  const title =
    data && typeof data.flight === "string" && data.flight.trim()
      ? data.flight.trim()
      : hex.toUpperCase();

  const sections = data ? buildSections(data) : [];

  return (
    <Rnd
      default={{
        x: window.innerWidth - 340,
        y: window.innerHeight - 420,
        width: 320,
        height: 400,
      }}
      minWidth={280}
      minHeight={200}
      bounds="parent"
      dragHandleClassName="drag-handle"
      className="rounded-lg bg-gray-800/90 shadow-lg backdrop-blur-sm border border-gray-700/50 z-20"
      style={{ animation: "fadeIn 0.15s ease-out" }}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header — drag handle */}
        <div className="drag-handle flex items-center justify-between px-3 py-2 border-b border-gray-700/50 cursor-move shrink-0">
          <span className="text-sm font-bold text-gray-200 truncate">
            {title}
          </span>
          <button
            onClick={onClose}
            className="ml-2 text-lg leading-none text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close panel"
          >
            {"\u00D7"}
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 min-h-0 px-3 py-2">
          {loading && !data ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading...
            </div>
          ) : (
            sections.map((section, si) => (
              <div key={section.title}>
                {si > 0 && <div className="border-t border-gray-700/30 my-2" />}
                <div className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.fields.map((field) => (
                    <div
                      key={field.label}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-400">{field.label}</span>
                      <span className="text-gray-200 text-right tabular-nums">
                        {formatValue(field)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Rnd>
  );
}
