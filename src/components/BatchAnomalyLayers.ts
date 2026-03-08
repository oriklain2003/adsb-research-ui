import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import type { RuleBasedEvent, KalmanEvent, BatchAnomalyEvent } from "../types/batchAnomaly";

// --- Color mapping ---

const RB_COLORS: Record<string, [number, number, number, number]> = {
  gps_spoofing: [160, 32, 240, 200],
  gps_jamming: [220, 38, 38, 200],
  probable_jamming: [249, 115, 22, 200],
  coverage_hole: [59, 130, 246, 200],
  transponder_off: [234, 179, 8, 200],
  ambiguous: [156, 163, 175, 200],
};

const KALMAN_COLORS: Record<string, [number, number, number, number]> = {
  gps_spoofing: [236, 72, 153, 200],
  anomalous: [34, 211, 238, 200],
};

// --- Rule-Based layers ---

export function createRuleBasedDotLayer(
  category: string,
  events: RuleBasedEvent[],
  onSelect: (event: BatchAnomalyEvent) => void,
) {
  const data = events.filter(
    (e) => e.category === category && e.entry_lat != null && e.entry_lon != null,
  );
  return new ScatterplotLayer<RuleBasedEvent>({
    id: `batch-rb-${category}`,
    data,
    getPosition: (d) => [d.entry_lon!, d.entry_lat!],
    getRadius: 3000,
    getFillColor: RB_COLORS[category] ?? [156, 163, 175, 200],
    radiusMinPixels: 3,
    radiusMaxPixels: 16,
    pickable: true,
    onClick: ({ object }) => {
      if (object) onSelect({ ...object, _source: "rule_based" });
    },
  });
}

export function createRuleBasedLineLayer(
  category: string,
  events: RuleBasedEvent[],
) {
  const data = events.filter(
    (e) =>
      e.category === category &&
      e.entry_lat != null &&
      e.entry_lon != null &&
      e.exit_lat != null &&
      e.exit_lon != null,
  );
  const color = RB_COLORS[category] ?? [156, 163, 175, 200];
  return new LineLayer<RuleBasedEvent>({
    id: `batch-rb-line-${category}`,
    data,
    getSourcePosition: (d) => [d.entry_lon!, d.entry_lat!],
    getTargetPosition: (d) => [d.exit_lon!, d.exit_lat!],
    getColor: [color[0], color[1], color[2], 120],
    getWidth: 2,
    widthMinPixels: 1,
    pickable: false,
  });
}

// --- Kalman layers ---

export function createKalmanDotLayer(
  classification: string,
  events: KalmanEvent[],
  onSelect: (event: BatchAnomalyEvent) => void,
) {
  const data = events.filter(
    (e) =>
      e.classification === classification &&
      e.entry_lat != null &&
      e.entry_lon != null,
  );
  return new ScatterplotLayer<KalmanEvent>({
    id: `batch-k-${classification}`,
    data,
    getPosition: (d) => [d.entry_lon!, d.entry_lat!],
    getRadius: 3500,
    getFillColor: KALMAN_COLORS[classification] ?? [156, 163, 175, 200],
    radiusMinPixels: 3,
    radiusMaxPixels: 18,
    pickable: true,
    onClick: ({ object }) => {
      if (object) onSelect({ ...object, _source: "kalman" });
    },
  });
}

export function createKalmanLineLayer(
  classification: string,
  events: KalmanEvent[],
) {
  const data = events.filter(
    (e) =>
      e.classification === classification &&
      e.entry_lat != null &&
      e.entry_lon != null &&
      e.exit_lat != null &&
      e.exit_lon != null,
  );
  const color = KALMAN_COLORS[classification] ?? [156, 163, 175, 200];
  return new LineLayer<KalmanEvent>({
    id: `batch-k-line-${classification}`,
    data,
    getSourcePosition: (d) => [d.entry_lon!, d.entry_lat!],
    getTargetPosition: (d) => [d.exit_lon!, d.exit_lat!],
    getColor: [color[0], color[1], color[2], 120],
    getWidth: 2,
    widthMinPixels: 1,
    pickable: false,
  });
}
