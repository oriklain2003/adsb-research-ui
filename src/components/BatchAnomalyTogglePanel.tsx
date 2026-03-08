import type { BatchAnomalyVisibility, TimePreset } from "../types/batchAnomaly";

interface BatchAnomalyTogglePanelProps {
  visibility: BatchAnomalyVisibility;
  onVisibilityChange: (v: BatchAnomalyVisibility) => void;
  timePreset: TimePreset;
  onTimePresetChange: (p: TimePreset) => void;
  loading: boolean;
  eventCounts: { ruleBased: number; kalman: number };
  onClose: () => void;
}

const TIME_PRESETS: TimePreset[] = ["12h", "24h", "48h", "7d"];

interface LayerToggleProps {
  label: string;
  color: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function LayerToggle({ label, color, checked, onChange }: LayerToggleProps) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-purple-400"
      />
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {label}
    </label>
  );
}

export default function BatchAnomalyTogglePanel({
  visibility,
  onVisibilityChange,
  timePreset,
  onTimePresetChange,
  loading,
  eventCounts,
  onClose,
}: BatchAnomalyTogglePanelProps) {
  const setField = (field: keyof BatchAnomalyVisibility, val: boolean) => {
    onVisibilityChange({ ...visibility, [field]: val });
  };

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm rounded border border-gray-700/50 p-2.5 min-w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
          Batch Anomalies
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 text-sm leading-none transition-colors"
          aria-label="Close batch anomaly panel"
        >
          {"\u00D7"}
        </button>
      </div>

      {/* Time preset buttons */}
      <div className="flex gap-1 mb-2">
        {TIME_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onTimePresetChange(p)}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
              timePreset === p
                ? "bg-blue-600/80 text-white"
                : "bg-gray-700/60 text-gray-400 hover:text-gray-200"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Rule-Based section */}
      <div className="mb-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
          Rule-Based
        </div>
        <div className="space-y-1">
          <LayerToggle
            label="GPS Spoofing"
            color="rgb(160, 32, 240)"
            checked={visibility.rb_gps_spoofing}
            onChange={(v) => setField("rb_gps_spoofing", v)}
          />
          <LayerToggle
            label="GPS Jamming"
            color="rgb(220, 38, 38)"
            checked={visibility.rb_gps_jamming}
            onChange={(v) => setField("rb_gps_jamming", v)}
          />
          <LayerToggle
            label="Probable Jamming"
            color="rgb(249, 115, 22)"
            checked={visibility.rb_probable_jamming}
            onChange={(v) => setField("rb_probable_jamming", v)}
          />
          <LayerToggle
            label="Coverage Hole"
            color="rgb(59, 130, 246)"
            checked={visibility.rb_coverage_hole}
            onChange={(v) => setField("rb_coverage_hole", v)}
          />
          <LayerToggle
            label="Transponder Off"
            color="rgb(234, 179, 8)"
            checked={visibility.rb_transponder_off}
            onChange={(v) => setField("rb_transponder_off", v)}
          />
          <LayerToggle
            label="Ambiguous"
            color="rgb(156, 163, 175)"
            checked={visibility.rb_ambiguous}
            onChange={(v) => setField("rb_ambiguous", v)}
          />
        </div>
      </div>

      {/* Kalman section */}
      <div className="mb-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
          Kalman
        </div>
        <div className="space-y-1">
          <LayerToggle
            label="GPS Spoofing"
            color="rgb(236, 72, 153)"
            checked={visibility.k_gps_spoofing}
            onChange={(v) => setField("k_gps_spoofing", v)}
          />
          <LayerToggle
            label="Anomalous"
            color="rgb(34, 211, 238)"
            checked={visibility.k_anomalous}
            onChange={(v) => setField("k_anomalous", v)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-[10px] text-gray-500 border-t border-gray-700/30 pt-1">
        {loading ? (
          "Loading..."
        ) : (
          <>
            {eventCounts.ruleBased} rule-based, {eventCounts.kalman} kalman
          </>
        )}
      </div>
    </div>
  );
}
