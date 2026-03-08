import { useEffect } from "react";
import type { AnomalyLayerVisibility, DetectionRun } from "../types/anomaly";

interface AnomalyTogglePanelProps {
  runs: DetectionRun[];
  selectedRunId: number | null;
  onSelectRun: (id: number | null) => void;
  visibility: AnomalyLayerVisibility;
  onVisibilityChange: (v: AnomalyLayerVisibility) => void;
  jammingHours: string[];
  selectedHour: string | null;
  onSelectHour: (h: string | null) => void;
  onClose: () => void;
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-purple-400"
      />
      {label}
    </label>
  );
}

export default function AnomalyTogglePanel({
  runs,
  selectedRunId,
  onSelectRun,
  visibility,
  onVisibilityChange,
  jammingHours,
  selectedHour,
  onSelectHour,
  onClose,
}: AnomalyTogglePanelProps) {
  // Auto-select first hour when jamming becomes visible
  useEffect(() => {
    if (visibility.jammingGrid && !selectedHour && jammingHours.length > 0) {
      onSelectHour(jammingHours[0]);
    }
  }, [visibility.jammingGrid, selectedHour, jammingHours, onSelectHour]);

  const setField = (field: keyof AnomalyLayerVisibility, val: boolean) => {
    onVisibilityChange({ ...visibility, [field]: val });
  };

  const completedRuns = runs.filter((r) => r.status === "completed");

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm rounded border border-gray-700/50 p-2.5 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
          Anomalies
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 text-sm leading-none transition-colors"
          aria-label="Close anomaly panel"
        >
          {"\u00D7"}
        </button>
      </div>

      {/* Run selector */}
      {completedRuns.length > 0 && (
        <select
          value={selectedRunId ?? ""}
          onChange={(e) =>
            onSelectRun(e.target.value ? Number(e.target.value) : null)
          }
          className="w-full mb-2 bg-gray-700/80 text-gray-200 text-xs rounded px-1.5 py-1 border border-gray-600/50"
        >
          {completedRuns.map((run) => (
            <option key={run.id} value={run.id}>
              Run #{run.id}{" "}
              {run.window_start
                ? new Date(run.window_start).toLocaleDateString()
                : ""}
            </option>
          ))}
        </select>
      )}

      <div className="space-y-1.5">
        <Toggle
          label="Spoofing Events"
          checked={visibility.spoofing}
          onChange={(v) => setField("spoofing", v)}
        />
        {visibility.spoofing && (
          <div className="ml-4">
            <Toggle
              label="Show origin lines"
              checked={visibility.spoofingOriginLines}
              onChange={(v) => setField("spoofingOriginLines", v)}
            />
          </div>
        )}

        <Toggle
          label="Jamming Heatmap"
          checked={visibility.jammingGrid}
          onChange={(v) => setField("jammingGrid", v)}
        />

        <Toggle
          label="Transmitter Off"
          checked={visibility.transmitterOff}
          onChange={(v) => setField("transmitterOff", v)}
        />

        <Toggle
          label="Coverage Heatmap"
          checked={visibility.coverageHeatmap}
          onChange={(v) => setField("coverageHeatmap", v)}
        />
      </div>

      {/* Current hour label for jamming grid */}
      {visibility.jammingGrid && selectedHour && (
        <div className="mt-2 text-[10px] text-gray-400">
          Hour: {new Date(selectedHour).toLocaleString()}
        </div>
      )}
    </div>
  );
}
