import { useCallback, useMemo, useState } from "react";
import { Map, NavigationControl, useMap } from "react-map-gl/maplibre";
import DeckGLOverlay from "./DeckGLOverlay";
import MapControls from "./MapControls";
import AircraftCount from "./AircraftCount";
import ConnectionStatus from "./ConnectionStatus";
import UpdateTimer from "./UpdateTimer";
import AircraftDetailPanel from "./AircraftDetailPanel";
import HexSearchPanel from "./HexSearchPanel";
import PlaybackControls from "./PlaybackControls";
import PlaybackInfoCard from "./PlaybackInfoCard";
import AnomalyTogglePanel from "./AnomalyTogglePanel";
import AnomalyDetailPanel from "./AnomalyDetailPanel";
import JammingHourSlider from "./JammingHourSlider";
import JammingCellDetailPanel from "./JammingCellDetailPanel";
import BatchAnomalyTogglePanel from "./BatchAnomalyTogglePanel";
import BatchAnomalyDetailPanel from "./BatchAnomalyDetailPanel";
import { useAircraftData } from "../hooks/useAircraftData";
import { useAircraftDetail } from "../hooks/useAircraftDetail";
import { useAircraftTrail } from "../hooks/useAircraftTrail";
import { useTrailPlayback } from "../hooks/useTrailPlayback";
import { useAnomalyLayers } from "../hooks/useAnomalyLayers";
import { useBatchAnomalyLayers } from "../hooks/useBatchAnomalyLayers";
import { createAircraftLayer } from "./AircraftLayer";
import { createTrailLayer, createPlaybackAircraftLayer } from "./TrailLayer";
import { DEFAULT_VIEW, DARK_MATTER_STYLE, API_URL } from "../lib/constants";
import type { TrailPoint } from "../types/aircraft";

function MapContent() {
  const { aircraft, activeCount, wsState, colorTick, lastSnapshotAt, animTick, liveEnabled, setLiveEnabled } =
    useAircraftData();

  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const { trail } = useAircraftTrail(selectedHex, aircraft);
  const { detail, loading: detailLoading } = useAircraftDetail(selectedHex);

  // Search / playback state
  const [searchOpen, setSearchOpen] = useState(false);
  const [anomalyPanelOpen, setAnomalyPanelOpen] = useState(false);
  const [batchAnomalyPanelOpen, setBatchAnomalyPanelOpen] = useState(false);
  const [playbackTrail, setPlaybackTrail] = useState<TrailPoint[]>([]);
  const [playbackActive, setPlaybackActive] = useState(false);
  const playback = useTrailPlayback(playbackTrail);

  // Anomaly layers
  const anomaly = useAnomalyLayers();
  const batchAnomaly = useBatchAnomalyLayers();

  const { current: map } = useMap();

  const liveAircraft = aircraft.find((ac) => ac.hex === selectedHex);
  const panelData = selectedHex
    ? ({ ...detail, ...liveAircraft } as Record<string, unknown>)
    : null;

  // Fit map to trail bounds
  const fitTrailBounds = useCallback(
    (points: TrailPoint[]) => {
      if (!map || points.length === 0) return;
      let minLon = Infinity, maxLon = -Infinity;
      let minLat = Infinity, maxLat = -Infinity;
      for (const p of points) {
        if (p.lat == null || p.lon == null) continue;
        minLon = Math.min(minLon, p.lon);
        maxLon = Math.max(maxLon, p.lon);
        minLat = Math.min(minLat, p.lat);
        maxLat = Math.max(maxLat, p.lat);
      }
      if (!isFinite(minLon)) return;
      map.fitBounds(
        [[minLon, minLat], [maxLon, maxLat]],
        { padding: 60, duration: 1000 },
      );
    },
    [map],
  );

  // Handle flight selection from search panel
  const handleSelectFlight = useCallback(
    (hex: string, startTs: string, endTs: string) => {
      // Clear live selection
      setSelectedHex(null);

      fetch(
        `${API_URL}/api/aircraft/${hex}/trail?start_ts=${encodeURIComponent(startTs)}&end_ts=${encodeURIComponent(endTs)}`,
      )
        .then((res) => res.json())
        .then((data: TrailPoint[]) => {
          setPlaybackTrail(data);
          setPlaybackActive(true);
          setSearchOpen(false);
          fitTrailBounds(data);
        })
        .catch((err) => console.error("Failed to fetch flight trail:", err));
    },
    [fitTrailBounds],
  );

  const closePlayback = useCallback(() => {
    setPlaybackActive(false);
    setPlaybackTrail([]);
  }, []);

  // Handle anomaly event replay
  const handleAnomalyReplay = useCallback(
    (hex: string, startTs: string, endTs: string) => {
      anomaly.setSelectedEvent(null);
      handleSelectFlight(hex, startTs, endTs);
    },
    [handleSelectFlight, anomaly],
  );

  // Handle jamming cell flight replay
  const handleJammingReplay = useCallback(
    (hex: string, startTs: string, endTs: string) => {
      anomaly.setSelectedJammingCell(null);
      handleSelectFlight(hex, startTs, endTs);
    },
    [handleSelectFlight, anomaly],
  );

  // Handle batch anomaly replay
  const handleBatchAnomalyReplay = useCallback(
    (hex: string, startTs: string, endTs: string) => {
      batchAnomaly.setSelectedEvent(null);
      handleSelectFlight(hex, startTs, endTs);
    },
    [handleSelectFlight, batchAnomaly],
  );

  // Handle batch anomaly full flight
  const handleBatchAnomalyFullFlight = useCallback(
    (hex: string, startTs: string) => {
      batchAnomaly.setSelectedEvent(null);
      // Fetch flights for this hex and find the segment overlapping startTs
      fetch(`${API_URL}/api/aircraft/${hex}/flights`)
        .then((res) => res.json())
        .then((flights: Array<{ start_ts: string; end_ts: string }>) => {
          const eventTime = new Date(startTs).getTime();
          const match = flights.find((f) => {
            const s = new Date(f.start_ts).getTime();
            const e = new Date(f.end_ts).getTime();
            return eventTime >= s && eventTime <= e;
          });
          if (match) {
            handleSelectFlight(hex, match.start_ts, match.end_ts);
          } else if (flights.length > 0) {
            // Fallback: find closest flight
            flights.sort(
              (a, b) =>
                Math.abs(new Date(a.start_ts).getTime() - eventTime) -
                Math.abs(new Date(b.start_ts).getTime() - eventTime),
            );
            handleSelectFlight(hex, flights[0].start_ts, flights[0].end_ts);
          }
        })
        .catch((err) => console.error("Failed to fetch flights for full flight:", err));
    },
    [handleSelectFlight, batchAnomaly],
  );

  const layers = useMemo(() => {
    const result = [createAircraftLayer(aircraft, colorTick, animTick, setSelectedHex)];

    // Live trail for clicked aircraft
    if (selectedHex && trail.length > 0) {
      result.push(createTrailLayer(trail) as never);
    }

    // Playback trail + animated aircraft
    if (playbackActive && playbackTrail.length > 0) {
      result.push(createTrailLayer(playbackTrail, "playback-trail") as never);
      result.push(
        createPlaybackAircraftLayer(playback.currentPoint, playback.currentIndex) as never,
      );
    }

    // Anomaly layers
    for (const layer of anomaly.layers) {
      result.push(layer as never);
    }

    // Batch anomaly layers
    for (const layer of batchAnomaly.layers) {
      result.push(layer as never);
    }

    return result;
  }, [
    aircraft, colorTick, animTick, selectedHex, trail,
    playbackActive, playbackTrail, playback.currentPoint, playback.currentIndex,
    anomaly.layers, batchAnomaly.layers,
  ]);

  return (
    <>
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        <AircraftCount count={activeCount} />
        <ConnectionStatus state={wsState} liveEnabled={liveEnabled} onToggle={() => setLiveEnabled(!liveEnabled)} />
        <UpdateTimer lastSnapshotAt={lastSnapshotAt} />
        <button
          onClick={() => setSearchOpen((v) => !v)}
          className="bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:text-white text-xs px-2.5 py-1.5 rounded border border-gray-700/50 transition-colors text-left"
        >
          Search hex...
        </button>
        <button
          onClick={() => setAnomalyPanelOpen((v) => !v)}
          className="bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:text-white text-xs px-2.5 py-1.5 rounded border border-gray-700/50 transition-colors text-left"
        >
          Anomalies
        </button>
        {anomalyPanelOpen && (
          <AnomalyTogglePanel
            runs={anomaly.runs}
            selectedRunId={anomaly.selectedRunId}
            onSelectRun={anomaly.setSelectedRunId}
            visibility={anomaly.visibility}
            onVisibilityChange={anomaly.setVisibility}
            jammingHours={anomaly.jammingHours}
            selectedHour={anomaly.selectedHour}
            onSelectHour={anomaly.setSelectedHour}
            onClose={() => setAnomalyPanelOpen(false)}
          />
        )}
        <button
          onClick={() => setBatchAnomalyPanelOpen((v) => !v)}
          className="bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:text-white text-xs px-2.5 py-1.5 rounded border border-gray-700/50 transition-colors text-left"
        >
          Batch Anomalies
        </button>
        {batchAnomalyPanelOpen && (
          <BatchAnomalyTogglePanel
            visibility={batchAnomaly.visibility}
            onVisibilityChange={batchAnomaly.setVisibility}
            timePreset={batchAnomaly.timePreset}
            onTimePresetChange={batchAnomaly.setTimePreset}
            loading={batchAnomaly.loading}
            eventCounts={batchAnomaly.eventCounts}
            onClose={() => setBatchAnomalyPanelOpen(false)}
          />
        )}
      </div>

      <NavigationControl position="top-right" />
      <DeckGLOverlay layers={layers} />
      <MapControls />

      {selectedHex && (
        <AircraftDetailPanel
          hex={selectedHex}
          data={panelData}
          loading={detailLoading}
          onClose={() => setSelectedHex(null)}
        />
      )}

      {searchOpen && (
        <HexSearchPanel
          onSelectFlight={handleSelectFlight}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {playbackActive && playbackTrail.length > 0 && (
        <>
          <PlaybackInfoCard point={playback.currentPoint} />
          <PlaybackControls
            playback={playback}
            trail={playbackTrail}
            onClose={closePlayback}
          />
        </>
      )}

      {anomaly.selectedEvent && (
        <AnomalyDetailPanel
          event={anomaly.selectedEvent}
          onClose={() => anomaly.setSelectedEvent(null)}
          onReplay={handleAnomalyReplay}
        />
      )}

      {batchAnomaly.selectedEvent && (
        <BatchAnomalyDetailPanel
          event={batchAnomaly.selectedEvent}
          onClose={() => batchAnomaly.setSelectedEvent(null)}
          onReplay={handleBatchAnomalyReplay}
          onFullFlight={handleBatchAnomalyFullFlight}
        />
      )}

      {anomaly.selectedJammingCell && (
        <JammingCellDetailPanel
          cell={anomaly.selectedJammingCell}
          onClose={() => anomaly.setSelectedJammingCell(null)}
          onReplay={handleJammingReplay}
        />
      )}

      {anomaly.visibility.jammingGrid && !playbackActive && (
        <JammingHourSlider
          hours={anomaly.jammingHours}
          selectedHour={anomaly.selectedHour}
          onSelectHour={anomaly.setSelectedHour}
        />
      )}
    </>
  );
}

export default function AircraftMap() {
  return (
    <div className="relative h-screen w-screen">
      <Map
        id="main-map"
        initialViewState={DEFAULT_VIEW}
        mapStyle={DARK_MATTER_STYLE}
        style={{ width: "100%", height: "100%" }}
      >
        <MapContent />
      </Map>
    </div>
  );
}
