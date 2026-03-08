import { Rnd } from "react-rnd";
import type { BatchAnomalyEvent } from "../types/batchAnomaly";

interface BatchAnomalyDetailPanelProps {
  event: BatchAnomalyEvent;
  onClose: () => void;
  onReplay: (hex: string, startTs: string, endTs: string) => void;
  onFullFlight: (hex: string, startTs: string) => void;
}

const RB_BADGE_COLORS: Record<string, string> = {
  gps_spoofing: "bg-purple-600",
  gps_jamming: "bg-red-600",
  probable_jamming: "bg-orange-600",
  coverage_hole: "bg-blue-600",
  transponder_off: "bg-yellow-600",
  ambiguous: "bg-gray-500",
};

const KALMAN_BADGE_COLORS: Record<string, string> = {
  gps_spoofing: "bg-pink-600",
  anomalous: "bg-cyan-600",
};

function Badge({
  label,
  colorClass,
}: {
  label: string;
  colorClass: string;
}) {
  return (
    <span
      className={`${colorClass} text-white text-[10px] px-1.5 py-0.5 rounded font-medium uppercase`}
    >
      {label}
    </span>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-200 text-right tabular-nums">
        {value == null ? "\u2014" : String(value)}
      </span>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">Confidence</span>
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-cyan-400 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-200 text-xs tabular-nums">{pct}%</span>
    </div>
  );
}

function RuleBasedDetail({ event }: { event: BatchAnomalyEvent & { _source: "rule_based" } }) {
  return (
    <>
      <Field label="Source" value={event.source.replace(/_/g, " ")} />
      <Field label="Region" value={event.region} />
      <Field label="Version" value={event.version != null ? `V${event.version}` : null} />
      <Field label="Time" value={new Date(event.start_ts).toLocaleString()} />
      <Field
        label="Duration"
        value={event.duration_s != null ? `${Math.round(event.duration_s)}s` : null}
      />
      <Field label="Reports" value={event.n_reports} />

      <div className="border-t border-gray-700/30 my-2" />

      {event.jamming_score != null && (
        <Field label="Jamming Score" value={event.jamming_score} />
      )}
      {event.spoofing_score != null && (
        <Field label="Spoofing Score" value={event.spoofing_score} />
      )}
      {event.coverage_score != null && (
        <Field label="Coverage Score" value={event.coverage_score} />
      )}
      {event.evidence && (
        <div className="mt-1">
          <span className="text-[10px] text-gray-500 uppercase">Evidence</span>
          <p className="text-xs text-gray-300 mt-0.5 break-words">{event.evidence}</p>
        </div>
      )}
    </>
  );
}

function KalmanDetail({ event }: { event: BatchAnomalyEvent & { _source: "kalman" } }) {
  const details = event.physics_details ?? {};
  return (
    <>
      <Field label="Time" value={new Date(event.start_ts).toLocaleString()} />
      <Field label="Positions" value={event.n_positions} />
      <Field label="Flagged" value={event.n_flagged} />
      <Field
        label="Flag %"
        value={event.flag_pct != null ? `${event.flag_pct.toFixed(1)}%` : null}
      />
      <Field label="Jumps" value={event.n_jumps} />
      <Field label="Alt Divergence" value={event.n_alt_divergence} />
      <Field label="Severe Alt Div" value={event.n_severe_alt_div} />

      <div className="border-t border-gray-700/30 my-2" />

      {event.physics_confidence != null && (
        <ConfidenceBar value={event.physics_confidence} />
      )}

      {Object.keys(details).length > 0 && (
        <div className="mt-1 space-y-0.5">
          <span className="text-[10px] text-gray-500 uppercase">Physics Details</span>
          {details.alt_div != null && (
            <Field label="Alt Divergence" value={String(details.alt_div)} />
          )}
          {details.gs_tas != null && (
            <Field label="GS/TAS" value={String(details.gs_tas)} />
          )}
          {details.track_hdg != null && (
            <Field label="Track/Heading" value={String(details.track_hdg)} />
          )}
          {details.vrate != null && (
            <Field label="V-Rate" value={String(details.vrate)} />
          )}
        </div>
      )}
    </>
  );
}

export default function BatchAnomalyDetailPanel({
  event,
  onClose,
  onReplay,
  onFullFlight,
}: BatchAnomalyDetailPanelProps) {
  const isRuleBased = event._source === "rule_based";
  const categoryLabel = isRuleBased
    ? event.category.replace(/_/g, " ")
    : event.classification.replace(/_/g, " ");
  const badgeColor = isRuleBased
    ? RB_BADGE_COLORS[event.category] ?? "bg-gray-500"
    : KALMAN_BADGE_COLORS[event.classification] ?? "bg-gray-500";

  const handleReplay = () => {
    const start = new Date(event.start_ts);
    const end = event.end_ts ? new Date(event.end_ts) : start;
    const padMs = 30 * 60 * 1000;
    const replayStart = new Date(start.getTime() - padMs).toISOString();
    const replayEnd = new Date(end.getTime() + padMs).toISOString();
    onReplay(event.hex, replayStart, replayEnd);
  };

  const handleFullFlight = () => {
    onFullFlight(event.hex, event.start_ts);
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
            <Badge label={categoryLabel} colorClass={badgeColor} />
            <span className="text-[10px] text-gray-500 uppercase">
              {isRuleBased ? "RB" : "Kalman"}
            </span>
            <span className="text-sm font-bold text-gray-200 truncate">
              {event.hex.toUpperCase()}
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
          {event.entry_lat != null && event.entry_lon != null && (
            <Field
              label="Entry"
              value={`${event.entry_lat.toFixed(4)}, ${event.entry_lon.toFixed(4)}`}
            />
          )}
          {event.exit_lat != null && event.exit_lon != null && (
            <Field
              label="Exit"
              value={`${event.exit_lat.toFixed(4)}, ${event.exit_lon.toFixed(4)}`}
            />
          )}

          <div className="border-t border-gray-700/30 my-2" />

          {isRuleBased ? (
            <RuleBasedDetail event={event as BatchAnomalyEvent & { _source: "rule_based" }} />
          ) : (
            <KalmanDetail event={event as BatchAnomalyEvent & { _source: "kalman" }} />
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-gray-700/50 shrink-0 flex gap-2">
          <button
            onClick={handleReplay}
            className="flex-1 bg-blue-600/80 hover:bg-blue-500/80 text-white text-xs py-1.5 rounded transition-colors"
          >
            Replay
          </button>
          <button
            onClick={handleFullFlight}
            className="flex-1 bg-gray-600/80 hover:bg-gray-500/80 text-white text-xs py-1.5 rounded transition-colors"
          >
            Full Flight
          </button>
        </div>
      </div>
    </Rnd>
  );
}
