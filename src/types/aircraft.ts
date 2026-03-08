/** Slim DTO for live aircraft list. Matches backend AircraftLive model. */
export interface AircraftLive {
  hex: string;
  flight: string | null;
  lat: number | null;
  lon: number | null;
  alt_baro: number | null;
  on_ground: boolean | null;
  gs: number | null;
  track: number | null;
  squawk: string | null;
  icao_type: string | null;
  registration: string | null;
}

/** Extended type with display properties computed from staleness and altitude. */
export interface AircraftDisplay extends AircraftLive {
  /** Opacity 0-255 based on staleness (255 = fresh, 0 = stale/removed) */
  opacity: number;
  /** Epoch ms when this aircraft was last seen in a WebSocket snapshot */
  receivedAt: number;
  /** Pre-computed altitude-based color to avoid per-frame recalculation */
  baseColor: [number, number, number, number];
  /** Longitude at the start of the current transition */
  fromLon: number;
  /** Latitude at the start of the current transition */
  fromLat: number;
  /** Track heading at the start of the current transition */
  fromTrack: number;
  /** Epoch ms when the current transition started */
  transitionStart: number;
}

/** Full detail from GET /api/aircraft/{hex}. Matches backend AircraftDetail model. */
export interface AircraftDetail {
  hex: string;
  registration: string | null;
  icao_type: string | null;
  type_description: string | null;
  db_flags: number | null;
  category: string | null;
  first_seen: string | null;
  last_seen: string | null;
  flight: string | null;
  lat: number | null;
  lon: number | null;
  alt_baro: number | null;
  alt_geom: number | null;
  on_ground: boolean | null;
  gs: number | null;
  ias: number | null;
  tas: number | null;
  mach: number | null;
  track: number | null;
  track_rate: number | null;
  roll: number | null;
  mag_heading: number | null;
  true_heading: number | null;
  baro_rate: number | null;
  geom_rate: number | null;
  squawk: string | null;
  emergency: string | null;
  nav_qnh: number | null;
  nav_altitude_mcp: number | null;
  nav_altitude_fms: number | null;
  nav_heading: number | null;
  source_type: string | null;
  rssi: number | null;
  messages: number | null;
  ts: string | null;
}

/** Summary of a historical flight segment. */
export interface FlightSummary {
  flight: string | null;
  start_ts: string;
  end_ts: string;
  origin_lat: number | null;
  origin_lon: number | null;
  dest_lat: number | null;
  dest_lon: number | null;
  max_alt: number | null;
  point_count: number;
}

/** Single point from GET /api/aircraft/{hex}/trail. */
export interface TrailPoint {
  hex: string;
  ts: string;
  flight: string | null;
  lat: number | null;
  lon: number | null;
  alt_baro: number | null;
  alt_geom: number | null;
  gs: number | null;
  track: number | null;
  on_ground: boolean | null;
  nic: number | null;
  nac_p: number | null;
  nac_v: number | null;
  rssi: number | null;
  db_flags: number | null;
}

/** Result from GET /api/aircraft/nearby. */
export interface NearbyFlightResult {
  hex: string;
  flight: string | null;
  icao_type: string | null;
  type_description: string | null;
  db_flags: number | null;
  distance_nm: number;
  closest_ts: string;
  start_ts: string;
  end_ts: string;
}
