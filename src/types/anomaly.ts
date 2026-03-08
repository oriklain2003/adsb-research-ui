/** Detection run metadata. */
export interface DetectionRun {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: string;
  window_start: string | null;
  window_end: string | null;
  event_counts: Record<string, number> | null;
}

/** Single anomaly event from the detection pipeline. */
export interface AnomalyEvent {
  id: number;
  run_id: number;
  hex: string;
  category: string;
  source: string;
  start_ts: string;
  end_ts: string | null;
  duration_s: number | null;
  lat: number | null;
  lon: number | null;
  exit_lat: number | null;
  exit_lon: number | null;
  region: string | null;
  version: number | null;
  n_reports: number | null;
  jamming_score: number | null;
  spoofing_score: number | null;
  coverage_score: number | null;
  metadata: Record<string, unknown> | null;
}

/** Jamming grid cell for one hour window. */
export interface JammingGridCell {
  id: number;
  run_id: number;
  lat_cell: number;
  lon_cell: number;
  hour_start: string;
  total_reports: number;
  degraded_reports: number;
  jamming_pct: number;
  unique_aircraft: number;
}

/** Aircraft that flew through a jamming grid cell during a specific hour. */
export interface JammingCellFlight {
  hex: string;
  flight: string | null;
  total_reports: number;
  degraded_reports: number;
  first_ts: string;
  last_ts: string;
}

/** Coverage grid cell with quality metrics. */
export interface CoverageGridCell {
  id: number;
  run_id: number;
  lat_cell: number;
  lon_cell: number;
  median_rssi: number | null;
  total_reports: number | null;
  unique_aircraft: number | null;
  nacp_zero_count: number | null;
  gps_ok_count: number | null;
  reports_per_hour: number | null;
  temporal_coverage: number | null;
  is_coverage_hole: boolean | null;
  composite_score: number | null;
}

/** Visibility state for anomaly layers. */
export interface AnomalyLayerVisibility {
  spoofing: boolean;
  spoofingOriginLines: boolean;
  jammingGrid: boolean;
  transmitterOff: boolean;
  coverageHeatmap: boolean;
}
