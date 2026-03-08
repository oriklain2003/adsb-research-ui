import { useState, useMemo, useCallback } from "react";
import type { Layer } from "@deck.gl/core";
import type { AnomalyEvent, AnomalyLayerVisibility, JammingGridCell } from "../types/anomaly";
import { useDetectionRuns } from "./useDetectionRuns";
import { useAnomalyEvents } from "./useAnomalyEvents";
import { useJammingGrid } from "./useJammingGrid";
import { useCoverageGrid } from "./useCoverageGrid";
import {
  createSpoofingLayer,
  createSpoofingOriginLayer,
  createSpoofingLineLayer,
  createJammingGridLayer,
  createTransmitterOffLayer,
  createCoverageHeatmapLayer,
} from "../components/AnomalyLayers";

export interface AnomalyLayersState {
  layers: Layer[];
  visibility: AnomalyLayerVisibility;
  setVisibility: (v: AnomalyLayerVisibility) => void;
  selectedEvent: AnomalyEvent | null;
  setSelectedEvent: (e: AnomalyEvent | null) => void;
  selectedJammingCell: JammingGridCell | null;
  setSelectedJammingCell: (c: JammingGridCell | null) => void;
  selectedRunId: number | null;
  setSelectedRunId: (id: number | null) => void;
  runs: ReturnType<typeof useDetectionRuns>["runs"];
  runsLoading: boolean;
  jammingHours: string[];
  selectedHour: string | null;
  setSelectedHour: (h: string | null) => void;
}

export function useAnomalyLayers(): AnomalyLayersState {
  const { runs, latestRun, loading: runsLoading } = useDetectionRuns();
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const activeRunId = selectedRunId ?? latestRun?.id ?? null;

  const [visibility, setVisibility] = useState<AnomalyLayerVisibility>({
    spoofing: false,
    spoofingOriginLines: false,
    jammingGrid: false,
    transmitterOff: false,
    coverageHeatmap: false,
  });

  const [selectedEvent, setSelectedEvent] = useState<AnomalyEvent | null>(null);
  const [selectedJammingCell, setSelectedJammingCell] = useState<JammingGridCell | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  // Fetch data based on what's visible
  const needEvents = visibility.spoofing || visibility.transmitterOff;
  const { events } = useAnomalyEvents(needEvents ? activeRunId : null);
  const { cells: jammingCells, hours: jammingHours } = useJammingGrid(
    visibility.jammingGrid ? activeRunId : null,
    selectedHour,
  );
  const { cells: coverageCells } = useCoverageGrid(
    visibility.coverageHeatmap ? activeRunId : null,
  );

  // Auto-select first hour when jamming becomes visible
  const handleSetSelectedHour = useCallback((h: string | null) => {
    setSelectedHour(h);
  }, []);

  // Build layers
  const layers = useMemo(() => {
    const result: Layer[] = [];

    if (visibility.coverageHeatmap && coverageCells.length > 0) {
      result.push(createCoverageHeatmapLayer(coverageCells) as unknown as Layer);
    }

    if (visibility.jammingGrid && jammingCells.length > 0) {
      result.push(
        createJammingGridLayer(jammingCells, setSelectedJammingCell) as unknown as Layer,
      );
    }

    if (visibility.transmitterOff) {
      const shutdowns = events.filter((e) => e.category === "transponder_off");
      if (shutdowns.length > 0) {
        result.push(
          createTransmitterOffLayer(shutdowns, setSelectedEvent) as unknown as Layer,
        );
      }
    }

    if (visibility.spoofing) {
      const spoofing = events.filter(
        (e) => e.category === "gps_spoofing" || e.category === "gps_jamming" || e.category === "probable_jamming",
      );
      if (spoofing.length > 0) {
        result.push(createSpoofingLayer(spoofing, setSelectedEvent) as unknown as Layer);
        if (visibility.spoofingOriginLines) {
          result.push(createSpoofingOriginLayer(spoofing) as unknown as Layer);
          result.push(createSpoofingLineLayer(spoofing) as unknown as Layer);
        }
      }
    }

    return result;
  }, [
    visibility, events, jammingCells, coverageCells,
  ]);

  return {
    layers,
    visibility,
    setVisibility,
    selectedEvent,
    setSelectedEvent,
    selectedJammingCell,
    setSelectedJammingCell,
    selectedRunId: activeRunId,
    setSelectedRunId,
    runs,
    runsLoading,
    jammingHours,
    selectedHour,
    setSelectedHour: handleSetSelectedHour,
  };
}
