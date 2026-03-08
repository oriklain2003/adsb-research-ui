import { useMap } from "react-map-gl/maplibre";
import { DEFAULT_VIEW } from "../lib/constants";

export default function MapControls() {
  const { current: map } = useMap();

  const handleReset = () => {
    map?.flyTo({
      center: [DEFAULT_VIEW.longitude, DEFAULT_VIEW.latitude],
      zoom: DEFAULT_VIEW.zoom,
      pitch: DEFAULT_VIEW.pitch,
      bearing: DEFAULT_VIEW.bearing,
    });
  };

  return (
    <button
      onClick={handleReset}
      className="absolute bottom-6 left-3 z-10 rounded bg-gray-800/80 px-3 py-1.5 text-xs font-medium text-gray-200 shadow-md backdrop-blur-sm hover:bg-gray-700/90 transition-colors cursor-pointer"
    >
      Reset View
    </button>
  );
}
