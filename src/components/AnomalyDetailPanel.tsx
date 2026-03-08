import { Rnd } from "react-rnd";
import type { AnomalyEvent } from "../types/anomaly";

interface AnomalyDetailPanelProps {
  event: AnomalyEvent;
  onClose: () => void;
  onReplay: (hex: string, startTs: string, endTs: string) => void;
}

function Badge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    gps_spoofing: "bg-purple-600",
    gps_jamming: "bg-red-600",
    probable_jamming: "bg-orange-600",
    transponder_off: "bg-yellow-600",
    coverage_hole: "bg-gray-600",
    ambiguous: "bg-gray-500",
  };
  return (
    <span
      className={`${colors[category] ?? "bg-gray-500"} text-white text-[10px] px-1.5 py-0.5 rounded font-medium uppercase`}
    >
      {category.replace(/_/g, " ")}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-200 text-right tabular-nums">
        {value == null ? "\u2014" : String(value)}
      </span>
    </div>
  );
}

function SpoofingSection({ event }: { event: AnomalyEvent }) {
  const meta = event.metadata ?? {};
  return (
    <>
      <Field label="Position" value={event.lat != null ? `${event.lat.toFixed(4)}, ${event.lon!.toFixed(4)}` : null} />
      {meta.gps_ok_lat != null && (
        <Field label="Origin (GPS OK)" value={`${(meta.gps_ok_lat as number).toFixed(4)}, ${(meta.gps_ok_lon as number).toFixed(4)}`} />
      )}
      {meta.mean_alt_divergence_ft != null && (
        <Field label="Alt Divergence" value={`${Math.round(meta.mean_alt_divergence_ft as number)} ft`} />
      )}
      {meta.dist_nm != null && (
        <Field label="Jump Distance" value={`${Math.round(meta.dist_nm as number)} NM`} />
      )}
      {meta.implied_speed_kts != null && (
        <Field label="Implied Speed" value={`${Math.round(meta.implied_speed_kts as number)} kts`} />
      )}
      <Field label="Spoofing Score" value={event.spoofing_score} />
      <Field label="Jamming Score" value={event.jamming_score} />
    </>
  );
}

function JammingSection({ event }: { event: AnomalyEvent }) {
  const meta = event.metadata ?? {};
  return (
    <>
      <Field label="Region" value={event.region} />
      <Field label="Duration" value={event.duration_s != null ? `${Math.round(event.duration_s)}s` : null} />
      <Field label="Reports" value={event.n_reports} />
      <Field label="GPS OK Before" value={meta.has_gps_ok_before ? "Yes" : "No"} />
      <Field label="RSSI" value={meta.median_rssi != null ? `${(meta.median_rssi as number).toFixed(1)} dBFS` : null} />
      <Field label="Jamming Score" value={event.jamming_score} />
      <Field label="Coverage Score" value={event.coverage_score} />
    </>
  );
}

function TransponderOffSection({ event }: { event: AnomalyEvent }) {
  const meta = event.metadata ?? {};
  return (
    <>
      <Field label="Last Position" value={event.lat != null ? `${event.lat.toFixed(4)}, ${event.lon!.toFixed(4)}` : null} />
      <Field label="Gap Duration" value={event.duration_s != null ? `${Math.round(event.duration_s / 60)} min` : null} />
      {meta.reappear_lat != null && (
        <Field label="Reappeared" value={`${(meta.reappear_lat as number).toFixed(4)}, ${(meta.reappear_lon as number).toFixed(4)}`} />
      )}
      <Field label="Last Altitude" value={meta.last_alt_baro != null ? `${meta.last_alt_baro} ft` : null} />
      <Field label="Last RSSI" value={meta.last_rssi != null ? `${(meta.last_rssi as number).toFixed(1)} dBFS` : null} />
    </>
  );
}

export default function AnomalyDetailPanel({
  event,
  onClose,
  onReplay,
}: AnomalyDetailPanelProps) {
  const title = event.hex.toUpperCase();

  const handleReplay = () => {
    // Window ±30 minutes around the event
    const start = new Date(event.start_ts);
    const end = event.end_ts ? new Date(event.end_ts) : start;
    const padMs = 30 * 60 * 1000;
    const replayStart = new Date(start.getTime() - padMs).toISOString();
    const replayEnd = new Date(end.getTime() + padMs).toISOString();
    onReplay(event.hex, replayStart, replayEnd);
  };

  return (
    <Rnd
      default={{
        x: window.innerWidth - 360,
        y: 80,
        width: 320,
        height: 360,
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
          <div className="flex items-center gap-2 min-w-0">
            <Badge category={event.category} />
            <span className="text-sm font-bold text-gray-200 truncate">
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-2 text-lg leading-none text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close panel"
          >
            {"\u00D7"}
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 min-h-0 px-3 py-2 space-y-1">
          <Field label="Source" value={event.source.replace(/_/g, " ")} />
          <Field label="Version" value={event.version != null ? `V${event.version}` : null} />
          <Field label="Time" value={new Date(event.start_ts).toLocaleString()} />

          <div className="border-t border-gray-700/30 my-2" />

          {(event.category === "gps_spoofing") && <SpoofingSection event={event} />}
          {(event.category === "gps_jamming" || event.category === "probable_jamming") && <JammingSection event={event} />}
          {event.category === "transponder_off" && <TransponderOffSection event={event} />}
          {event.category === "coverage_hole" && <JammingSection event={event} />}
          {event.category === "ambiguous" && <JammingSection event={event} />}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-gray-700/50 shrink-0">
          <button
            onClick={handleReplay}
            className="w-full bg-blue-600/80 hover:bg-blue-500/80 text-white text-xs py-1.5 rounded transition-colors"
          >
            Replay Flight
          </button>
        </div>
      </div>
    </Rnd>
  );
}
