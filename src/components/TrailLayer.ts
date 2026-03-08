import { IconLayer, PathLayer } from "@deck.gl/layers";
import { altitudeToColor, type RGBA } from "../lib/colors";
import type { TrailPoint } from "../types/aircraft";

interface TrailSegment {
  path: [number, number][];
  color: RGBA;
}

function trailToSegments(points: TrailPoint[]): TrailSegment[] {
  const segments: TrailSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i];
    const next = points[i + 1];
    if (p.lat == null || p.lon == null || next.lat == null || next.lon == null) {
      continue;
    }
    segments.push({
      path: [
        [p.lon, p.lat],
        [next.lon, next.lat],
      ],
      color: altitudeToColor(p.alt_baro, p.on_ground),
    });
  }
  return segments;
}

export function createTrailLayer(points: TrailPoint[], id = "flight-trail") {
  const segments = trailToSegments(points);
  return new PathLayer<TrailSegment>({
    id,
    data: segments,
    getPath: (d) => d.path,
    getColor: (d) => d.color,
    getWidth: 3,
    widthUnits: "pixels" as const,
    widthMinPixels: 2,
    widthMaxPixels: 6,
    capRounded: true,
    jointRounded: true,
    pickable: false,
  });
}

export function createPlaybackAircraftLayer(
  point: TrailPoint | null,
  tick: number,
  id = "playback-aircraft",
  overrideColor?: [number, number, number, number],
) {
  if (!point || point.lat == null || point.lon == null) {
    return new IconLayer({
      id,
      data: [],
      getPosition: () => [0, 0],
      getIcon: () => "marker",
    });
  }
  return new IconLayer<TrailPoint>({
    id,
    data: [point],
    getPosition: (d) => [d.lon!, d.lat!],
    getAngle: (d) => -(d.track ?? 0),
    getIcon: () => "marker",
    iconAtlas: "/aircraft-icon.svg",
    iconMapping: {
      marker: { x: 0, y: 0, width: 64, height: 64, mask: true },
    },
    getSize: 28,
    sizeUnits: "pixels" as const,
    getColor: overrideColor ?? altitudeToColor(point.alt_baro, point.on_ground),
    updateTriggers: {
      getPosition: [tick],
      getAngle: [tick],
      getColor: [tick],
    },
    pickable: false,
  });
}
