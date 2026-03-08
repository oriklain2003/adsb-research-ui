export type RGBA = [number, number, number, number];

export const GROUND_COLOR: RGBA = [128, 128, 128, 200];

const ALTITUDE_STOPS: [number, RGBA][] = [
  [0, [255, 255, 80, 230]],
  [2000, [80, 220, 80, 230]],
  [10000, [80, 220, 220, 230]],
  [20000, [80, 80, 255, 230]],
  [30000, [180, 80, 255, 230]],
  [45000, [255, 40, 40, 230]],
];

export function altitudeToColor(
  altBaro: number | null,
  onGround: boolean | null,
): RGBA {
  if (onGround) return GROUND_COLOR;
  if (altBaro == null) return GROUND_COLOR;

  const alt = Math.max(0, Math.min(45000, altBaro));

  for (let i = 0; i < ALTITUDE_STOPS.length - 1; i++) {
    const [altLow, colorLow] = ALTITUDE_STOPS[i];
    const [altHigh, colorHigh] = ALTITUDE_STOPS[i + 1];
    if (alt >= altLow && alt <= altHigh) {
      const t = (alt - altLow) / (altHigh - altLow);
      return [
        Math.round(colorLow[0] + t * (colorHigh[0] - colorLow[0])),
        Math.round(colorLow[1] + t * (colorHigh[1] - colorLow[1])),
        Math.round(colorLow[2] + t * (colorHigh[2] - colorLow[2])),
        Math.round(colorLow[3] + t * (colorHigh[3] - colorLow[3])),
      ];
    }
  }

  // Above max stop
  return ALTITUDE_STOPS[ALTITUDE_STOPS.length - 1][1];
}
