import type { PlaybackState } from "../hooks/useTrailPlayback";
import type { TrailPoint } from "../types/aircraft";

interface PlaybackControlsProps {
  playback: PlaybackState;
  trail: TrailPoint[];
  onClose: () => void;
}

const SPEEDS = [1, 2, 5, 10];

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function PlaybackControls({
  playback,
  trail,
  onClose,
}: PlaybackControlsProps) {
  const { playing, currentPoint, progress, speed, togglePlay, seek, setSpeed } =
    playback;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-lg min-w-[420px]">
      {/* Play/pause */}
      <button
        onClick={togglePlay}
        className="text-gray-200 hover:text-white transition-colors text-lg w-8 h-8 flex items-center justify-center"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "\u23F8" : "\u25B6"}
      </button>

      {/* Timestamp */}
      <span className="text-xs text-gray-400 tabular-nums w-16 text-center shrink-0">
        {currentPoint ? formatTimestamp(currentPoint.ts) : "--:--:--"}
      </span>

      {/* Progress slider */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={progress}
        onChange={(e) => seek(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-blue-500 cursor-pointer"
      />

      {/* Altitude / speed readout */}
      <div className="text-xs text-gray-400 tabular-nums w-32 text-right shrink-0 leading-tight">
        <div>
          <span className="text-gray-500">B:</span>
          {currentPoint?.alt_baro != null ? ` ${currentPoint.alt_baro}` : " \u2014"}
          <span className="text-gray-500 ml-1">G:</span>
          {currentPoint?.alt_geom != null ? ` ${currentPoint.alt_geom}` : " \u2014"}
        </div>
        {currentPoint?.gs != null && (
          <span className="text-gray-500">{Math.round(currentPoint.gs)} kt</span>
        )}
      </div>

      {/* Speed selector */}
      <div className="flex gap-0.5 shrink-0">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
              speed === s
                ? "bg-blue-600/80 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-200 transition-colors text-lg leading-none ml-1"
        aria-label="Close playback"
      >
        {"\u00D7"}
      </button>
    </div>
  );
}
