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
import NearbySearchModal from "./NearbySearchModal";
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
import type { TrailPoint, NearbyFlightResult } from "../types/aircraft";

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
  const [playbackTypeDesc, setPlaybackTypeDesc] = useState<string | null>(null);
  const [playbackDbFlags, setPlaybackDbFlags] = useState<number | null>(null);

  // Nearby flight state
  const [nearbyTrail, setNearbyTrail] = useState<TrailPoint[]>([]);
  const [nearbyInfo, setNearbyInfo] = useState<NearbyFlightResult | null>(null);
  const [nearbySearchOpen, setNearbySearchOpen] = useState(false);

  // Override time range for dual-trail sync
  const overrideTimeRange = useMemo(() => {
    if (nearbyTrail.length === 0 || playbackTrail.length === 0) return undefined;
    const mainTimes = playbackTrail.map((p) => new Date(p.ts).getTime());
    const nearbyTimes = nearbyTrail.map((p) => new Date(p.ts).getTime());
    return {
      startTime: Math.min(mainTimes[0], nearbyTimes[0]),
      endTime: Math.max(mainTimes[mainTimes.length - 1], nearbyTimes[nearbyTimes.length - 1]),
    };
  }, [playbackTrail, nearbyTrail]);

  const playback = useTrailPlayback(playbackTrail, overrideTimeRange);

  // Compute the nearby flight's current point from playback.currentTime
  const nearbyCurrentPoint = useMemo(() => {
    if (!nearbyTrail.length || !playback.currentTime) return null;
    const timestamps = nearbyTrail.map((p) => new Date(p.ts).getTime());
    // Before first point: show at starting position
    if (playback.currentTime <= timestamps[0]) return nearbyTrail[0];
    // After last point: show at ending position
    if (playback.currentTime >= timestamps[timestamps.length - 1]) return nearbyTrail[nearbyTrail.length - 1];
    // Find closest point <= currentTime
    let idx = 0;
    for (let i = 0; i < timestamps.length - 1; i++) {
      if (timestamps[i + 1] > playback.currentTime) break;
      idx = i + 1;
    }
    return nearbyTrail[idx];
  }, [nearbyTrail, playback.currentTime]);

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

      // Fetch trail and aircraft detail in parallel
      const trailP = fetch(
        `${API_URL}/api/aircraft/${hex}/trail?start_ts=${encodeURIComponent(startTs)}&end_ts=${encodeURIComponent(endTs)}`,
      ).then((res) => res.json()) as Promise<TrailPoint[]>;

      const detailP = fetch(`${API_URL}/api/aircraft/${hex}`)
        .then((res) => res.json())
        .catch(() => null) as Promise<{ type_description?: string | null; icao_type?: string | null; db_flags?: number | null; registration?: string | null } | null>;

      Promise.all([trailP, detailP])
        .then(([data, detail]) => {
          setPlaybackTrail(data);
          setPlaybackTypeDesc(detail?.type_description ?? detail?.icao_type ?? null);
          setPlaybackDbFlags(detail?.db_flags ?? null);
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
    setPlaybackTypeDesc(null);
    setPlaybackDbFlags(null);
    setNearbyTrail([]);
    setNearbyInfo(null);
  }, []);

  // Handle "Find Nearby" button click
  const handleFindNearby = useCallback(() => {
    if (!playback.currentPoint) return;
    playback.pause();
    setNearbySearchOpen(true);
  }, [playback]);

  // Handle nearby flight selection from modal
  const handleSelectNearby = useCallback(
    (result: NearbyFlightResult) => {
      setNearbySearchOpen(false);
      setNearbyInfo(result);
      // Fetch trail for the selected nearby flight
      fetch(
        `${API_URL}/api/aircraft/${result.hex}/trail?start_ts=${encodeURIComponent(result.start_ts)}&end_ts=${encodeURIComponent(result.end_ts)}`,
      )
        .then((res) => res.json())
        .then((data: TrailPoint[]) => {
          setNearbyTrail(data);
          // Fit bounds to include both trails
          fitTrailBounds([...playbackTrail, ...data]);
        })
        .catch((err) => console.error("Failed to fetch nearby trail:", err));
    },
    [fitTrailBounds, playbackTrail],
  );

  // Handle nearby flight removal
  const handleRemoveNearby = useCallback(() => {
    setNearbyTrail([]);
    setNearbyInfo(null);
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

  // Handle batch anomaly full flight — fetch trail with 2h padding around the
  // event instead of relying on flight-segment lookup (which can miss pre-spoof
  // positions when the spoof causes a segment split).
  const handleBatchAnomalyFullFlight = useCallback(
    (hex: string, startTs: string) => {
      batchAnomaly.setSelectedEvent(null);
      const padMs = 2 * 60 * 60 * 1000; // 2 hours
      const start = new Date(new Date(startTs).getTime() - padMs).toISOString();
      const end = new Date(new Date(startTs).getTime() + padMs).toISOString();
      handleSelectFlight(hex, start, end);
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

    // Nearby trail + animated aircraft
    if (playbackActive && nearbyTrail.length > 0) {
      result.push(createTrailLayer(nearbyTrail, "nearby-trail") as never);
      result.push(
        createPlaybackAircraftLayer(
          nearbyCurrentPoint,
          playback.currentIndex,
          "playback-nearby-aircraft",
          [255, 191, 0, 255], // Amber color for nearby aircraft
        ) as never,
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
    nearbyTrail, nearbyCurrentPoint,
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
          Detection v1
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
          Detection v2
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
          <div className="absolute top-3 right-14 z-20 flex flex-col gap-2">
            <PlaybackInfoCard
              point={playback.currentPoint}
              typeDescription={playbackTypeDesc}
              dbFlagsOverride={playbackDbFlags}
            />
            {nearbyTrail.length > 0 && nearbyCurrentPoint && (
              <PlaybackInfoCard
                point={nearbyCurrentPoint}
                accentColor="border-amber-500/50"
                typeDescription={nearbyInfo?.type_description}
                onRemove={handleRemoveNearby}
              />
            )}
          </div>
          <PlaybackControls
            playback={playback}
            trail={playbackTrail}
            onClose={closePlayback}
            onFindNearby={handleFindNearby}
          />
        </>
      )}

      {nearbySearchOpen && playback.currentPoint && (
        <NearbySearchModal
          lat={playback.currentPoint.lat!}
          lon={playback.currentPoint.lon!}
          time={playback.currentPoint.ts}
          excludeHex={playbackTrail[0]?.hex ?? ""}
          onSelect={handleSelectNearby}
          onClose={() => setNearbySearchOpen(false)}
        />
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
