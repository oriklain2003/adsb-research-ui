import { ScatterplotLayer, PolygonLayer, LineLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import type { AnomalyEvent, JammingGridCell, CoverageGridCell } from "../types/anomaly";

const GRID_SIZE = 0.5; // degrees, must match detection script

// --- Color helpers ---

function jammingColor(pct: number): [number, number, number, number] {
  // 0% → green, 50% → yellow, 100% → red
  const t = Math.min(pct / 100, 1);
  if (t < 0.5) {
    const s = t * 2;
    return [
      Math.round(80 + (255 - 80) * s),
      Math.round(220 + (220 - 220) * s),
      Math.round(80 - 80 * s),
      160,
    ];
  }
  const s = (t - 0.5) * 2;
  return [
    255,
    Math.round(220 - 180 * s),
    Math.round(80 - 40 * s),
    160,
  ];
}

// --- Spoofing Layers ---

export function createSpoofingLayer(
  events: AnomalyEvent[],
  onSelect: (event: AnomalyEvent) => void,
) {
  const spoofing = events.filter(
    (e) => e.category === "gps_spoofing" && e.lat != null && e.lon != null,
  );
  return new ScatterplotLayer<AnomalyEvent>({
    id: "anomaly-spoofing",
    data: spoofing,
    getPosition: (d) => [d.lon!, d.lat!],
    getRadius: (d) => 3000 + (d.spoofing_score ?? 0) * 1000,
    getFillColor: [160, 32, 240, 180], // purple
    radiusMinPixels: 4,
    radiusMaxPixels: 20,
    pickable: true,
    onClick: ({ object }) => {
      if (object) onSelect(object);
    },
  });
}

export function createSpoofingOriginLayer(events: AnomalyEvent[]) {
  const withOrigin = events.filter(
    (e) =>
      e.category === "gps_spoofing" &&
      e.metadata?.gps_ok_lat != null &&
      e.metadata?.gps_ok_lon != null,
  );
  return new ScatterplotLayer<AnomalyEvent>({
    id: "anomaly-spoofing-origin",
    data: withOrigin,
    getPosition: (d) => [
      d.metadata!.gps_ok_lon as number,
      d.metadata!.gps_ok_lat as number,
    ],
    getRadius: 2000,
    getFillColor: [80, 200, 80, 180], // green
    radiusMinPixels: 3,
    radiusMaxPixels: 12,
    pickable: false,
  });
}

export function createSpoofingLineLayer(events: AnomalyEvent[]) {
  const withOrigin = events.filter(
    (e) =>
      e.category === "gps_spoofing" &&
      e.lat != null &&
      e.lon != null &&
      e.metadata?.gps_ok_lat != null &&
      e.metadata?.gps_ok_lon != null,
  );
  return new LineLayer<AnomalyEvent>({
    id: "anomaly-spoofing-lines",
    data: withOrigin,
    getSourcePosition: (d) => [
      d.metadata!.gps_ok_lon as number,
      d.metadata!.gps_ok_lat as number,
    ],
    getTargetPosition: (d) => [d.lon!, d.lat!],
    getColor: [255, 220, 40, 150], // yellow
    getWidth: 2,
    widthMinPixels: 1,
    pickable: false,
  });
}

// --- Jamming Grid Layer ---

interface GridPolygon {
  polygon: [number, number][];
  cell: JammingGridCell;
}

export function createJammingGridLayer(
  cells: JammingGridCell[],
  onSelect: (cell: JammingGridCell) => void,
) {
  const polygons: GridPolygon[] = cells.map((cell) => ({
    polygon: [
      [cell.lon_cell, cell.lat_cell],
      [cell.lon_cell + GRID_SIZE, cell.lat_cell],
      [cell.lon_cell + GRID_SIZE, cell.lat_cell + GRID_SIZE],
      [cell.lon_cell, cell.lat_cell + GRID_SIZE],
    ],
    cell,
  }));

  return new PolygonLayer<GridPolygon>({
    id: "anomaly-jamming-grid",
    data: polygons,
    getPolygon: (d) => d.polygon,
    getFillColor: (d) => jammingColor(d.cell.jamming_pct),
    getLineColor: [255, 255, 255, 40],
    lineWidthMinPixels: 1,
    filled: true,
    stroked: true,
    pickable: true,
    onClick: ({ object }) => {
      if (object) onSelect(object.cell);
    },
  });
}

// --- Transmitter Off Layer ---

export function createTransmitterOffLayer(
  events: AnomalyEvent[],
  onSelect: (event: AnomalyEvent) => void,
) {
  const shutdowns = events.filter(
    (e) => e.category === "transponder_off" && e.lat != null && e.lon != null,
  );
  return new ScatterplotLayer<AnomalyEvent>({
    id: "anomaly-transmitter-off",
    data: shutdowns,
    getPosition: (d) => [d.lon!, d.lat!],
    getRadius: 4000,
    getFillColor: [255, 200, 40, 180], // gold
    radiusMinPixels: 4,
    radiusMaxPixels: 16,
    pickable: true,
    onClick: ({ object }) => {
      if (object) onSelect(object);
    },
  });
}

// --- Coverage Heatmap Layer ---

interface CoveragePoint {
  position: [number, number];
  weight: number;
}

export function createCoverageHeatmapLayer(cells: CoverageGridCell[]) {
  const points: CoveragePoint[] = cells.map((cell) => ({
    position: [
      cell.lon_cell + GRID_SIZE / 2,
      cell.lat_cell + GRID_SIZE / 2,
    ],
    weight: 1 - (cell.composite_score ?? 0), // low coverage = hot
  }));

  return new HeatmapLayer<CoveragePoint>({
    id: "anomaly-coverage-heatmap",
    data: points,
    getPosition: (d) => d.position,
    getWeight: (d) => d.weight,
    radiusPixels: 40,
    intensity: 1.5,
    threshold: 0.1,
    colorRange: [
      [255, 255, 178],
      [254, 204, 92],
      [253, 141, 60],
      [240, 59, 32],
      [189, 0, 38],
    ],
    pickable: false,
  });
}
