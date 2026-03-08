/**
 * Aircraft icon layer rendered via deck.gl IconLayer.
 *
 * Position and angle are **not** animated via deck.gl's `transitions` config.
 * Instead, each AircraftDisplay carries its own `fromLon/fromLat/fromTrack` and
 * `transitionStart`, and the accessors here compute the interpolated value on
 * each evaluation. The `animTick` updateTrigger (driven by a rAF loop in
 * useAircraftData) forces deck.gl to re-call these accessors at ~30 fps.
 *
 * See useAircraftData.ts for the full rationale.
 */
import { IconLayer } from "@deck.gl/layers";
import type { PickingInfo } from "@deck.gl/core";
import type { AircraftDisplay } from "../types/aircraft";
import { computeOpacity } from "../lib/interpolation";
import { TRANSITION_DURATION_MS } from "../lib/constants";

const ICON_URL = "/aircraft-icon.svg";

const ICON_MAPPING = {
  aircraft: { x: 0, y: 0, width: 64, height: 64, mask: true },
} as const;

// Module-level scratch array — deck.gl copies values before the next call
const scratch: [number, number, number, number] = [0, 0, 0, 0];

/** Linear interpolation between two values. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function createAircraftLayer(
  data: AircraftDisplay[],
  colorTick: number,
  animTick: number,
  onSelect: (hex: string) => void,
) {
  return new IconLayer<AircraftDisplay>({
    id: "aircraft-icons",
    data,
    iconAtlas: ICON_URL,
    iconMapping: ICON_MAPPING,
    getIcon: () => "aircraft",
    // Lerp from snapshot-start position toward target; t is clamped to [0, 1].
    getPosition: (d) => {
      const t = Math.min(1, (Date.now() - d.transitionStart) / TRANSITION_DURATION_MS);
      return [lerp(d.fromLon, d.lon!, t), lerp(d.fromLat, d.lat!, t)];
    },
    getAngle: (d) => {
      const t = Math.min(1, (Date.now() - d.transitionStart) / TRANSITION_DURATION_MS);
      return -(lerp(d.fromTrack, d.track ?? 0, t));
    },
    getColor: (d) => {
      const opacity = computeOpacity(d.receivedAt, Date.now());
      if (opacity <= 0) {
        scratch[0] = 0;
        scratch[1] = 0;
        scratch[2] = 0;
        scratch[3] = 0;
        return scratch;
      }
      const bc = d.baseColor;
      scratch[0] = bc[0];
      scratch[1] = bc[1];
      scratch[2] = bc[2];
      scratch[3] = Math.round((bc[3] * opacity) / 255);
      return scratch;
    },
    getSize: 24,
    sizeScale: 1,
    sizeUnits: "pixels" as const,
    billboard: false,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 80],
    onClick: (info: PickingInfo<AircraftDisplay>) => {
      if (info.object) onSelect(info.object.hex);
    },
    updateTriggers: {
      getColor: [colorTick],
      getPosition: [animTick],
      getAngle: [animTick],
    },
  });
}
