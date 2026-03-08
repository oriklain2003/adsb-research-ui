/** Single rule-based batch anomaly event. */
export interface RuleBasedEvent {
  id: number;
  run_ts: string;
  hex: string;
  category: string;
  source: string;
  start_ts: string;
  end_ts: string | null;
  duration_s: number | null;
  entry_lat: number | null;
  entry_lon: number | null;
  exit_lat: number | null;
  exit_lon: number | null;
  region: string | null;
  version: number | null;
  n_reports: number | null;
  jamming_score: number | null;
  spoofing_score: number | null;
  coverage_score: number | null;
  evidence: string | null;
  metadata: Record<string, unknown> | null;
}

/** Single Kalman-based batch anomaly event. */
export interface KalmanEvent {
  id: number;
  run_ts: string;
  hex: string;
  classification: string;
  start_ts: string;
  end_ts: string | null;
  n_positions: number | null;
  n_flagged: number | null;
  flag_pct: number | null;
  n_jumps: number | null;
  n_alt_divergence: number | null;
  n_severe_alt_div: number | null;
  physics_confidence: number | null;
  physics_details: Record<string, unknown> | null;
  entry_lat: number | null;
  entry_lon: number | null;
  exit_lat: number | null;
  exit_lon: number | null;
  metadata: Record<string, unknown> | null;
}

/** Discriminated union for detail panel click handling. */
export type BatchAnomalyEvent =
  | (RuleBasedEvent & { _source: "rule_based" })
  | (KalmanEvent & { _source: "kalman" });

/** Visibility state for the 8 batch anomaly layers. */
export interface BatchAnomalyVisibility {
  rb_gps_spoofing: boolean;
  rb_gps_jamming: boolean;
  rb_probable_jamming: boolean;
  rb_coverage_hole: boolean;
  rb_transponder_off: boolean;
  rb_ambiguous: boolean;
  k_gps_spoofing: boolean;
  k_anomalous: boolean;
}

export type TimePreset = "12h" | "24h" | "48h" | "7d";
